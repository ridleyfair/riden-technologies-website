import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const SCRAPER_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";

function getApifyToken(): string {
  try {
    const val = (getCloudflareContext().env as unknown as Record<string, string>).APIFY_API_TOKEN;
    if (val) return val;
  } catch { /* local dev */ }
  return process.env.APIFY_API_TOKEN ?? "";
}

// ── Name similarity ────────────────────────────────────────────────────────────

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\blimited\b|\bltd\.?\b|\bplc\b|\binc\.?\b|\bco\.?\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function nameSim(a: string, b: string): number {
  const na = normName(a);
  const nb = normName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  // Bigram Jaccard
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const ba = bigrams(na);
  const bb = bigrams(nb);
  const inter = [...ba].filter((g) => bb.has(g)).length;
  const union = new Set([...ba, ...bb]).size;
  return union === 0 ? 0 : inter / union;
}

// ── Search strategies ──────────────────────────────────────────────────────────

// Strategy 1: DuckDuckGo HTML (free, no API key needed)
async function searchDDG(name: string, city: string): Promise<string | null> {
  const q = encodeURIComponent(`site:checkatrade.com/trades "${name}" ${city}`);
  try {
    const resp = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    const m = html.match(
      /https?:\/\/(?:www\.)?checkatrade\.com\/trades\/([A-Za-z0-9_%-]+)/
    );
    if (m) return m[0].split("?")[0];
  } catch { /* ignore */ }
  return null;
}

// Strategy 2: Apify Google Search (reliable, costs Apify credits)
async function searchApify(
  name: string,
  city: string,
  token: string
): Promise<string | null> {
  if (!token) return null;
  const query = `site:checkatrade.com/trades "${name}" ${city}`;
  try {
    const resp = await fetch(
      `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${token}&timeout=25`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: [query],
          maxPagesPerQuery: 1,
          resultsPerPage: 5,
        }),
        signal: AbortSignal.timeout(28000),
      }
    );
    if (!resp.ok) return null;
    const items = (await resp.json()) as Array<{
      organicResults?: Array<{ url: string }>;
    }>;
    for (const item of items) {
      for (const r of item.organicResults ?? []) {
        if (r.url?.includes("checkatrade.com/trades/")) return r.url;
      }
    }
  } catch { /* ignore */ }
  return null;
}

// ── Profile page parser ────────────────────────────────────────────────────────

interface ProfileSnap {
  name: string;
  rating: number | null;
  reviewCount: number;
  category: string;
  city: string;
  phone: string;
}

async function fetchProfile(url: string): Promise<ProfileSnap | null> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        Referer: "https://www.google.com/",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    // Name from __NEXT_DATA__ or h1
    let profileName = "";
    const ndMatch = html.match(
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (ndMatch) {
      try {
        const nd = JSON.parse(ndMatch[1]) as Record<string, unknown>;
        const pp = (nd?.props as Record<string, unknown>)
          ?.pageProps as Record<string, unknown> | undefined;
        profileName = String(
          (pp?.traderProfile as Record<string, unknown>)?.name ??
            (pp?.profile as Record<string, unknown>)?.name ??
            (pp?.trader as Record<string, unknown>)?.name ??
            (pp?.company as Record<string, unknown>)?.name ??
            ""
        );
      } catch { /* ignore */ }
    }
    if (!profileName) {
      const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1) profileName = h1[1].trim();
    }

    // Rating: "9.8/10" pattern
    const ratingM = plain.match(/\b(\d+(?:\.\d+)?)\s*\/\s*10\b/);
    const rating = ratingM ? parseFloat(ratingM[1]) : null;

    // Review count
    const reviewM = plain.match(/\b(\d{1,5})\s+(?:reviews?|ratings?)\b/i);
    const reviewCount = reviewM ? parseInt(reviewM[1]) : 0;

    // UK phone
    const phoneM = plain.match(
      /(?:\+44[\s\-]?|0)\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/
    );
    const phone = phoneM ? phoneM[0].replace(/\s+/g, " ").trim() : "";

    // City + category from JSON-LD
    let city = "";
    let category = "";
    const ldBlocks = html.matchAll(
      /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    );
    for (const block of ldBlocks) {
      try {
        const ld = JSON.parse(block[1]) as Record<string, unknown>;
        const addr = ld.address as Record<string, unknown> | undefined;
        if (!city && addr) {
          city = String(addr.addressLocality ?? addr.addressRegion ?? "");
        }
        if (!category && ld["@type"]) category = String(ld["@type"]);
      } catch { /* ignore */ }
    }

    return { name: profileName, rating, reviewCount, category, city, phone };
  } catch {
    return null;
  }
}

// ── Confidence + opportunity ───────────────────────────────────────────────────

type Confidence = "high" | "medium" | "low" | "possible" | "none";

function calcConfidence(
  businessName: string,
  phone: string | null,
  profile: ProfileSnap | null
): Confidence {
  if (!profile) return "none";
  if (phone && profile.phone) {
    const norm = (s: string) => s.replace(/[\s()+\-]/g, "");
    if (norm(phone) === norm(profile.phone)) return "high";
  }
  const sim = nameSim(businessName, profile.name);
  if (sim >= 0.85) return "high";
  if (sim >= 0.65) return "medium";
  if (sim >= 0.45) return "low";
  return "possible";
}

function calcOpportunityScore(p: {
  hasCheckatrade: boolean;
  hasWebsite: boolean;
  reviewCount: number;
  rating: number | null;
  hasPhone: boolean;
  confidence: Confidence;
}): number {
  let s = 0;
  if (!p.hasWebsite)      s += 40;
  if (p.hasCheckatrade)   s += 30;
  if      (p.reviewCount > 50) s += 20;
  else if (p.reviewCount > 20) s += 15;
  else if (p.reviewCount >  5) s +=  8;
  if (p.rating != null) {
    if      (p.rating >= 9.5) s += 15;
    else if (p.rating >= 9.0) s += 10;
    else if (p.rating >= 8.5) s +=  5;
  }
  if (p.hasPhone) s += 5;
  if      (p.confidence === "possible") s -= 20;
  else if (p.confidence === "low")      s -= 15;
  else if (p.confidence === "medium")   s -=  5;
  return Math.max(0, Math.min(100, s));
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id: businessId } = await params;

  // Fetch business from Railway scraper
  let business: {
    name: string;
    phone?: string | null;
    city?: string | null;
    website?: string | null;
  } | null = null;
  try {
    const bRes = await fetch(`${SCRAPER_URL}/api/v1/businesses/${businessId}`, {
      cache: "no-store",
    });
    if (bRes.ok) business = await bRes.json();
  } catch { /* ignore */ }

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { name, phone, city, website } = business;

  // Search for matching Checkatrade profile URL
  let checkatradeUrl: string | null = null;

  // 1. Try DuckDuckGo (free)
  checkatradeUrl = await searchDDG(name, city ?? "");

  // 2. Try Apify Google Search as fallback
  if (!checkatradeUrl) {
    checkatradeUrl = await searchApify(name, city ?? "", getApifyToken());
  }

  // Fetch and parse the profile if found
  let profile: ProfileSnap | null = null;
  if (checkatradeUrl) {
    profile = await fetchProfile(checkatradeUrl);
  }

  const confidence = calcConfidence(name, phone ?? null, profile);
  // Only treat as confirmed if confidence is not "none" or "possible"
  const hasCheckatrade =
    !!checkatradeUrl && confidence !== "none" && confidence !== "possible";

  const opportunityScore = calcOpportunityScore({
    hasCheckatrade,
    hasWebsite: !!website,
    reviewCount: profile?.reviewCount ?? 0,
    rating: profile?.rating ?? null,
    hasPhone: !!phone,
    confidence,
  });

  // Upsert into Neon DB
  const sql = getDb();
  await sql`
    INSERT INTO "CheckatradeEnrichment" (
      id,
      business_id,
      has_checkatrade,
      checkatrade_url,
      checkatrade_rating,
      checkatrade_review_count,
      checkatrade_category,
      checkatrade_location,
      checkatrade_phone,
      match_confidence,
      opportunity_score,
      checked_at
    ) VALUES (
      gen_random_uuid()::text,
      ${businessId},
      ${hasCheckatrade},
      ${checkatradeUrl},
      ${profile?.rating ?? null},
      ${profile?.reviewCount ?? 0},
      ${profile?.category ?? null},
      ${profile?.city ?? city ?? null},
      ${profile?.phone ?? null},
      ${confidence},
      ${opportunityScore},
      NOW()
    )
    ON CONFLICT (business_id) DO UPDATE SET
      has_checkatrade          = EXCLUDED.has_checkatrade,
      checkatrade_url          = EXCLUDED.checkatrade_url,
      checkatrade_rating       = EXCLUDED.checkatrade_rating,
      checkatrade_review_count = EXCLUDED.checkatrade_review_count,
      checkatrade_category     = EXCLUDED.checkatrade_category,
      checkatrade_location     = EXCLUDED.checkatrade_location,
      checkatrade_phone        = EXCLUDED.checkatrade_phone,
      match_confidence         = EXCLUDED.match_confidence,
      opportunity_score        = EXCLUDED.opportunity_score,
      checked_at               = NOW()
  `;

  return NextResponse.json({
    business_id: businessId,
    has_checkatrade: hasCheckatrade,
    checkatrade_url: checkatradeUrl,
    checkatrade_rating: profile?.rating ?? null,
    checkatrade_review_count: profile?.reviewCount ?? 0,
    checkatrade_category: profile?.category ?? null,
    checkatrade_location: profile?.city ?? city ?? null,
    checkatrade_phone: profile?.phone ?? null,
    match_confidence: confidence,
    opportunity_score: opportunityScore,
    checked_at: new Date().toISOString(),
  });
}
