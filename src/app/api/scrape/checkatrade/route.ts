import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// ── Primitive helpers ─────────────────────────────────────────────────────────

function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v).trim();
  return "";
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((item) => {
    const s = str(typeof item === "object" ? ((item as Record<string,unknown>)?.name ?? (item as Record<string,unknown>)?.label ?? (item as Record<string,unknown>)?.title ?? (item as Record<string,unknown>)?.value ?? item) : item);
    return s ? [s] : [];
  });
}

// ── HTML extractors ───────────────────────────────────────────────────────────

function extractNextData(html: string): Record<string, unknown> | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
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
  return m?.[1]?.trim() ?? "";
}

function extractH1(html: string): string {
  const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return m?.[1]?.trim() ?? "";
}

// Extract first UK phone number from any text block
function extractPhone(text: string): string {
  const m = text.match(/(?:(?:\+44\s?)|(?:0))(?:\d[\s-]?){9,10}/);
  return m ? m[0].replace(/\s+/g, " ").trim() : "";
}

// Extract first UK postcode from any text block
function extractPostcode(text: string): string {
  const m = text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  return m ? m[1].toUpperCase() : "";
}

// ── Deep object traversal ─────────────────────────────────────────────────────

// Find the first value of a key anywhere in the object (breadth-first-ish)
function deepFind(obj: unknown, key: string, depth = 0): unknown {
  if (depth > 10 || !obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = deepFind(item, key, depth + 1);
      if (r !== undefined) return r;
    }
    return undefined;
  }
  const rec = obj as Record<string, unknown>;
  if (key in rec && rec[key] !== null && rec[key] !== undefined && rec[key] !== "") return rec[key];
  for (const v of Object.values(rec)) {
    const r = deepFind(v, key, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

// Find ALL values for a set of candidate key names, returning first non-empty
function findFirst(obj: unknown, keys: string[]): unknown {
  for (const key of keys) {
    const v = deepFind(obj, key);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Recursively collect image URLs from object
const PHOTO_BLACKLIST = ["icon","logo","avatar","star","badge","trusted","tick","arrow","sprite","pixel","1x1","tracking","blank","placeholder","ct-logo","favicon","profile-pic","default-user","rating","seal","shield"];

function isPhoto(url: string): boolean {
  const lower = url.toLowerCase();
  if (PHOTO_BLACKLIST.some((b) => lower.includes(b))) return false;
  const hasExt = /\.(jpg|jpeg|png|webp|avif)/i.test(lower);
  const isCdn  = lower.includes("checkatrade") || lower.includes("cloudfront") || lower.includes("s3.amazonaws") || lower.includes("imagedelivery") || lower.includes("ctmedia");
  return hasExt || isCdn;
}

function collectImages(obj: unknown, found: Set<string>, depth = 0): void {
  if (depth > 10 || !obj) return;
  if (typeof obj === "string") {
    if ((obj.startsWith("http") || obj.startsWith("//")) && isPhoto(obj)) {
      found.add(obj.startsWith("//") ? "https:" + obj : obj);
    }
    return;
  }
  if (Array.isArray(obj)) { for (const i of obj) collectImages(i, found, depth + 1); return; }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (/image|photo|picture|gallery|src|url|media|thumb|portfolio|work/i.test(k)) {
        collectImages(v, found, depth);
      } else {
        collectImages(v, found, depth + 1);
      }
    }
  }
}

function extractPhotosFromHtml(html: string): string[] {
  const found = new Set<string>();
  const nextRe = /\/_next\/image\?url=([^&"'\s>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = nextRe.exec(html)) !== null) {
    try { const d = decodeURIComponent(m[1]); if (d.startsWith("http") && isPhoto(d)) found.add(d); } catch { /* skip */ }
  }
  const imgRe  = /<img[^>]+>/gi;
  const attrRe = /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i;
  while ((m = imgRe.exec(html)) !== null) {
    const a = attrRe.exec(m[0]);
    if (a) { const src = a[1].startsWith("//") ? "https:" + a[1] : a[1]; if (src.startsWith("http") && isPhoto(src)) found.add(src); }
  }
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html)) !== null) {
    for (const part of m[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u.startsWith("http") && isPhoto(u)) found.add(u);
    }
  }
  return [...found].slice(0, 20);
}

// ── Locate the trader profile anywhere in pageProps ───────────────────────────

const PROFILE_KEYS = [
  "traderProfile","trader","profile","tradeProfile","traderData","tradeData",
  "company","business","member","trade","tradesperson","contractor","tradesman",
  "companyProfile","businessProfile","memberProfile","companyData","businessData",
];

function findProfile(pageProps: Record<string, unknown>): Record<string, unknown> | undefined {
  // 1. Direct key lookup
  for (const key of PROFILE_KEYS) {
    const v = pageProps[key];
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  }
  // 2. Deep search — find any object that has a 'name' and at least one of phone/description/city
  const candidates: Record<string, unknown>[] = [];
  function hunt(obj: unknown, depth = 0): void {
    if (depth > 6 || !obj || typeof obj !== "object" || Array.isArray(obj)) return;
    const rec = obj as Record<string, unknown>;
    const hasName  = typeof rec.name  === "string" && rec.name.length > 1;
    const hasPhone = typeof rec.phone === "string" || typeof rec.telephone === "string" || typeof rec.contactNumber === "string";
    const hasDesc  = typeof rec.description === "string" || typeof rec.about === "string" || typeof rec.summary === "string";
    if (hasName && (hasPhone || hasDesc)) candidates.push(rec);
    for (const v of Object.values(rec)) hunt(v, depth + 1);
  }
  hunt(pageProps);
  if (candidates.length > 0) return candidates[0];
  // 3. Fall back to deep key search
  for (const key of PROFILE_KEYS) {
    const v = deepFind(pageProps, key);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  }
  return undefined;
}

// ── POST handler ──────────────────────────────────────────────────────────────

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

  // Normalise URL
  if (!url.startsWith("http")) url = "https://" + url;

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control":   "no-cache",
        "Referer":         "https://www.checkatrade.com/",
      },
      redirect: "follow",
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Could not load Checkatrade page (HTTP ${resp.status}). Check the URL is correct and the profile is public.` },
        { status: 502 }
      );
    }

    const html = await resp.text();

    // ── 1. Extract structured sources ─────────────────────────────────────────
    const nextData  = extractNextData(html);
    const pageProps = (nextData?.props as Record<string,unknown>)?.pageProps as Record<string,unknown> | undefined;
    const jsonLds   = extractJsonLd(html);
    const bizLd     = jsonLds.find((j) => /LocalBusiness|HomeAndConstructionBusiness|Organization/.test(String(j["@type"])))
                    ?? jsonLds.find((j) => j.name);

    // ── 2. Find the trader profile object ─────────────────────────────────────
    const profile = pageProps ? findProfile(pageProps) : undefined;

    // ── 3. Extract each field — profile → JSON-LD → meta → regex fallback ────

    const name =
      str(findFirst(profile, ["name","companyName","businessName","tradeName","tradingName"]))
      || str(bizLd?.name)
      || extractH1(html)
      || metaContent(html, "og:title").replace(/\s*[|–-].*$/, "").trim();

    const description =
      str(findFirst(profile, ["description","about","summary","bio","overview","companyDescription","businessDescription"]))
      || str(bizLd?.description)
      || metaContent(html, "og:description");

    const phone =
      str(findFirst(profile, ["phone","phoneNumber","telephone","contactNumber","mobile","tel","contact_phone","mobileNumber"]))
      || str(bizLd?.telephone)
      || extractPhone(metaContent(html, "telephone"))
      || extractPhone(html.replace(/<[^>]+>/g, " ").substring(0, 50000));

    const email =
      str(findFirst(profile, ["email","emailAddress","contactEmail","email_address"]))
      || str(bizLd?.email);

    const addrObj = (profile?.address ?? profile?.location ?? bizLd?.address) as Record<string,unknown> | undefined;
    const city =
      str(findFirst(addrObj, ["town","city","addressLocality","addressRegion","region"]))
      || str(findFirst(profile, ["town","city","addressLocality"]))
      || str((bizLd?.address as Record<string,unknown>)?.addressLocality);

    const postcode =
      str(findFirst(addrObj, ["postcode","postalCode","zip","postCode"]))
      || str(findFirst(profile, ["postcode","postalCode"]))
      || str((bizLd?.address as Record<string,unknown>)?.postalCode)
      || extractPostcode(html.replace(/<[^>]+>/g, " ").substring(0, 50000));

    // Skills / trades
    const rawSkills = (findFirst(profile, ["skills","trades","categories","serviceTypes","workTypes","services","tradeTypes"]) ?? []) as unknown[];
    const skills = strArr(rawSkills);

    // Accreditations
    const rawCerts = (findFirst(profile, ["accreditations","certifications","memberships","qualifications","badges","approvals"]) ?? []) as unknown[];
    const accreditations = strArr(rawCerts);

    // Rating
    const aggRating = (profile?.aggregateRating ?? profile?.rating ?? bizLd?.aggregateRating) as Record<string,unknown> | undefined;
    const rating      = str(findFirst(aggRating, ["ratingValue","score","value"]) ?? findFirst(profile, ["score","averageRating","overallScore","starRating"]));
    const reviewCount = Number(findFirst(aggRating, ["reviewCount","ratingCount"]) ?? findFirst(profile, ["reviewCount","totalReviews","numberOfReviews","reviewsCount"]) ?? 0);

    // Trading years
    const tradingYears = str(findFirst(profile, ["tradingYears","yearsTrading","yearEstablished","established","foundedYear","since","yearFounded"]));

    // Areas covered
    const rawAreas = (findFirst(profile, ["areasServed","coverageAreas","areas","coverage","serviceAreas","areasOfWork","workingAreas"]) ?? []) as unknown[];
    const areas = strArr(rawAreas);

    // Opening hours
    const rawHours = findFirst(profile, ["openingHours","businessHours","hours","openingTimes","workingHours"]);
    const openingHours = typeof rawHours === "string" ? rawHours
      : Array.isArray(rawHours) ? strArr(rawHours).join(", ")
      : str(bizLd?.openingHours);

    // Social links
    const sameAs = bizLd?.sameAs;
    const socialLinks: string[] = Array.isArray(sameAs) ? sameAs.map(str) : typeof sameAs === "string" ? [sameAs] : [];
    const socialFacebook  = str(findFirst(profile, ["facebook","facebookUrl","socialFacebook"])) || socialLinks.find((s) => s.includes("facebook")) || "";
    const socialInstagram = str(findFirst(profile, ["instagram","instagramUrl","socialInstagram"])) || socialLinks.find((s) => s.includes("instagram")) || "";

    // Reviews
    type RawReview = Record<string, unknown>;
    let rawReviews: RawReview[] = [];
    const profileReviews = findFirst(profile, ["reviews","testimonials","reviewList","customerReviews"]);
    if (Array.isArray(profileReviews)) {
      rawReviews = profileReviews as RawReview[];
    } else {
      for (const block of jsonLds) {
        if (Array.isArray(block.review))   rawReviews.push(...(block.review as RawReview[]));
        if (block["@type"] === "Review")   rawReviews.push(block as RawReview);
      }
      if (bizLd?.review && Array.isArray(bizLd.review)) rawReviews.push(...(bizLd.review as RawReview[]));
    }
    const reviews = rawReviews.slice(0, 10).map((r) => ({
      author: str((r.author as Record<string,unknown>)?.name ?? r.author ?? r.reviewerName ?? r.customerName ?? "Customer"),
      rating: Number((r.reviewRating as Record<string,unknown>)?.ratingValue ?? r.rating ?? r.stars ?? 5),
      body:   str(r.reviewBody ?? r.body ?? r.text ?? r.comment ?? r.description ?? ""),
      date:   str(r.datePublished ?? r.date ?? r.createdAt ?? ""),
      source: "checkatrade" as const,
    }));

    // Photos
    const photoSet = new Set<string>();
    if (profile)    collectImages(profile, photoSet);
    if (pageProps) {
      for (const k of ["images","photos","gallery","media","portfolioImages","workImages","portfolio","work"]) {
        if (pageProps[k]) collectImages(pageProps[k], photoSet);
      }
    }
    if (photoSet.size === 0) for (const p of extractPhotosFromHtml(html)) photoSet.add(p);
    const photos = [...photoSet].filter(isPhoto).slice(0, 20);

    // ── 4. Return everything ──────────────────────────────────────────────────
    return NextResponse.json({
      ok: true,
      name,
      description,
      phone,
      email,
      city,
      postcode,
      skills,
      accreditations,
      tradingYears,
      areas,
      rating,
      reviewCount,
      openingHours,
      socialFacebook,
      socialInstagram,
      reviews,
      photos,
      // debug info so we can see what was found
      _found: {
        hasNextData:  !!nextData,
        hasPageProps: !!pageProps,
        hasProfile:   !!profile,
        profileKeys:  profile ? Object.keys(profile).slice(0, 30) : [],
        hasJsonLd:    jsonLds.length > 0,
      },
    });
  } catch (err) {
    console.error("Checkatrade fetch error:", err);
    return NextResponse.json(
      { error: "Failed to load Checkatrade page. The site may be blocking automated access." },
      { status: 500 }
    );
  }
}
