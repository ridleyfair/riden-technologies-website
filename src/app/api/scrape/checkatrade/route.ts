import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// Extract all JSON-LD blocks from HTML
function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    try { results.push(JSON.parse(m[1])); } catch { /* skip malformed */ }
  }
  return results;
}

function metaContent(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
  return m?.[1] ?? "";
}

const PHOTO_BLACKLIST = ["icon", "logo", "avatar", "star", "badge", "trusted", "tick", "arrow", "sprite", "pixel", "1x1", "tracking", "blank", "placeholder", "ct-logo", "favicon"];

function extractPhotos(html: string): string[] {
  const found = new Set<string>();

  // 1. Decode Next.js /_next/image?url=ENCODED wrappers to get actual src
  const nextImgRe = /\/_next\/image\?url=([^&"'\s>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = nextImgRe.exec(html)) !== null) {
    try {
      const decoded = decodeURIComponent(m[1]);
      if (decoded.startsWith("http")) found.add(decoded);
    } catch { /* skip */ }
  }

  // 2. Raw src / data-src attributes on img tags
  const imgRe = /<img[^>]+>/gi;
  const attrRe = /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i;
  while ((m = imgRe.exec(html)) !== null) {
    const attr = attrRe.exec(m[0]);
    if (attr) {
      const src = attr[1];
      if (src.startsWith("http")) found.add(src);
      else if (src.startsWith("//")) found.add("https:" + src);
    }
  }

  // 3. srcset (pick the largest variant)
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html)) !== null) {
    const parts = m[1].split(",").map((p) => p.trim().split(/\s+/)[0]);
    for (const u of parts) {
      if (u.startsWith("http")) found.add(u);
    }
  }

  // Filter out non-photo URLs
  return [...found]
    .filter((url) => {
      const lower = url.toLowerCase();
      if (PHOTO_BLACKLIST.some((b) => lower.includes(b))) return false;
      // Must look like an image (extension or known CDN path)
      const hasExt = /\.(jpg|jpeg|png|webp|avif)/i.test(lower);
      const isCdn  = lower.includes("checkatrade") || lower.includes("cloudfront") || lower.includes("s3.amazonaws") || lower.includes("imagedelivery");
      return hasExt || isCdn;
    })
    .slice(0, 20);
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url || !url.includes("checkatrade.com")) {
    return NextResponse.json({ error: "A valid Checkatrade profile URL is required" }, { status: 400 });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });

    if (!resp.ok) {
      return NextResponse.json({ error: `Could not fetch Checkatrade page (${resp.status}). The page may be private or the URL may be wrong.` }, { status: 502 });
    }

    const html = await resp.text();
    const jsonLds = extractJsonLd(html);

    // Find LocalBusiness schema
    const biz = jsonLds.find(
      (j) => typeof j["@type"] === "string" && (j["@type"] as string).includes("Business")
    ) ?? jsonLds.find((j) => j.name);

    // Find Review/AggregateRating schema
    const reviewBlocks = jsonLds.filter(
      (j) => j["@type"] === "Review" || Array.isArray(j.review)
    );

    const name = (biz?.name as string) ?? metaContent(html, "og:title") ?? "";
    const description = (biz?.description as string) ?? metaContent(html, "og:description") ?? "";
    const phone = (biz?.telephone as string) ?? "";

    const aggregate = biz?.aggregateRating as Record<string, unknown> | undefined;
    const ratingValue = aggregate?.ratingValue ?? aggregate?.ratingCount ?? null;
    const reviewCount = aggregate?.reviewCount ?? null;

    // Collect reviews
    type RawReview = Record<string, unknown>;
    let rawReviews: RawReview[] = [];

    if (biz?.review && Array.isArray(biz.review)) {
      rawReviews = biz.review as RawReview[];
    } else {
      for (const block of reviewBlocks) {
        if (Array.isArray(block.review)) rawReviews.push(...(block.review as RawReview[]));
        else if (block["@type"] === "Review") rawReviews.push(block);
      }
    }

    const reviews = rawReviews.slice(0, 10).map((r) => {
      const rating = Number(
        (r.reviewRating as Record<string, unknown>)?.ratingValue ?? r.ratingValue ?? 5
      );
      const author =
        (r.author as Record<string, unknown>)?.name as string
        ?? (r.author as string)
        ?? "Customer";
      const body =
        (r.reviewBody as string)
        ?? (r.description as string)
        ?? "";
      const date = (r.datePublished as string) ?? "";
      return { author, rating, body, date, source: "checkatrade" };
    });

    // Services — try itemListElement or description splitting
    let services = "";
    const itemList = jsonLds.find((j) => j["@type"] === "ItemList");
    if (itemList?.itemListElement && Array.isArray(itemList.itemListElement)) {
      services = (itemList.itemListElement as RawReview[])
        .map((i) => (i.name as string) ?? "")
        .filter(Boolean)
        .join(", ");
    }

    // Address
    const addr = biz?.address as Record<string, unknown> | undefined;
    const city = (addr?.addressLocality as string) ?? (addr?.addressRegion as string) ?? "";
    const postcode = (addr?.postalCode as string) ?? "";

    // Photos
    const photos = extractPhotos(html);

    return NextResponse.json({
      ok: true,
      name,
      description,
      phone,
      city,
      postcode,
      services,
      rating: ratingValue,
      reviewCount,
      reviews,
      photos,
    });
  } catch (err) {
    console.error("Checkatrade fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Checkatrade page. The site may have blocked the request." },
      { status: 500 }
    );
  }
}
