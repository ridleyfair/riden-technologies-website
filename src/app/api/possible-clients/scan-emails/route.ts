import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const BATCH = 15; // businesses to process per run (keeps within Cloudflare CPU limits)
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
  // Must look like a real email
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e)) return false;
  return true;
}

async function findEmailOnWebsite(website: string): Promise<string | null> {
  const urls = [
    website.replace(/\/$/, ""),
    website.replace(/\/$/, "") + "/contact",
    website.replace(/\/$/, "") + "/contact-us",
    website.replace(/\/$/, "") + "/about",
  ];

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

      // 1. mailto: links are most reliable
      const mailtos = [...html.matchAll(/href=["']mailto:([^"'?#\s]+)/gi)]
        .map((m) => m[1].toLowerCase().trim());

      // 2. email-like patterns in text
      const patterns = [...html.matchAll(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)]
        .map((m) => m[0].toLowerCase().trim());

      const candidates = [...new Set([...mailtos, ...patterns])].filter(isValidEmail);
      if (candidates.length > 0) return candidates[0];
    } catch {
      // fetch failed or timed out — try next URL
    }
  }
  return null;
}

type RailwayBusiness = {
  id: string; name: string; email: string | null; website: string | null;
  city: string | null; category: string | null; lead_score: { lead_tier: string } | null;
};

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const scraperUrl = getScraperUrl();

  // Fetch businesses that have a website but no email
  let candidates: RailwayBusiness[] = [];
  try {
    const res = await fetch(
      `${scraperUrl}/api/v1/businesses?has_website=true&page_size=200`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) throw new Error(`Railway returned ${res.status}`);
    const data = await res.json() as { items?: RailwayBusiness[] };
    candidates = (data.items ?? []).filter((b) => !b.email?.trim() && b.website?.trim());
  } catch (e) {
    return NextResponse.json({ error: `Could not fetch businesses: ${String(e)}` }, { status: 502 });
  }

  if (candidates.length === 0) {
    return NextResponse.json({ found: 0, processed: 0, message: "All businesses with websites already have emails." });
  }

  // Take first BATCH, process in parallel
  const batch = candidates.slice(0, BATCH);

  const results = await Promise.all(batch.map(async (biz) => {
    const email = await findEmailOnWebsite(biz.website!);
    if (!email) return { id: biz.id, name: biz.name, found: false };

    // Save back to Railway
    try {
      await fetch(`${scraperUrl}/api/v1/businesses/${biz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(5000),
      });
    } catch { /* best-effort — report found even if save failed */ }

    return { id: biz.id, name: biz.name, email, found: true };
  }));

  const found    = results.filter((r) => r.found).length;
  const remaining = Math.max(0, candidates.length - BATCH);

  return NextResponse.json({
    found,
    processed: batch.length,
    remaining,
    results,
    message: remaining > 0
      ? `Found ${found} emails from ${batch.length} sites. ${remaining} more to scan — click again to continue.`
      : `Found ${found} emails from ${batch.length} sites. All done.`,
  });
}
