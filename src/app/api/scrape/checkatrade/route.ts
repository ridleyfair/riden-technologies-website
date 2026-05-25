import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractNextData(html: string): Record<string, unknown> | null {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]) as Record<string, unknown>; } catch { return null; }
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try { results.push(JSON.parse(m[1])); } catch { /* skip */ }
  }
  return results;
}

function metaContent(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
  return m?.[1] ?? "";
}

const PHOTO_BLACKLIST = ["icon", "logo", "avatar", "star", "badge", "trusted", "tick", "arrow", "sprite", "pixel", "1x1", "tracking", "blank", "placeholder", "ct-logo", "favicon", "profile-pic", "default-user", "rating"];

function isPhoto(url: string): boolean {
  const lower = url.toLowerCase();
  if (PHOTO_BLACKLIST.some((b) => lower.includes(b))) return false;
  const hasExt = /\.(jpg|jpeg|png|webp|avif)/i.test(lower);
  const isCdn = lower.includes("checkatrade") || lower.includes("cloudfront") || lower.includes("s3.amazonaws") || lower.includes("imagedelivery") || lower.includes("ctmedia");
  return hasExt || isCdn;
}

function extractPhotosFromHtml(html: string): string[] {
  const found = new Set<string>();

  // Decode Next.js /_next/image?url=ENCODED
  const nextRe = /\/_next\/image\?url=([^&"'\s>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = nextRe.exec(html)) !== null) {
    try {
      const decoded = decodeURIComponent(m[1]);
      if (decoded.startsWith("http") && isPhoto(decoded)) found.add(decoded);
    } catch { /* skip */ }
  }

  // img src / data-src
  const imgRe = /<img[^>]+>/gi;
  const attrRe = /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i;
  while ((m = imgRe.exec(html)) !== null) {
    const a = attrRe.exec(m[0]);
    if (a) {
      const src = a[1].startsWith("//") ? "https:" + a[1] : a[1];
      if (src.startsWith("http") && isPhoto(src)) found.add(src);
    }
  }

  // srcset — pick largest
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html)) !== null) {
    const parts = m[1].split(",").map((p) => p.trim().split(/\s+/)[0]);
    for (const u of parts) {
      if (u.startsWith("http") && isPhoto(u)) found.add(u);
    }
  }

  return [...found].slice(0, 20);
}

// Recursively walk an unknown structure and collect all image URLs
function collectImagesFromObj(obj: unknown, found: Set<string>, depth = 0): void {
  if (depth > 8 || !obj) return;
  if (typeof obj === "string") {
    if ((obj.startsWith("http") || obj.startsWith("//")) && isPhoto(obj)) {
      found.add(obj.startsWith("//") ? "https:" + obj : obj);
    }
    return;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectImagesFromObj(item, found, depth + 1);
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      // Prioritise keys that sound like image fields
      if (/image|photo|picture|gallery|src|url|media|thumb/i.test(k)) {
        collectImagesFromObj(v, found, depth);
      } else {
        collectImagesFromObj(v, found, depth + 1);
      }
    }
  }
}

// Recursively find a value by key name anywhere in the object
function deepFind(obj: unknown, key: string, depth = 0): unknown {
  if (depth > 8 || !obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = deepFind(item, key, depth + 1);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  const rec = obj as Record<string, unknown>;
  if (rec[key] !== undefined) return rec[key];
  for (const v of Object.values(rec)) {
    const r = deepFind(v, key, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// ── POST handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let url: string;
  try { ({ url } = await req.json()); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!url || !url.includes("checkatrade.com")) {
    return NextResponse.json({ error: "A valid Checkatrade profile URL is required" }, { status: 400 });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Could not load Checkatrade page (${resp.status}). Check the URL is correct and the profile is public.` },
        { status: 502 }
      );
    }

    const html = await resp.text();

    // ── 1. Try __NEXT_DATA__ (richest source) ─────────────────────────────────
    const nextData = extractNextData(html);
    const pageProps = (nextData?.props as Record<string, unknown>)?.pageProps as Record<string, unknown> | undefined;

    // Find trader profile — Checkatrade uses various key names
    const profile = (
      pageProps?.traderProfile
      ?? pageProps?.trader
      ?? pageProps?.profile
      ?? pageProps?.tradeProfile
      ?? pageProps?.data
      ?? pageProps?.traderData
      ?? deepFind(pageProps, "traderProfile")
      ?? deepFind(pageProps, "trader")
    ) as Record<string, unknown> | undefined;

    // ── 2. JSON-LD fallback ───────────────────────────────────────────────────
    const jsonLds = extractJsonLd(html);
    const biz = jsonLds.find(
      (j) => typeof j["@type"] === "string" && (j["@type"] as string).includes("Business")
    ) ?? jsonLds.find((j) => j.name);

    // ── Extract fields ────────────────────────────────────────────────────────
    const name =
      str(profile?.name ?? profile?.companyName ?? profile?.businessName)
      || str(biz?.name)
      || metaContent(html, "og:title").replace(/ \| Checkatrade.*$/i, "").trim();

    const description =
      str(profile?.description ?? profile?.about ?? profile?.summary ?? profile?.bio)
      || str(biz?.description)
      || metaContent(html, "og:description");

    const phone =
      str(profile?.phone ?? profile?.phoneNumber ?? profile?.telephone ?? profile?.contactNumber)
      || str(biz?.telephone);

    const addr = (profile?.address ?? profile?.location ?? biz?.address) as Record<string, unknown> | undefined;
    const city =
      str(addr?.town ?? addr?.city ?? addr?.addressLocality ?? addr?.addressRegion ?? profile?.town ?? profile?.city)
      || str(biz?.address && (biz.address as Record<string, unknown>)?.addressLocality);

    const postcode =
      str(addr?.postcode ?? addr?.postalCode ?? profile?.postcode ?? profile?.postalCode)
      || str(biz?.address && (biz.address as Record<string, unknown>)?.postalCode);

    // Skills / trades / categories
    const rawSkills =
      (profile?.skills ?? profile?.trades ?? profile?.categories ?? profile?.serviceTypes ?? profile?.workTypes) as unknown[] | undefined;
    const skills: string[] = [];
    if (Array.isArray(rawSkills)) {
      for (const s of rawSkills) {
        const label = str(typeof s === "object" ? (s as Record<string, unknown>)?.name ?? (s as Record<string, unknown>)?.label : s);
        if (label) skills.push(label);
      }
    }

    // Accreditations / certifications
    const rawCerts =
      (profile?.accreditations ?? profile?.certifications ?? profile?.memberships ?? profile?.qualifications) as unknown[] | undefined;
    const accreditations: string[] = [];
    if (Array.isArray(rawCerts)) {
      for (const c of rawCerts) {
        const label = str(typeof c === "object" ? (c as Record<string, unknown>)?.name ?? (c as Record<string, unknown>)?.label ?? (c as Record<string, unknown>)?.title : c);
        if (label) accreditations.push(label);
      }
    }

    // Rating / review count
    const aggregate = (profile?.aggregateRating ?? profile?.rating ?? biz?.aggregateRating) as Record<string, unknown> | undefined;
    const rating = str(aggregate?.ratingValue ?? profile?.score ?? profile?.averageRating ?? "");
    const reviewCount = Number(aggregate?.reviewCount ?? profile?.reviewCount ?? profile?.totalReviews ?? 0);

    // Trading years / established
    const tradingYears =
      str(profile?.tradingYears ?? profile?.yearsTrading ?? profile?.yearEstablished ?? profile?.established ?? "");

    // Areas covered
    const rawAreas = (profile?.areasServed ?? profile?.coverageAreas ?? profile?.areas) as unknown[] | undefined;
    const areas: string[] = [];
    if (Array.isArray(rawAreas)) {
      for (const a of rawAreas) {
        const label = str(typeof a === "object" ? (a as Record<string, unknown>)?.name ?? a : a);
        if (label) areas.push(label);
      }
    }

    // Reviews
    type RawReview = Record<string, unknown>;
    let rawReviews: RawReview[] = [];
    const profileReviews = profile?.reviews ?? profile?.testimonials;
    if (Array.isArray(profileReviews)) {
      rawReviews = profileReviews as RawReview[];
    } else {
      for (const block of jsonLds) {
        if (Array.isArray(block.review)) rawReviews.push(...(block.review as RawReview[]));
        else if (block["@type"] === "Review") rawReviews.push(block as RawReview);
      }
      if (biz?.review && Array.isArray(biz.review)) rawReviews.push(...(biz.review as RawReview[]));
    }

    const reviews = rawReviews.slice(0, 10).map((r) => ({
      author: str((r.author as Record<string, unknown>)?.name ?? r.author ?? r.reviewerName ?? r.customerName ?? "Customer"),
      rating: Number((r.reviewRating as Record<string, unknown>)?.ratingValue ?? r.rating ?? r.stars ?? 5),
      body:   str(r.reviewBody ?? r.body ?? r.text ?? r.comment ?? r.description ?? ""),
      date:   str(r.datePublished ?? r.date ?? r.createdAt ?? ""),
      source: "checkatrade",
    }));

    // Photos — from Next.js data first, then HTML
    const photoSet = new Set<string>();
    if (profile) collectImagesFromObj(profile, photoSet);
    // Also scan full pageProps for image arrays
    if (pageProps) {
      const imgKeys = ["images", "photos", "gallery", "media", "portfolioImages", "workImages"];
      for (const k of imgKeys) {
        if (pageProps[k]) collectImagesFromObj(pageProps[k], photoSet);
      }
    }
    // Fallback: HTML extraction
    if (photoSet.size === 0) {
      for (const p of extractPhotosFromHtml(html)) photoSet.add(p);
    }
    const photos = [...photoSet].filter(isPhoto).slice(0, 20);

    return NextResponse.json({
      ok: true,
      name,
      description,
      phone,
      city,
      postcode,
      skills,
      accreditations,
      tradingYears,
      areas,
      rating,
      reviewCount,
      reviews,
      photos,
    });
  } catch (err) {
    console.error("Checkatrade fetch error:", err);
    return NextResponse.json(
      { error: "Failed to load Checkatrade page. The site may be blocking automated access." },
      { status: 500 }
    );
  }
}
