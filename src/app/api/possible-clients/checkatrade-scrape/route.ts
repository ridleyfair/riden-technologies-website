import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const SCRAPER_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

function extractNextData(html: string): Record<string, unknown> | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]) as Record<string, unknown>; } catch { return null; }
}

function deepFindMembers(obj: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 6 || !obj || typeof obj !== "object") return [];
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === "object") {
      const first = obj[0] as Record<string, unknown>;
      if ("companyName" in first || "tradingName" in first || "memberName" in first || "slug" in first) {
        return obj as Record<string, unknown>[];
      }
    }
    for (const item of obj) {
      const r = deepFindMembers(item, depth + 1);
      if (r.length) return r;
    }
    return [];
  }
  const rec = obj as Record<string, unknown>;
  for (const key of ["searchResults", "members", "results", "tradeMembers", "data"]) {
    if (key in rec) {
      const val = rec[key];
      if (Array.isArray(val) && val.length > 0) {
        const r = deepFindMembers(val, depth + 1);
        if (r.length) return r;
      }
      if (val && typeof val === "object") {
        const r = deepFindMembers(val, depth + 1);
        if (r.length) return r;
      }
    }
  }
  for (const val of Object.values(rec)) {
    const r = deepFindMembers(val, depth + 1);
    if (r.length) return r;
  }
  return [];
}

function parseMember(item: Record<string, unknown>, trade: string, location: string) {
  const name = (item.companyName || item.tradingName || item.memberName || item.name) as string | undefined;
  if (!name) return null;

  const slug = (item.slug || item.memberSlug) as string | undefined;
  const checkatrade_url = slug ? `https://www.checkatrade.com/trades/${slug}` : null;

  const ratingRaw = item.rating || item.score || item.averageScore;
  let rating: number | null = null;
  let reviews_count: number | null = null;
  if (typeof ratingRaw === "object" && ratingRaw !== null) {
    const r = ratingRaw as Record<string, unknown>;
    rating = (r.overall || r.average || r.score) as number | null;
    reviews_count = (r.count || r.total) as number | null;
  } else if (typeof ratingRaw === "number") {
    rating = ratingRaw;
  }
  if (!reviews_count) reviews_count = (item.reviewCount || item.totalReviews) as number | null;

  const website = (item.website || item.websiteUrl || item.websiteURL) as string | null | undefined;
  const phone = (item.phone || item.phoneNumber || item.telephone) as string | null | undefined;

  const cityRaw = item.town || item.city || item.location;
  const city = typeof cityRaw === "string" ? cityRaw : (typeof cityRaw === "object" && cityRaw !== null ? ((cityRaw as Record<string, unknown>).name as string) : location);

  return {
    name: name.trim(),
    category: trade,
    city: city || location,
    phone: phone || null,
    website: website || null,
    rating: rating ?? null,
    reviews_count: reviews_count ?? null,
    checkatrade_url,
  };
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { trade, location, max_results = 50 } = await req.json();
  if (!trade || !location) {
    return NextResponse.json({ error: "trade and location are required" }, { status: 400 });
  }

  const businesses = [];
  const pages = Math.min(5, Math.max(1, Math.ceil(max_results / 20)));

  const debug: string[] = [];

  for (let page = 1; page <= pages; page++) {
    const tradeSlug = trade.toLowerCase().replace(/\s+/g, "-");
    const locationSlug = location.toLowerCase().replace(/\s+/g, "-");
    const url = page === 1
      ? `https://www.checkatrade.com/search/${tradeSlug}/${locationSlug}`
      : `https://www.checkatrade.com/search/${tradeSlug}/${locationSlug}?page=${page}`;
    try {
      const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
      debug.push(`page=${page} status=${res.status}`);
      if (!res.ok) { debug.push(`non-200 breaking`); break; }

      const html = await res.text();
      const hasNextData = html.includes("__NEXT_DATA__");
      debug.push(`has_next_data=${hasNextData} html_len=${html.length}`);
      if (!hasNextData) { debug.push(`no next data snippet: ${html.substring(0, 200)}`); break; }

      const nextData = extractNextData(html);
      if (!nextData) { debug.push(`failed to parse next data`); break; }

      const members = deepFindMembers(nextData);
      debug.push(`members_found=${members.length}`);
      if (!members.length) break;

      for (const m of members) {
        const biz = parseMember(m, trade, location);
        if (biz) businesses.push(biz);
      }

      if (members.length < 8) break;
    } catch (e) {
      debug.push(`error: ${e}`);
      break;
    }
  }

  if (!businesses.length) {
    return NextResponse.json({ saved: 0, scored: 0, businesses_found: 0, debug });
  }

  // Save to Railway DB via batch import endpoint
  try {
    const saveRes = await fetch(`${SCRAPER_URL}/api/v1/import/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: location, keyword: trade, source: "checkatrade", businesses }),
    });
    if (!saveRes.ok) {
      return NextResponse.json({ error: "Failed to save businesses" }, { status: 500 });
    }
    const result = await saveRes.json();
    return NextResponse.json({ ...result, businesses_found: businesses.length });
  } catch {
    return NextResponse.json({ error: "Scraper offline" }, { status: 503 });
  }
}
