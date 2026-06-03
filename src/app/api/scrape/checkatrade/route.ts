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
      // HTML encodes & as &amp; inside attribute values — decode before parsing
      const qs     = m[1].replace(/&amp;/g, "&");
      const params = new URLSearchParams(qs);
      const rawUrl = decodeURIComponent(params.get("url") ?? "");
      if (!rawUrl || !rawUrl.startsWith("http")) continue;
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
  // 2b. React Query dehydrated state: pageProps.dehydratedState.queries[].state.data
  const dehydrated = (pageProps.dehydratedState ?? (pageProps as Record<string,unknown>)?.["dehydratedState"]) as Record<string, unknown> | undefined;
  if (dehydrated?.queries && Array.isArray(dehydrated.queries)) {
    for (const query of dehydrated.queries as Record<string, unknown>[]) {
      const data = (query?.state as Record<string, unknown>)?.data;
      if (!data || typeof data !== "object" || Array.isArray(data)) continue;
      const dataRec = data as Record<string, unknown>;
      // data itself might be the profile
      if (typeof dataRec.name === "string" && dataRec.name.length > 1 &&
          (typeof dataRec.description === "string" || Array.isArray(dataRec.skills) || Array.isArray(dataRec.trades))) {
        return dataRec;
      }
      // or profile is nested one level inside data
      for (const key of PROFILE_KEYS) {
        const v = dataRec[key];
        if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
      }
    }
  }
  // 3. Smart hunt: find any object that looks like a company profile.
  //    hunt() now traverses arrays so React Query / SWR nested structures are reached.
  const candidates: Array<{ score: number; obj: Record<string, unknown> }> = [];
  function hunt(obj: unknown, depth = 0): void {
    if (depth > 10 || !obj) return;
    if (Array.isArray(obj)) {
      for (const item of obj) hunt(item, depth + 1);
      return;
    }
    if (typeof obj !== "object") return;
    const rec = obj as Record<string, unknown>;
    let score = 0;
    if (typeof rec.name        === "string" && rec.name.length > 1)         score += 3;
    if (typeof rec.description === "string" && rec.description.length > 20) score += 3;
    if (typeof rec.about       === "string" && rec.about.length > 20)       score += 2;
    if (typeof rec.phone       === "string" || typeof rec.telephone === "string") score += 2;
    if (typeof rec.city        === "string" || typeof rec.town === "string") score += 1;
    if (typeof rec.postcode    === "string")                                 score += 1;
    if (Array.isArray(rec.skills) || Array.isArray(rec.trades))             score += 2;
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
    const DESC_KEYS = ["description","about","summary","bio","overview","companyDescription","businessDescription","profileDescription","memberDescription","intro","introduction","aboutUs","profileText","overview"];

    let description =
      str(findFirst(profile, DESC_KEYS))
      || str(bizLd?.description);

    // Deep search: look through all dehydrated query data for a long description string
    if (!description && pageProps) {
      const dh = (pageProps as Record<string, unknown>).dehydratedState as Record<string, unknown> | undefined;
      if (Array.isArray(dh?.queries)) {
        for (const q of dh!.queries as Record<string, unknown>[]) {
          const qd = ((q?.state as Record<string, unknown>)?.data) as unknown;
          if (!qd) continue;
          const found = findFirst(qd as Record<string, unknown>, DESC_KEYS);
          if (typeof found === "string" && found.length > 80) { description = found.trim(); break; }
        }
      }
    }

    // Walk every string field in pageProps looking for a long description
    if (!description && pageProps) {
      function scanForDesc(obj: unknown, depth = 0): string {
        if (depth > 8 || !obj) return "";
        if (typeof obj === "string") {
          if (obj.length > 100 && obj.length < 2000 && !obj.startsWith("http") && obj.includes(" ")) return obj.trim();
          return "";
        }
        if (Array.isArray(obj)) { for (const v of obj) { const r = scanForDesc(v, depth + 1); if (r) return r; } }
        if (typeof obj === "object") {
          const rec = obj as Record<string, unknown>;
          for (const key of DESC_KEYS) {
            if (typeof rec[key] === "string" && (rec[key] as string).length > 100) return (rec[key] as string).trim();
          }
          for (const v of Object.values(rec)) { const r = scanForDesc(v, depth + 1); if (r) return r; }
        }
        return "";
      }
      description = scanForDesc(pageProps);
    }

    // Last resort: try a targeted HTML extraction (NOT the full p-tag dump)
    if (!description) {
      const htmlPatterns = [
        html.match(/data-testid="[^"]*(?:description|overview|about)[^"]*"[^>]*>([\s\S]{80,3000}?)<\/(?:div|p|section)/i),
        html.match(/class="[^"]*(?:description|about|bio|overview|profile-text|company-info|member-description|trader-description)[^"]*"[^>]*>([\s\S]{80,3000}?)<\/(?:div|p|section)/i),
        html.match(/id="[^"]*(?:description|about|overview)[^"]*"[^>]*>([\s\S]{80,3000}?)<\/(?:div|p|section)/i),
      ];
      for (const m of htmlPatterns) {
        if (m) { const t = stripHtml(m[1]).trim(); if (t.length > 80) { description = t; break; } }
      }
    }

    // ── Contact ───────────────────────────────────────────────────────────────
    const phone =
      str(findFirst(profile, ["phone","phoneNumber","telephone","contactNumber","mobile","tel","mobileNumber"]))
      || str(bizLd?.telephone)
      || extractPhone(plainText.substring(0, 60000));

    const email =
      str(findFirst(profile, ["email","emailAddress","contactEmail"]))
      || str(bizLd?.email)
      || (() => {
          const m = plainText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}/);
          const e = m ? m[0] : "";
          // Reject filenames like checkatrade-logo@2x.png
          return e && !/\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(e) ? e : "";
        })();

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
    const SKILL_KEYS = [
      "skills","trades","categories","serviceTypes","workTypes","services",
      "tradeTypes","specialisms","tradeCategories","tradingCategories",
      "serviceOfferings","tradeInformation","primaryTrades","additionalTrades",
      "tradeSkills","expertise","offerings","tradesList","skillsList",
    ];

    const rawSkills = (findFirst(profile, SKILL_KEYS) ?? []) as unknown[];
    let skills = strArr(rawSkills);

    // If profile-level search fails, try top-level pageProps
    if (skills.length === 0 && pageProps) {
      skills = strArr((findFirst(pageProps, SKILL_KEYS) ?? []) as unknown[]);
    }

    // If still empty, search every React Query result individually — Checkatrade
    // often loads trades via a separate query that doesn't appear in the profile object.
    if (skills.length === 0 && pageProps) {
      const dh = (pageProps as Record<string, unknown>).dehydratedState as Record<string, unknown> | undefined;
      if (Array.isArray(dh?.queries)) {
        outer: for (const q of dh!.queries as Record<string, unknown>[]) {
          const qd = ((q?.state as Record<string, unknown>)?.data) as unknown;
          if (!qd) continue;
          for (const key of SKILL_KEYS) {
            const v = deepFind(qd, key);
            if (Array.isArray(v) && v.length > 0) {
              const ex = strArr(v);
              if (ex.length > 0) { skills = ex; break outer; }
            }
          }
        }
      }
    }

    // Also try JSON-LD serviceType / knowsAbout
    if (skills.length === 0) {
      for (const ld of jsonLds) {
        for (const key of ["serviceType","knowsAbout","makesOffer","hasOfferCatalog","serviceOutput"]) {
          const v = ld[key];
          if (v) {
            const ex = strArr(Array.isArray(v) ? v : [v]);
            if (ex.length > 0) { skills = ex; break; }
          }
        }
        if (skills.length > 0) break;
      }
    }

    // Last resort: extract from "Skills" section in the plain text.
    // Services are capitalized phrases separated only by spaces (no commas), so split
    // on lowercase→uppercase boundaries (e.g. "Building Basement" → split before "Basement").
    if (skills.length === 0) {
      const skillsRe = /\bSkills\b\s+([A-Z][A-Za-z\s\/\-]{10,500}?)(?=\s+(?:Reviews?|Photos?|Company\s+[Ii]nfo|Overview|About|Accreditations?)\b)/g;
      let sm: RegExpExecArray | null;
      while ((sm = skillsRe.exec(plainText)) !== null) {
        const items = sm[1]
          .trim()
          .split(/(?<=[a-z])\s+(?=[A-Z])/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 3 && s.length <= 80);
        if (items.length >= 2) { skills = items.slice(0, 30); break; }
      }
    }

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
    const rawPhotoSet = new Set<string>();

    // Collect from structured data (may include private GCS URLs — handled below)
    if (profile) collectImages(profile, rawPhotoSet);
    if (pageProps) {
      for (const k of [
        "images","photos","gallery","media","portfolioImages","workImages",
        "portfolio","work","companyImages","profileImages","companyMedia",
        "tradeImages","workPhotos","companyPhotos","memberImages",
      ]) {
        if (pageProps[k]) collectImages(pageProps[k], rawPhotoSet);
      }
    }

    // Always also scan HTML — catches /_next/image? proxy URLs
    for (const p of extractPhotosFromHtml(html)) rawPhotoSet.add(p);

    // og:image is often the main company photo
    const ogImage = metaContent(html, "og:image");
    if (ogImage && isPhoto(ogImage)) rawPhotoSet.add(ogImage);

    // JSON-LD may have an image field
    for (const img of (Array.isArray(bizLd?.image) ? bizLd!.image : bizLd?.image ? [bizLd.image] : []) as string[]) {
      if (typeof img === "string" && isPhoto(img)) rawPhotoSet.add(img);
    }

    // Checkatrade stores images in a private GCS bucket. Raw GCS URLs return
    // "Access Denied" but the same images ARE publicly accessible via Checkatrade's
    // /_next/image proxy (which has server-side GCS credentials). Wrap them.
    const isGcs = (u: string) => u.includes("storage.googleapis.com") || u.includes("storage.cloud.google.com");
    const toPublicUrl = (url: string): string =>
      isGcs(url)
        ? `https://www.checkatrade.com/_next/image?url=${encodeURIComponent(url)}&w=1920&q=75`
        : url;

    const photos = [...new Set(
      [...rawPhotoSet].filter(isPhoto).map(toPublicUrl)
    )].slice(0, 20);

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
        hasNextData:    !!nextData,
        hasPageProps:   !!pageProps,
        hasProfile:     !!profile,
        profileKeys:    profile ? Object.keys(profile).slice(0, 40) : [],
        pagePropsKeys:  pageProps ? Object.keys(pageProps).slice(0, 30) : [],
        hasDehydrated:  !!(pageProps as Record<string,unknown>)?.dehydratedState,
        queryCount:     Array.isArray(((pageProps as Record<string,unknown>)?.dehydratedState as Record<string,unknown>)?.queries)
                          ? ((((pageProps as Record<string,unknown>).dehydratedState as Record<string,unknown>).queries) as unknown[]).length
                          : 0,
        hasJsonLd:      jsonLds.length > 0,
        ogImage:        metaContent(html, "og:image").slice(0, 120) || "(none)",
        photoCount:     photos.length,
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
