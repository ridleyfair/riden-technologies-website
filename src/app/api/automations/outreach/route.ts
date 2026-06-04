import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { sendMail, isMsConfigured } from "@/lib/ms-graph";
import { buildOutreachEmailHtml } from "@/lib/outreach-email";

const RATE_LIMIT_PER_RUN = 20;

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();

  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE outreach_status = 'queued'   AND opt_out = FALSE AND approved = FALSE) AS queued,
      COUNT(*) FILTER (WHERE outreach_status = 'queued'   AND opt_out = FALSE AND approved = TRUE)  AS approved,
      COUNT(*) FILTER (WHERE outreach_status = 'sent')    AS sent,
      COUNT(*) FILTER (WHERE outreach_status = 'responded') AS responded,
      COUNT(*) FILTER (WHERE outreach_status = 'failed')  AS failed,
      COUNT(*) FILTER (WHERE opt_out = TRUE)              AS opted_out,
      COUNT(*) FILTER (WHERE converted_lead_id IS NOT NULL) AS leads_created
    FROM "OutreachRecord"
  `;

  const stats = rows[0] ?? {};
  return NextResponse.json({
    queued:       Number(stats.queued      ?? 0),
    approved:     Number(stats.approved    ?? 0),
    sent:         Number(stats.sent        ?? 0),
    responded:    Number(stats.responded   ?? 0),
    failed:       Number(stats.failed      ?? 0),
    opted_out:    Number(stats.opted_out   ?? 0),
    leads_created: Number(stats.leads_created ?? 0),
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

// Scan GeneratedSite for eligible records and add to queue
async function handleQueue(_req: NextRequest) {
  const sql  = getDb();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://ridentechnologies.com";

  // Find GeneratedSites with email + previewUrl not already queued / opted-out
  const sites = await sql`
    SELECT
      gs.id, gs."businessName", gs."outreachEmail", gs."previewUrl",
      gs.industry, gs."clientName"
    FROM "GeneratedSite" gs
    WHERE gs."outreachEmail" IS NOT NULL
      AND gs."outreachEmail" != ''
      AND gs."previewUrl"    IS NOT NULL
      AND gs."previewUrl"    != ''
      AND NOT EXISTS (
        SELECT 1 FROM "OutreachRecord" r
        WHERE r.generated_site_id = gs.id
      )
    ORDER BY gs."createdAt" DESC
    LIMIT 200
  `;

  if (sites.length === 0) {
    return NextResponse.json({ queued: 0, message: "No new eligible sites found." });
  }

  // Also filter out businesses already in Lead table (by email)
  const emails     = sites.map((s) => s.outreachEmail as string);
  const existLeads = await sql`
    SELECT LOWER(email) AS email FROM "Lead"
    WHERE LOWER(email) = ANY(${emails.map((e: string) => e.toLowerCase())})
  `;
  const leadEmails = new Set(existLeads.map((r) => String(r.email)));

  const eligible = (sites as Record<string, unknown>[]).filter(
    (s) => !leadEmails.has(String(s.outreachEmail).toLowerCase())
  );

  if (eligible.length === 0) {
    return NextResponse.json({ queued: 0, message: "All eligible businesses already have Leads." });
  }

  // Insert OutreachRecord rows (ignore duplicates via unique index)
  let queued = 0;
  for (const site of eligible) {
    try {
      await sql`
        INSERT INTO "OutreachRecord"
          (generated_site_id, business_name, business_email, preview_url, industry, location)
        VALUES (
          ${site.id as string},
          ${(site.businessName ?? site.clientName ?? "") as string},
          ${site.outreachEmail as string},
          ${site.previewUrl as string},
          ${(site.industry ?? "") as string},
          ${""}
        )
        ON CONFLICT DO NOTHING
      `;
      queued++;
    } catch { /* skip duplicates */ }
  }

  return NextResponse.json({ queued, total_eligible: eligible.length });
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

  const whereApproved = mode === "auto"
    ? sql`outreach_status = 'queued' AND opt_out = FALSE`
    : sql`outreach_status = 'queued' AND opt_out = FALSE AND approved = TRUE`;

  const records = await sql`
    SELECT * FROM "OutreachRecord"
    WHERE ${whereApproved}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;

  if (records.length === 0) {
    return NextResponse.json({ sent: 0, message: mode === "auto" ? "No queued records." : "No approved records. Approve emails first." });
  }

  let sent = 0, failed = 0;
  const errors: string[] = [];

  for (const record of records as Record<string, unknown>[]) {
    try {
      const formUrl      = `${origin}/website-interest/${record.form_token}`;
      const unsubscribeUrl = `${origin}/unsubscribe/${record.form_token}`;
      const { subject, html } = buildOutreachEmailHtml({
        businessName:   String(record.business_name ?? ""),
        trade:          String(record.industry ?? ""),
        location:       String(record.location  ?? ""),
        previewUrl:     String(record.preview_url ?? ""),
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
