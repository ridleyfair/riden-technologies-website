import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

const BATCH = 15;
const FETCH_TIMEOUT_MS = 6000;

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

const JUNK_PATTERNS = [
  "wixpress.com", "sentry-next", "sentry.io", "noreply", "no-reply",
  "donotreply", "mailer-daemon", "postmaster", "example.com",
  "cloudflare", "squarespace", "wordpress.com", "godaddy", "wix.com",
];

function isValidEmail(email: string): boolean {
  const e = email.toLowerCase().trim();
  if (!e.includes("@") || !e.includes(".")) return false;
  const domain = e.split("@")[1] ?? "";
  if (!domain.includes(".")) return false;
  if (JUNK_PATTERNS.some((p) => e.includes(p))) return false;
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e)) return false;
  return true;
}

async function findEmailOnWebsite(website: string): Promise<string | null> {
  const base = website.replace(/\/$/, "");
  const urls = [base, `${base}/contact`, `${base}/contact-us`, `${base}/about`];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
          "Accept": "text/html",
        },
      });
      if (!res.ok) continue;
      const html = await res.text();

      const mailtos  = [...html.matchAll(/href=["']mailto:([^"'?#\s]+)/gi)].map((m) => m[1].toLowerCase().trim());
      const patterns = [...html.matchAll(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)].map((m) => m[0].toLowerCase().trim());
      const found    = [...new Set([...mailtos, ...patterns])].filter(isValidEmail);
      if (found.length > 0) return found[0];
    } catch { /* timed out or blocked — try next URL */ }
  }
  return null;
}

type RailwayBusiness = {
  id: string; name: string; email: string | null; website: string | null;
  city: string | null; category: string | null;
};

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql        = getDb();
  const scraperUrl = getScraperUrl();

  // 1. Fetch businesses with a website from Railway (paginate all)
  const allWithWebsite: RailwayBusiness[] = [];
  try {
    let page = 1;
    while (true) {
      const res = await fetch(
        `${scraperUrl}/api/v1/businesses?has_website=true&page_size=200&page=${page}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) }
      );
      if (!res.ok) break;
      const data = await res.json() as { items?: RailwayBusiness[]; pages?: number };
      const items = data.items ?? [];
      allWithWebsite.push(...items);
      if (items.length < 200 || page >= (data.pages ?? 1)) break;
      page++;
    }
  } catch (e) {
    return NextResponse.json({ error: `Could not fetch businesses: ${String(e)}` }, { status: 502 });
  }

  // 2. Filter to businesses that have a website but no email in Railway
  const noEmail = allWithWebsite.filter((b) => !b.email?.trim() && b.website?.trim());

  if (noEmail.length === 0) {
    return NextResponse.json({ found: 0, processed: 0, message: "All businesses with websites already have emails in Railway." });
  }

  // 3. Load already-scanned business IDs from local DB (so we skip them)
  const scannedRows = await sql`SELECT business_id FROM "BusinessEmailScan"`;
  const scanned     = new Set(scannedRows.map((r) => String(r.business_id)));

  const unscanned = noEmail.filter((b) => !scanned.has(b.id));

  if (unscanned.length === 0) {
    return NextResponse.json({
      found: 0, processed: 0,
      message: `All ${noEmail.length} businesses without emails have already been scanned. No new emails found across all sites.`,
    });
  }

  // 4. Take next BATCH and scan in parallel
  const batch     = unscanned.slice(0, BATCH);
  const remaining = Math.max(0, unscanned.length - BATCH);

  const results = await Promise.all(batch.map(async (biz) => {
    const email = await findEmailOnWebsite(biz.website!);

    // Save result to local DB (email or null — either way, mark as scanned so we skip next time)
    try {
      await sql`
        INSERT INTO "BusinessEmailScan" (business_id, email, scanned_at)
        VALUES (${biz.id}, ${email ?? null}, NOW())
        ON CONFLICT (business_id) DO UPDATE SET email = EXCLUDED.email, scanned_at = NOW()
      `;
    } catch { /* best-effort */ }

    // Also try to save back to Railway (may not work but worth trying)
    if (email) {
      try {
        await fetch(`${scraperUrl}/api/v1/businesses/${biz.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: AbortSignal.timeout(4000),
        });
      } catch { /* Railway PATCH not supported — local DB is the fallback */ }
    }

    return { id: biz.id, name: biz.name, email, found: !!email };
  }));

  const found = results.filter((r) => r.found).length;

  return NextResponse.json({
    found,
    processed:  batch.length,
    remaining,
    results,
    message: remaining > 0
      ? `Found ${found} emails from ${batch.length} sites. ${remaining} more to scan — click again to continue.`
      : `Scan complete. Found ${found} emails from ${batch.length} sites. All ${noEmail.length} sites have now been checked.`,
  });
}
