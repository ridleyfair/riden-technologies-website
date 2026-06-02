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
    const s = str(
      typeof item === "object"
        ? ((item as Record<string, unknown>)?.name
            ?? (item as Record<string, unknown>)?.label
            ?? (item as Record<string, unknown>)?.title
            ?? (item as Record<string, unknown>)?.value
            ?? (item as Record<string, unknown>)?.skill
            ?? (item as Record<string, unknown>)?.category
            ?? (item as Record<string, unknown>)?.trade
            ?? (item as Record<string, unknown>)?.text
            ?? (item as Record<string, unknown>)?.displayName
            ?? item)
        : item
    );
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
  const m =
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
  return m?.[1]?.trim() ?? "";
}

function extractH1(html: string): string {
  const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return m?.[1]?.trim() ?? "";
}

// Strip all HTML tags and decode common entities
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Extract UK phone number from raw text
function extractPhone(text: string): string {
  const m = text.match(/(?:(?:\+44[\s-]?)|(?:0))(?:7\d{3}|\d{2,4})[\s-]?\d{3,4}[\s-]?\d{3,4}/);
  return m ? m[0].replace(/\s+/g, " ").trim() : "";
}

// Extract UK postcode from raw text
function extractPostcode(text: string): string {
  const m = text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  return m ? m[1].toUpperCase() : "";
}

// Extract an Instagram URL from any text block
function extractInstagram(text: string): string {
  const m = text.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>?]+/i);
  return m ? m[0].replace(/[,.)]+$/, "") : "";
}

// Extract a Facebook URL from any text block
function extractFacebook(text: string): string {
  const m = text.match(/https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>?]+/i);
  return m ? m[0].replace(/[,.)]+$/, "") : "";
}

// Pull the longest readable paragraph blocks from the HTML (company description often here)
function extractLongTextFromHtml(html: string): string {
  // Try common description containers first
  const containers = [
    html.match(/class="[^"]*(?:description|about|bio|overview|profile-text|company-info|member-description)[^"]*"[^>]*>([\s\S]{100,5000}?)<\/(?:div|p|section)/i),
    html.match(/id="[^"]*(?:description|about|bio|overview)[^"]*"[^>]*>([\s\S]{100,5000}?)<\/(?:div|p|section)/i),
  ];
  for (const match of containers) {
    if (match) {
      const cleaned = stripHtml(match[1]).trim();
      if (cleaned.length > 80) return cleaned;
    }
  }

  // Fallback: find all <p> tags and return the longest chain
  const paragraphs: string[] = [];
  const pRe = /<p[^>]*>([\s\S]+?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(html)) !== null) {
    const t = stripHtml(m[1]).trim();
    if (t.length > 60) paragraphs.push(t);
  }
  if (paragraphs.length > 0) return paragraphs.join("\n\n");
  return "";
}

// ── Deep object traversal ─────────────────────────────────────────────────────

function deepFind(obj: unknown, key: string, depth = 0): unknown {
  if (depth > 10 || !obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) { const r = deepFind(item, key, depth + 1); if (r !== undefined) return r; }
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

function findFirst(obj: unknown, keys: string[]): unknown {
  for (const key of keys) {
    const v = deepFind(obj, key);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// ── Photo helpers ─────────────────────────────────────────────────────────────

const PHOTO_BLACKLIST = [
  "icon","star","badge","trusted","tick","arrow","sprite",
  "pixel","1x1","tracking","blank","placeholder","ct-logo","favicon",
  "default-user","rating","seal","shield",
];

function isPhoto(url: string): boolean {
  const lower = url.toLowerCase();
  if (PHOTO_BLACKLIST.some((b) => lower.includes(b))) return false;
  const hasExt = /\.(jpg|jpeg|png|webp|avif)/i.test(lower);
  const isCdn  = lower.includes("checkatrade") || lower.includes("cloudfront") ||
                 lower.includes("s3.amazonaws") || lower.includes("imagedelivery") ||
                 lower.includes("ctmedia") || lower.includes("cloudinary") ||
                 lower.includes("ctassets") || lower.includes("media.ct");
  return hasExt || isCdn;
}

function collectImages(obj: unknown, found: Set<string>, depth = 0): void {
  if (depth > 10 || !obj) return;
  if (typeof obj === "string") {
    if ((obj.startsWith("http") || obj.startsWith("//")) && isPhoto(obj))
      found.add(obj.startsWith("//") ? "https:" + obj : obj);
    return;
  }
  if (Array.isArray(obj)) { for (const i of obj) collectImages(i, found, depth + 1); return; }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (/image|photo|picture|gallery|src|url|media|thumb|portfolio|work/i.test(k))
        collectImages(v, found, depth);
      else
        collectImages(v, found, depth + 1);
    }
  }
}

function extractPhotosFromHtml(html: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;

  // /_next/image?url=ENCODED&w=...&q=... — the encoded URL is a private GCS object.
  // Use the full proxied URL on Checkatrade's server instead of decoding to raw GCS.
  // We collect all widths then keep only the largest per source image.
  const nextWidths = new Map<string, { w: number; fullUrl: string }>();
  const nextRe = /\/_next\/image\?([^"'\s>]+)/g;
  while ((m = nextRe.exec(html)) !== null) {
    try {
      const qs     = m[1];
      const params = new URLSearchParams(qs);
      const rawUrl = decodeURIComponent(params.get("url") ?? "");
      if (!rawUrl || !isPhoto(rawUrl)) continue;
      const w = parseInt(params.get("w") ?? "0", 10);
      const existing = nextWidths.get(rawUrl);
      if (!existing || w > existing.w) {
        nextWidths.set(rawUrl, { w, fullUrl: `https://www.checkatrade.com/_next/image?${qs}` });
      }
    } catch { /* skip */ }
  }
  for (const { fullUrl } of nextWidths.values()) found.add(fullUrl);

  // Skip any raw storage.googleapis.com URLs — they require auth tokens
  const isPrivateGcs = (u: string) => u.includes("storage.googleapis.com") || u.includes("storage.cloud.google.com");

  const imgRe  = /<img[^>]+>/gi;
  const attrRe = /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i;
  while ((m = imgRe.exec(html)) !== null) {
    const a = attrRe.exec(m[0]);
    if (a) {
      const src = a[1].startsWith("//") ? "https:" + a[1] : a[1];
      if (src.startsWith("http") && isPhoto(src) && !isPrivateGcs(src)) found.add(src);
    }
  }
  const srcsetRe = /srcset=["']([^"']+)["']/gi;
  while ((m = srcsetRe.exec(html)) !== null) {
    for (const part of m[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u.startsWith("http") && isPhoto(u) && !isPrivateGcs(u)) found.add(u);
    }
  }
  return [...found].slice(0, 20);
}

// ── Find trader profile in __NEXT_DATA__ ──────────────────────────────────────

const PROFILE_KEYS = [
  "traderProfile","trader","profile","tradeProfile","traderData","tradeData",
  "company","business","member","trade","tradesperson","contractor","tradesman",
  "companyProfile","businessProfile","memberProfile","companyData","businessData",
  "memberData","traderInfo","memberInfo","profileData","pageData","serverData",
  "tradepersonData","tradePersonData","traderDetails","companyDetails",
  "tradeInfo","businessInfo","listingData","traderListing","profileInfo",
];

function findProfile(pageProps: Record<string, unknown>): Record<string, unknown> | undefined {
  // 1. Direct key on pageProps
  for (const key of PROFILE_KEYS) {
    const v = pageProps[key];
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  }
  // 2. Search ALL top-level values of pageProps — some Next.js apps nest deeply
  for (const val of Object.values(pageProps)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      for (const key of PROFILE_KEYS) {
        const v = (val as Record<string, unknown>)[key];
        if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
      }
    }
  }
  // 3. Smart hunt: find any object that looks like a company profile
  const candidates: Array<{ score: number; obj: Record<string, unknown> }> = [];
  function hunt(obj: unknown, depth = 0): void {
    if (depth > 8 || !obj || typeof obj !== "object" || Array.isArray(obj)) return;
    const rec = obj as Record<string, unknown>;
    let score = 0;
    if (typeof rec.name        === "string" && rec.name.length > 1)    score += 3;
    if (typeof rec.description === "string" && rec.description.length > 20) score += 3;
    if (typeof rec.about       === "string" && rec.about.length > 20)  score += 2;
    if (typeof rec.phone       === "string" || typeof rec.telephone === "string") score += 2;
    if (typeof rec.city        === "string" || typeof rec.town === "string") score += 1;
    if (typeof rec.postcode    === "string") score += 1;
    if (Array.isArray(rec.skills) || Array.isArray(rec.trades))        score += 2;
    if (score >= 5) candidates.push({ score, obj: rec });
    for (const v of Object.values(rec)) hunt(v, depth + 1);
  }
  hunt(pageProps);
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].obj;
  }
  // 4. Deep key fallback
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

    const html     = await resp.text();
    const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    // ── Structured sources ────────────────────────────────────────────────────
    const nextData  = extractNextData(html);
    const pageProps = (nextData?.props as Record<string, unknown>)?.pageProps as Record<string, unknown> | undefined;
    const jsonLds   = extractJsonLd(html);
    const bizLd     = jsonLds.find((j) =>
      /LocalBusiness|HomeAndConstructionBusiness|Organization|Service/i.test(String(j["@type"]))
    ) ?? jsonLds.find((j) => j.name);

    const profile = pageProps ? findProfile(pageProps) : undefined;

    // ── Name ──────────────────────────────────────────────────────────────────
    const name =
      str(findFirst(profile, ["name","companyName","businessName","tradeName","tradingName","displayName"]))
      || str(bizLd?.name)
      || extractH1(html)
      || metaContent(html, "og:title").replace(/\s*[|–\-].*$/, "").trim();

    // ── Owner / contact person ────────────────────────────────────────────────
    const owner =
      str(findFirst(profile, ["owner","ownerName","director","contactName","primaryContact","contactPerson","managedBy","operatedBy","representedBy","principalName"]))
      || str((bizLd?.founder as Record<string,unknown>)?.name ?? bizLd?.founder)
      || (() => {
        // Try to find "Owner\n{Name}" pattern in visible text
        const m = plainText.match(/Owner\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
        return m ? m[1] : "";
      })();

    // ── Description ───────────────────────────────────────────────────────────
    const descFromData =
      str(findFirst(profile, ["description","about","summary","bio","overview","companyDescription","businessDescription","profileDescription","memberDescription","intro","introduction"]))
      || str(bizLd?.description)
      || metaContent(html, "og:description");

    // If structured data gave a short description, try to supplement from HTML
    const descFromHtml = descFromData.length < 100 ? extractLongTextFromHtml(html) : "";
    const description  = descFromData.length >= descFromHtml.length ? descFromData : descFromHtml;

    // ── Contact ───────────────────────────────────────────────────────────────
    const phone =
      str(findFirst(profile, ["phone","phoneNumber","telephone","contactNumber","mobile","tel","mobileNumber"]))
      || str(bizLd?.telephone)
      || extractPhone(plainText.substring(0, 60000));

    const email =
      str(findFirst(profile, ["email","emailAddress","contactEmail"]))
      || str(bizLd?.email)
      || (() => { const m = plainText.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i); return m ? m[0] : ""; })();

    // ── Address ───────────────────────────────────────────────────────────────
    const addrObj = (profile?.address ?? profile?.location ?? bizLd?.address) as Record<string, unknown> | undefined;
    const city =
      str(findFirst(addrObj, ["town","city","addressLocality","addressRegion"]))
      || str(findFirst(profile, ["town","city","addressLocality"]))
      || str((bizLd?.address as Record<string, unknown>)?.addressLocality);

    const postcode =
      str(findFirst(addrObj, ["postcode","postalCode"]))
      || str(findFirst(profile, ["postcode","postalCode"]))
      || str((bizLd?.address as Record<string, unknown>)?.postalCode)
      || extractPostcode(plainText.substring(0, 60000));

    // ── Skills / trades ───────────────────────────────────────────────────────
    const rawSkills = (findFirst(profile, [
      "skills","trades","categories","serviceTypes","workTypes","services",
      "tradeTypes","specialisms","tradeCategories","tradingCategories",
      "serviceOfferings","tradeInformation","primaryTrades","additionalTrades",
      "tradeSkills","expertise","offerings","tradesList","skillsList",
    ]) ?? []) as unknown[];
    // If profile-level search fails, try searching entire pageProps for trade arrays
    const skills = strArr(rawSkills).length > 0
      ? strArr(rawSkills)
      : pageProps ? strArr((findFirst(pageProps, [
          "skills","trades","tradeCategories","serviceTypes","tradeTypes",
          "categories","specialisms","offerings",
        ]) ?? []) as unknown[]) : [];

    // ── Accreditations ────────────────────────────────────────────────────────
    const rawCerts = (findFirst(profile, ["accreditations","certifications","memberships","qualifications","badges","approvals","endorsements"]) ?? []) as unknown[];
    const accreditations = strArr(rawCerts);

    // ── Company facts ─────────────────────────────────────────────────────────
    const companyType  = str(findFirst(profile, ["companyType","businessType","legalStatus","registrationStatus","entityType"]));
    const vatRegistered = (() => {
      const v = findFirst(profile, ["vatRegistered","isVatRegistered","vat","vatStatus"]);
      if (v === true)  return "VAT Registered";
      if (v === false) return "Not VAT Registered";
      // Check visible text
      if (/VAT\s+Registered:\s*Yes/i.test(plainText)) return "VAT Registered";
      if (/VAT\s+Registered:\s*No/i.test(plainText))  return "Not VAT Registered";
      return "";
    })();

    // Capabilities — often rendered as tags in the HTML
    const capabilities: string[] = [];
    if (/Domestic\s+Work/i.test(plainText))   capabilities.push("Domestic Work");
    if (/Commercial\s+Work/i.test(plainText)) capabilities.push("Commercial Work");
    if (/Free\s+Estimates?/i.test(plainText)) capabilities.push("Free Estimates");
    if (/Cards?\s+Accepted/i.test(plainText)) capabilities.push("Cards Accepted");
    if (/Emergency\s+(?:Call[- ]?outs?|Work)/i.test(plainText)) capabilities.push("Emergency Callouts");
    if (/24\s*\/?\s*7/i.test(plainText))      capabilities.push("24/7 Service");

    // Years on Checkatrade
    const ctYearsMatch = plainText.match(/(\d+)\s+years?\s+on\s+Checkatrade/i);
    const yearsOnCheckatrade = ctYearsMatch ? ctYearsMatch[1] : "";

    // Trading years
    const tradingYears = str(findFirst(profile, ["tradingYears","yearsTrading","yearEstablished","established","foundedYear","since"]));

    // ── Areas covered ─────────────────────────────────────────────────────────
    const rawAreas = (findFirst(profile, ["areasServed","coverageAreas","areas","coverage","serviceAreas","areasOfWork","workingAreas"]) ?? []) as unknown[];
    const areas = strArr(rawAreas);

    // ── Rating ────────────────────────────────────────────────────────────────
    const aggRating   = (profile?.aggregateRating ?? profile?.rating ?? bizLd?.aggregateRating) as Record<string, unknown> | undefined;
    const rating      = str(findFirst(aggRating, ["ratingValue","score","value"]) ?? findFirst(profile, ["score","averageRating","overallScore"]));
    const reviewCount = Number(findFirst(aggRating, ["reviewCount","ratingCount"]) ?? findFirst(profile, ["reviewCount","totalReviews","reviewsCount"]) ?? 0);

    // ── Opening hours ─────────────────────────────────────────────────────────
    const rawHours  = findFirst(profile, ["openingHours","businessHours","hours","openingTimes","workingHours"]);
    const openingHours = typeof rawHours === "string" ? rawHours
      : Array.isArray(rawHours) ? strArr(rawHours).join(", ")
      : str(bizLd?.openingHours);

    // ── Social links ──────────────────────────────────────────────────────────
    const sameAs       = bizLd?.sameAs;
    const socialLinks  = Array.isArray(sameAs) ? sameAs.map(str) : typeof sameAs === "string" ? [sameAs] : [];

    // Check description text for Instagram/Facebook URLs (common for Checkatrade traders)
    const socialFacebook =
      str(findFirst(profile, ["facebook","facebookUrl","socialFacebook"]))
      || socialLinks.find((s) => s.includes("facebook"))
      || extractFacebook(description)
      || extractFacebook(plainText.substring(0, 60000))
      || "";

    const socialInstagram =
      str(findFirst(profile, ["instagram","instagramUrl","socialInstagram"]))
      || socialLinks.find((s) => s.includes("instagram"))
      || extractInstagram(description)
      || extractInstagram(plainText.substring(0, 60000))
      || "";

    // ── Reviews ───────────────────────────────────────────────────────────────
    type RawReview = Record<string, unknown>;
    let rawReviews: RawReview[] = [];
    const profileReviews = findFirst(profile, ["reviews","testimonials","reviewList","customerReviews"]);
    if (Array.isArray(profileReviews)) {
      rawReviews = profileReviews as RawReview[];
    } else {
      for (const block of jsonLds) {
        if (Array.isArray(block.review)) rawReviews.push(...(block.review as RawReview[]));
        if (block["@type"] === "Review")  rawReviews.push(block as RawReview);
      }
      if (bizLd?.review && Array.isArray(bizLd.review)) rawReviews.push(...(bizLd.review as RawReview[]));
    }
    const ANON_NAMES = new Set(["anonymous", "anon", "customer", "user", "guest", "unknown", "hidden"]);
    function resolveReviewerName(r: RawReview): string {
      // Try nested reviewer / consumer / user / author objects (Checkatrade uses these)
      for (const key of ["reviewer", "consumer", "user", "author", "customer", "member"]) {
        const obj = r[key] as Record<string, unknown> | undefined;
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          const candidate =
            str(obj.displayName ?? obj.fullName ?? obj.name ?? "")
            || (() => {
              const first = str(obj.firstName ?? obj.forename ?? "");
              const last  = str(obj.lastName ?? obj.surname ?? obj.familyName ?? "");
              return first ? (last ? `${first} ${last[0]}.` : first) : "";
            })();
          if (candidate && !ANON_NAMES.has(candidate.toLowerCase())) return candidate;
        }
      }
      // Flat string fields
      const flat = str(
        r.reviewerName ?? r.customerName ?? r.displayName ??
        r.firstName ?? r.name ?? r.author ?? ""
      );
      if (flat && !ANON_NAMES.has(flat.toLowerCase())) return flat;
      return "";
    }

    const reviews = rawReviews.slice(0, 10).map((r) => ({
      author: resolveReviewerName(r) || "Verified Customer",
      rating: Number((r.reviewRating as Record<string, unknown>)?.ratingValue ?? r.rating ?? r.stars ?? 5),
      body:   str(r.reviewBody ?? r.body ?? r.text ?? r.comment ?? r.description ?? ""),
      date:   str(r.datePublished ?? r.date ?? r.createdAt ?? r.publishedAt ?? ""),
      source: "checkatrade" as const,
    }));

    // ── Photos ────────────────────────────────────────────────────────────────
    const photoSet = new Set<string>();

    // Collect from structured data
    if (profile) collectImages(profile, photoSet);
    if (pageProps) {
      for (const k of [
        "images","photos","gallery","media","portfolioImages","workImages",
        "portfolio","work","companyImages","profileImages","companyMedia",
        "tradeImages","workPhotos","companyPhotos","memberImages",
      ]) {
        if (pageProps[k]) collectImages(pageProps[k], photoSet);
      }
    }

    // Always also scan HTML — catches /_next/image? URLs and og:image
    for (const p of extractPhotosFromHtml(html)) photoSet.add(p);

    // og:image is often the main company photo and a reliable fallback
    // (skip private GCS URLs — they need auth tokens to open)
    const ogImage = metaContent(html, "og:image");
    const isPrivateGcs = (u: string) => u.includes("storage.googleapis.com") || u.includes("storage.cloud.google.com");
    if (ogImage && isPhoto(ogImage) && !isPrivateGcs(ogImage)) photoSet.add(ogImage);

    // Filter out private GCS URLs that collectImages may have found in __NEXT_DATA__
    const photos = [...photoSet].filter(u => isPhoto(u) && !isPrivateGcs(u)).slice(0, 20);

    // ── Return ────────────────────────────────────────────────────────────────
    return NextResponse.json({
      ok: true,
      name,
      owner,
      description,
      phone,
      email,
      city,
      postcode,
      skills,
      accreditations,
      companyType,
      vatRegistered,
      capabilities,
      yearsOnCheckatrade,
      tradingYears,
      areas,
      rating,
      reviewCount,
      openingHours,
      socialFacebook,
      socialInstagram,
      reviews,
      photos,
      _found: {
        hasNextData:  !!nextData,
        hasPageProps: !!pageProps,
        hasProfile:   !!profile,
        profileKeys:  profile ? Object.keys(profile).slice(0, 40) : [],
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
