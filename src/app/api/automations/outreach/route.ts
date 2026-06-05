import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { sendMail, isMsConfigured } from "@/lib/ms-graph";
import { buildOutreachEmailHtml } from "@/lib/outreach-email";

const RATE_LIMIT_PER_RUN = 20;

function getScraperUrl() {
  let env: Record<string, string | undefined> = process.env as Record<string, string | undefined>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const cf = getCloudflareContext().env as Record<string, string | undefined>;
    if (cf.SCRAPER_API_URL) env = { ...env, ...cf };
  } catch { /* local dev */ }
  return env.SCRAPER_API_URL ?? "http://localhost:8000";
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();

  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE outreach_status = 'queued'     AND opt_out = FALSE AND approved = FALSE) AS queued,
      COUNT(*) FILTER (WHERE outreach_status = 'queued'     AND opt_out = FALSE AND approved = TRUE)  AS approved,
      COUNT(*) FILTER (WHERE outreach_status = 'sent')      AS sent,
      COUNT(*) FILTER (WHERE outreach_status = 'responded') AS responded,
      COUNT(*) FILTER (WHERE outreach_status = 'failed')    AS failed,
      COUNT(*) FILTER (WHERE opt_out = TRUE)                AS opted_out,
      COUNT(*) FILTER (WHERE converted_lead_id    IS NOT NULL) AS leads_created,
      COUNT(*) FILTER (WHERE converted_project_id IS NOT NULL) AS projects_created,
      COUNT(*) FILTER (WHERE form_started_at      IS NOT NULL) AS forms_started
    FROM "OutreachRecord"
  `;

  const stats = rows[0] ?? {};
  return NextResponse.json({
    queued:           Number(stats.queued           ?? 0),
    approved:         Number(stats.approved         ?? 0),
    sent:             Number(stats.sent             ?? 0),
    responded:        Number(stats.responded        ?? 0),
    failed:           Number(stats.failed           ?? 0),
    opted_out:        Number(stats.opted_out        ?? 0),
    leads_created:    Number(stats.leads_created    ?? 0),
    projects_created: Number(stats.projects_created ?? 0),
    forms_started:    Number(stats.forms_started    ?? 0),
    ms_configured: isMsConfigured(),
  });
}

// ── Queue / Send ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const body   = await req.json() as { action: string; limit?: number; mode?: string };
  const action = body.action;

  if (action === "queue") return handleQueue(req);
  if (action === "send")  return handleSend(body.limit ?? RATE_LIMIT_PER_RUN, body.mode ?? "approve");
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

type RailwayBusiness = {
  id: string; name: string; email: string | null; phone: string | null;
  city: string | null; category: string | null; lead_score: { lead_tier: string } | null;
};

// Fetch all warm + hot leads with email from Railway, paginating through all results
async function fetchWarmLeadsFromRailway(): Promise<RailwayBusiness[]> {
  const scraperUrl = getScraperUrl();
  const results: RailwayBusiness[] = [];

  for (const tier of ["hot", "warm"]) {
    let page = 1;
    while (true) {
      try {
        const params = new URLSearchParams({ lead_tier: tier, page_size: "200", page: String(page) });
        const res    = await fetch(`${scraperUrl}/api/v1/businesses?${params}`, {
          headers: { Accept: "application/json" },
          signal:  AbortSignal.timeout(15000),
        });
        if (!res.ok) break;
        const data  = await res.json() as { items?: RailwayBusiness[]; pages?: number };
        const items = data.items ?? [];
        results.push(...items);
        if (items.length < 200 || page >= (data.pages ?? 1)) break;
        page++;
      } catch { break; }
    }
  }

  return results;
}

// Scan warm/hot Possible Clients (Railway) for eligible records and add to queue
async function handleQueue(_req: NextRequest) {
  const sql = getDb();

  // 1. Pull all warm + hot leads from Railway
  const allLeads = await fetchWarmLeadsFromRailway();

  // 2. Filter to those with an email address
  const withEmail = allLeads.filter((b) => b.email?.trim());

  if (withEmail.length === 0) {
    return NextResponse.json({ queued: 0, message: "No warm/hot leads with an email address found in Possible Clients." });
  }

  // 3. Filter out emails already in Lead table (already converted)
  const emailList  = withEmail.map((b) => b.email!.toLowerCase());
  const existLeads = await sql`
    SELECT LOWER(email) AS email FROM "Lead"
    WHERE LOWER(email) = ANY(${emailList})
  `;
  const leadEmails = new Set(existLeads.map((r) => String(r.email)));

  // 4. Filter out emails already in OutreachRecord (already queued / sent / etc.)
  const existingRecords = await sql`
    SELECT LOWER(business_email) AS email FROM "OutreachRecord" WHERE opt_out = FALSE
  `;
  const outreachedEmails = new Set(existingRecords.map((r) => String(r.email)));

  const eligible = withEmail.filter((b) => {
    const e = b.email!.toLowerCase();
    return !leadEmails.has(e) && !outreachedEmails.has(e);
  });

  if (eligible.length === 0) {
    return NextResponse.json({ queued: 0, message: "All warm/hot leads with email already have outreach records or Leads." });
  }

  // 5. Look up any matching GeneratedSites for preview URLs (match by business name)
  const names = eligible.map((b) => b.name.toLowerCase());
  const sites  = await sql`
    SELECT "businessName", "previewUrl", id
    FROM "GeneratedSite"
    WHERE "previewUrl" IS NOT NULL AND "previewUrl" != ''
      AND LOWER("businessName") = ANY(${names})
  `;
  const siteByName = new Map(
    (sites as Record<string, string>[]).map((s) => [s.businessName.toLowerCase(), s])
  );

  // 6. Insert OutreachRecord rows
  let queued = 0;
  for (const biz of eligible) {
    try {
      const site = siteByName.get(biz.name.toLowerCase());
      await sql`
        INSERT INTO "OutreachRecord" (
          possible_client_id, generated_site_id,
          business_name, business_email, business_phone,
          preview_url, industry, location
        ) VALUES (
          ${biz.id},
          ${site?.id ?? null},
          ${biz.name},
          ${biz.email!},
          ${biz.phone ?? null},
          ${site?.previewUrl ?? null},
          ${biz.category ?? ""},
          ${biz.city ?? ""}
        )
        ON CONFLICT DO NOTHING
      `;
      queued++;
    } catch { /* skip on duplicate email */ }
  }

  return NextResponse.json({
    queued,
    total_warm_hot: withEmail.length,
    skipped_existing: withEmail.length - eligible.length,
    message: queued === 0
      ? "All eligible leads already have records."
      : `Queued ${queued} new leads (${eligible.length - queued} skipped as duplicates).`,
  });
}

// Send approved (or all queued in auto mode) emails
async function handleSend(limit: number, mode: string) {
  const sql    = getDb();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://ridentechnologies.com";

  if (!isMsConfigured()) {
    return NextResponse.json(
      { error: "Microsoft Graph not configured. Set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_SHARED_MAILBOX and ensure Mail.Send Application permission is granted." },
      { status: 503 }
    );
  }

  // Avoid nested sql fragments (not supported by Neon driver) — use two explicit queries
  const records = mode === "auto"
    ? await sql`
        SELECT * FROM "OutreachRecord"
        WHERE outreach_status = 'queued' AND opt_out = FALSE
        ORDER BY created_at ASC LIMIT ${limit}
      `
    : await sql`
        SELECT * FROM "OutreachRecord"
        WHERE outreach_status = 'queued' AND opt_out = FALSE AND approved = TRUE
        ORDER BY created_at ASC LIMIT ${limit}
      `;

  if (records.length === 0) {
    return NextResponse.json({ sent: 0, message: mode === "auto" ? "No queued records." : "No approved records. Approve emails first." });
  }

  let sent = 0, failed = 0;
  const errors: string[] = [];

  for (const record of records as Record<string, unknown>[]) {
    try {
      const formUrl      = `${origin}/client-brief/${record.form_token}`;
      const unsubscribeUrl = `${origin}/unsubscribe/${record.form_token}`;
      const { subject, html } = buildOutreachEmailHtml({
        businessName:   String(record.business_name ?? ""),
        trade:          String(record.industry  ?? ""),
        location:       String(record.location   ?? ""),
        formUrl,
        unsubscribeUrl,
      });

      await sendMail({ to: String(record.business_email), subject, html });

      await sql`
        UPDATE "OutreachRecord" SET
          outreach_status        = 'sent',
          outreach_email_sent_at = NOW(),
          updated_at             = NOW()
        WHERE id = ${record.id as string}
      `;
      sent++;
    } catch (err) {
      const msg = String(err instanceof Error ? err.message : err).slice(0, 200);
      errors.push(`${record.business_email}: ${msg}`);
      await sql`
        UPDATE "OutreachRecord" SET
          outreach_status = 'failed',
          error_message   = ${msg},
          updated_at      = NOW()
        WHERE id = ${record.id as string}
      `;
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, errors });
}
