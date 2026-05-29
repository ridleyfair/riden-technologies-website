import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// ── Cloudflare-compatible env accessor ────────────────────────────────────────

function getAnthropicKey(): string {
  let env: Record<string, string | undefined> = process.env as Record<string, string | undefined>;
  try {
    const cf = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cf.ANTHROPIC_API_KEY) env = { ...env, ...cf };
  } catch {
    // local dev — fall through to process.env
  }
  return env.ANTHROPIC_API_KEY ?? "";
}

// ── Request body type ─────────────────────────────────────────────────────────

interface Review {
  author:    string;
  rating:    number;
  body:      string;
  source:    string;
  date?:     string;
  location?: string;
}

interface GenerateBody {
  projectId?: string;
  businessName: string;
  clientName: string;
  industry: string;
  city: string;
  postcode?: string;
  phone: string;
  email: string;
  services: string;
  about?: string;
  accreditations?: string;
  rating?: string;
  reviewCount?: number;
  tier: string;
  username: string;
  password: string;
  templateId?: string;
  logoUrl?: string;
  heroImage?: string;       // single image (legacy / backward compat)
  heroImages?: string[];    // multiple images — 2+ activates slideshow
  heroMobileImage?: string;
  brandColours?: {
    primary?:   string;   // accent/buttons — e.g. "#D6AD74"
    secondary?: string;   // dark sections/footer — e.g. "#111827"
    tertiary?:  string;   // backgrounds/cards — e.g. "#F8F4EC"
  };
  heroHotspots?: Array<{
    label: string; href: string;
    x: number; y: number; width: number; height: number;
    variant?: 'primary' | 'secondary';
    hideMobile?: boolean;
  }>;
  notes?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  platformUrl?: string;
  platform?: string;
  reviews?: Review[];
  photos?: string[];
  trustCards?: Array<{
    id:       string;
    title:    string;
    value:    string;
    icon:     string;
    location: string[];
    enabled:  boolean;
  }>;
  aboutProofCards?: Array<{
    id:       string;
    title:    string;
    value:    string;
    subtitle: string;
    icon:     string;
    enabled:  boolean;
  }>;
}

// ── Template definitions ──────────────────────────────────────────────────────
// Each template declares whether it is single-page (scroll) or multi-page
// (routed), and which pages + section types it expects.
// Section types understood by the renderer: hero, services, about,
// testimonials, gallery, cta, contact, footer.

interface PageDef {
  slug: string;
  title: string;
  sections: string[];
}

interface TemplateDef {
  themeId: string;
  siteType: "single-page" | "multi-page";
  label: string;
  pages: PageDef[];
}

const TEMPLATE_DEFINITIONS: Record<string, TemplateDef> = {
  "modern-minimal": {
    themeId: "minimal",
    siteType: "multi-page",
    label: "Modern Minimal",
    pages: [
      { slug: "/",         title: "Home",     sections: ["hero", "services", "process", "testimonials", "cta", "footer"] },
      { slug: "/our-work", title: "Our Work", sections: ["hero", "gallery", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "process", "cta", "footer"] },
      { slug: "/about",    title: "About",    sections: ["hero", "about", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",  sections: ["hero", "contact", "footer"] },
    ],
  },
  "tradie-bold": {
    themeId: "bold",
    siteType: "single-page",
    label: "Tradie Bold",
    pages: [
      { slug: "/", title: "Home", sections: ["hero", "services", "about", "gallery", "testimonials", "cta", "footer"] },
    ],
  },
  "healthcare-clean": {
    themeId: "minimal",
    siteType: "multi-page",
    label: "Healthcare Clean",
    pages: [
      { slug: "/",         title: "Home",     sections: ["hero", "services", "testimonials", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "cta", "footer"] },
      { slug: "/about",    title: "About",    sections: ["hero", "about", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",  sections: ["hero", "contact", "footer"] },
    ],
  },
  "beauty-elegant": {
    themeId: "elegant",
    siteType: "multi-page",
    label: "Beauty Elegant",
    pages: [
      { slug: "/",         title: "Home",     sections: ["hero", "services", "gallery", "testimonials", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "cta", "footer"] },
      { slug: "/gallery",  title: "Gallery",  sections: ["hero", "gallery", "cta", "footer"] },
      { slug: "/about",    title: "About",    sections: ["hero", "about", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",  sections: ["hero", "contact", "footer"] },
    ],
  },
  "luxury-premium": {
    themeId: "elegant",
    siteType: "multi-page",
    label: "Luxury Premium",
    pages: [
      { slug: "/",         title: "Home",     sections: ["hero", "services", "about", "testimonials", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "cta", "footer"] },
      { slug: "/gallery",  title: "Gallery",  sections: ["hero", "gallery", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",  sections: ["hero", "contact", "footer"] },
    ],
  },
  "corporate-professional": {
    themeId: "modern",
    siteType: "multi-page",
    label: "Corporate Professional",
    pages: [
      { slug: "/",         title: "Home",     sections: ["hero", "services", "about", "testimonials", "cta", "footer"] },
      { slug: "/about",    title: "About",    sections: ["hero", "about", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",  sections: ["hero", "contact", "footer"] },
    ],
  },
  "legal-authority": {
    themeId: "classic",
    siteType: "multi-page",
    label: "Legal Authority",
    pages: [
      { slug: "/",                title: "Home",           sections: ["hero", "services", "about", "testimonials", "cta", "footer"] },
      { slug: "/practice-areas",  title: "Practice Areas", sections: ["hero", "services", "cta", "footer"] },
      { slug: "/about",           title: "About",          sections: ["hero", "about", "cta", "footer"] },
      { slug: "/contact",         title: "Contact",        sections: ["hero", "contact", "footer"] },
    ],
  },
};

// Kept for backward compatibility — derived from TEMPLATE_DEFINITIONS
const TEMPLATE_THEMES: Record<string, string> = Object.fromEntries(
  Object.entries(TEMPLATE_DEFINITIONS).map(([id, def]) => [id, def.themeId]),
);

function pickTemplate(industry: string): { templateId: string; themeId: string } {
  const ind = (industry ?? "").toLowerCase();
  let templateId = "modern-minimal";
  if (["trades", "automotive", "construction", "plumbing", "electrical", "roofing"].some((k) => ind.includes(k))) {
    templateId = "tradie-bold";
  } else if (["beauty", "salon", "spa", "nails", "hair"].some((k) => ind.includes(k))) {
    templateId = "beauty-elegant";
  } else if (["health", "medical", "dental", "therapy", "care"].some((k) => ind.includes(k))) {
    templateId = "healthcare-clean";
  } else if (["legal", "law", "solicitor"].some((k) => ind.includes(k))) {
    templateId = "legal-authority";
  }
  return { templateId, themeId: TEMPLATE_DEFINITIONS[templateId].themeId };
}

// ── About field parser — cleans scraped Checkatrade / web text ────────────────

function parseAbout(raw: string): {
  cleaned: string;
  trustSignals: string[];
  locations: string[];
} {
  const noisePatterns = [
    /^(Overview|Skills|Reviews|Photos|Company\s+info|Request\s+a\s+quote|Get\s+a\s+quote|View\s+all|See\s+all|Show\s+more|Home|Back|Next|Previous|Trustmarks|Follow|Share|Report|Verified|Profile|Gallery|Checkatrade\s+Guarantee)$/i,
    /^\d+\s+(reviews?|photos?|jobs?\s+completed?)$/i,
    /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\s*[\-–:]/i,
    /^(Call|Email|Message|Contact)\s+now$/i,
    /^(Read\s+more|Less|Expand|Collapse|Load\s+more)$/i,
  ];

  const lines = raw.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  const cleanLines: string[] = [];
  const trustSignals: string[] = [];
  const locations: string[] = [];

  for (const line of lines) {
    if (noisePatterns.some((p) => p.test(line))) continue;

    if (/checkatrade\s+member\s+since|member\s+since\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(line)) {
      trustSignals.push(line);
    }
    if (/trading\s+for\s+\d+|years?\s+on\s+checkatrade|\d+\s*years?\s+(of\s+)?experience|established\s+in\s+\d{4}/i.test(line)) {
      trustSignals.push(line);
    }
    if (/areas?\s+covered|service\s+area|we\s+cover|covering|based\s+in|serving\s+(the\s+)?/i.test(line)) {
      locations.push(line);
    }

    cleanLines.push(line);
  }

  const deduped: string[] = [];
  for (const line of cleanLines) {
    if (deduped[deduped.length - 1] !== line) deduped.push(line);
  }

  return {
    cleaned: deduped.join("\n"),
    trustSignals: [...new Set(trustSignals)],
    locations: [...new Set(locations)],
  };
}

// ── Review stats helpers ──────────────────────────────────────────────────────

/** Floor review count to nearest 10 and add "+", e.g. 28 → "20+", 9 → "9" */
function formatReviewCount(n: number): string {
  if (n < 10) return String(n)
  return `${Math.floor(n / 10) * 10}+`
}

/**
 * Extract Checkatrade rating and review count from raw About text.
 * Used as a fallback when body.rating / body.reviewCount are not provided.
 */
function parseReviewStatsFromAbout(about: string): { rating?: string; reviewCount?: number } {
  let rating: string | undefined
  let reviewCount: number | undefined

  // Match "9.69/10", "rated 9.69/10", "9.69 out of 10"
  const tenMatch = about.match(/(\d+(?:\.\d+)?)\s*\/\s*10/i)
  if (tenMatch) {
    const r = parseFloat(tenMatch[1])
    if (r >= 0 && r <= 10) rating = `${tenMatch[1]}/10`
  }

  // Match "28 reviews", "based on 28 reviews", "28 verified reviews"
  const countMatch = about.match(/\b(\d+)\s+(?:verified\s+)?reviews?\b/i)
  if (countMatch) reviewCount = parseInt(countMatch[1], 10)

  return { rating, reviewCount }
}

// ── Copy cleanup — strip em/en dashes before saving ──────────────────────────

const COPY_SKIP_KEYS = new Set([
  'phone', 'email', 'href', 'ctaHref', 'secondaryCtaHref', 'platformUrl',
  'src', 'url', 'logoUrl', 'logoSvg', 'backgroundImage', 'mobileBackgroundImage',
  'avatar', 'linkedIn', 'headingFont', 'bodyFont', 'icon', 'platform', 'source',
  'variant', 'mediaType', 'animationStyle', 'tone', 'slug', 'type', 'id',
  'businessId', 'themeId', 'templateId', 'siteType', 'tier', 'version', 'number',
  'period', 'value', 'primary', 'secondary', 'accent', 'background', 'surface',
  'text', 'textMuted',
])

function cleanDashStr(s: string): string {
  if (/^https?:\/\//.test(s) || /^\//.test(s) || /^#/.test(s) ||
      /^tel:/.test(s) || /^mailto:/.test(s) || /@/.test(s)) return s
  let r = s.replace(/\s*[—–]\s*/g, ', ')
  r = r.replace(/,\s*,+/g, ', ')
  r = r.replace(/^[,\s]+/, '')
  r = r.replace(/,\s*([.!?])/g, '$1')
  r = r.replace(/,\s*$/, '.')
  return r.replace(/  +/g, ' ').trim()
}

function cleanDashesInSpec(val: unknown, key?: string): unknown {
  if (key !== undefined && COPY_SKIP_KEYS.has(key)) return val
  if (typeof val === 'string') return cleanDashStr(val)
  if (Array.isArray(val)) return val.map(item => cleanDashesInSpec(item))
  if (val !== null && typeof val === 'object')
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).map(([k, v]) => [k, cleanDashesInSpec(v, k)])
    )
  return val
}

// ── Build the pages JSON fragment for the Claude prompt ───────────────────────
// Produces a JSON-like schema with placeholders that Claude fills in.

function buildPagesJson(
  def: TemplateDef,
  body: GenerateBody,
  topReviews: Review[],
  locationSuffix: string,
): string {
  const phone = body.phone;
  const city = body.city + locationSuffix;
  const year = new Date().getFullYear();
  const hasPhotos = (body.photos ?? []).length > 0;
  // No reviewsNote variable needed — reviews are pre-serialised or left empty

  // Build nav links — anchor links for single-page, routes for multi-page
  const navLinks = def.siteType === "single-page"
    ? [
        { label: "Home", href: "/" },
        { label: "Services", href: "#services" },
        { label: "About", href: "#about" },
        { label: "Contact", href: "#contact" },
      ]
    : def.pages.map((p) => ({ label: p.title, href: p.slug }));

  const navJson = JSON.stringify(navLinks, null, 2)
    .split("\n").join("\n  "); // indent to match outer JSON

  const pageJsons = def.pages.map((page) => {
    const isHome = page.slug === "/";
    const sectionJsons: string[] = [];

    for (const sType of page.sections) {
      switch (sType) {
        case "hero":
          if (isHome) {
            sectionJsons.push(`{ "type": "hero", "content": { "tagline": "<specific tagline using About facts — NOT generic filler>", "subHeadline": "<specific sub-headline with real services or trust signals>", "cta": "Get a Free Quote", "ctaHref": "tel:${phone}" } }`);
          } else {
            sectionJsons.push(`{ "type": "hero", "content": { "tagline": "<${page.title} — concise page headline>", "subHeadline": "<1-line page intro>", "variant": "mini" } }`);
          }
          break;

        case "services":
          if (isHome) {
            sectionJsons.push(`{ "type": "services", "content": { "headline": "Our Services", "items": [ <3–6 top service highlights — ONLY from the Services list: "${body.services}" — each: "name" (title-case), "description" (1 concise sentence, 18–32 words max, no business name, no filler), "icon" (pick best from: stairs|door|window|kitchen|cabinet|roof|hammer|wrench|tool|ruler|radiator|alert|cabin|building|home|shield|leaf|zap|scissors|box), "highlight" (bool)> ] } }`);
          } else {
            sectionJsons.push(`{ "type": "services", "content": { "headline": "Everything We Offer", "items": [ <one item per entry in the Services list: "${body.services}" — do NOT add services from About that are not in this list — each: "name" (title-case), "description" (1 concise sentence, 18–32 words max, no business name, no filler — be specific about what the service delivers), "icon" (pick best from: stairs|door|window|kitchen|cabinet|roof|hammer|wrench|tool|ruler|radiator|alert|cabin|building|home|shield|leaf|zap|scissors|box), "highlight" (bool)> ] } }`);
          }
          break;

        case "about":
          sectionJsons.push(`{ "type": "about", "content": { "headline": "About Us", "body": "<professionally rewritten About text — preserve ALL real facts: membership dates, years trading, specific locations, named capabilities>" } }`);
          break;

        case "testimonials": {
          if (topReviews.length === 0) {
            // No real reviews — output empty items; post-processing will remove this section
            sectionJsons.push(`{ "type": "testimonials", "content": { "headline": "What Our Customers Say", "items": [] } }`);
          } else {
            // Pre-serialise real reviews so Claude copies them verbatim
            const safeItems = topReviews.map(r => ({
              author:   r.author || "Verified Customer",
              location: r.location || body.city,
              body:     r.body.trim().replace(/"/g, '“').replace(/'/g, '’'),
              rating:   r.rating > 5 ? Math.round(r.rating / 2) : Math.max(1, Math.min(5, r.rating)),
              source:   r.source || "Checkatrade",
              ...(r.date ? { date: r.date } : {}),
            }));
            sectionJsons.push(
              `{ "type": "testimonials", "content": { "headline": "What Our Customers Say", "items": ${JSON.stringify(safeItems)} } }`
            );
          }
          break;
        }

        case "gallery":
          if (hasPhotos) {
            sectionJsons.push(`{ "type": "gallery", "content": { "headline": "Our Work", "subHeadline": "A selection of recent projects", "items": ${JSON.stringify(body.photos!.map((src, i) => ({ src, alt: `Work photo ${i + 1}`, caption: "" })))} } }`);
          }
          // if no photos provided, omit gallery section entirely
          break;

        case "cta":
          sectionJsons.push(`{ "type": "cta", "content": { "headline": "<specific CTA for ${body.industry} in ${city}>", "subHeadline": "<specific sub-headline using services from About>", "cta": "Call Now", "ctaHref": "tel:${phone}" } }`);
          break;

        case "contact":
          sectionJsons.push(`{ "type": "contact", "content": { "headline": "Get In Touch", "subHeadline": "<friendly invite to get in touch>", "phone": "${phone}", "email": "${body.email}", "address": "${city}"${body.notes ? `, "openingHours": "${body.notes}"` : ""} } }`);
          break;

        case "process":
          sectionJsons.push(`{ "type": "process", "content": { "headline": "How We Work", "subHeadline": "<1-line description of the simple, clear process>", "steps": [ <4 steps specific to ${body.industry} work: each has number ("1"/"2"/"3"/"4"), title (2-4 words), description (max 10 words — one very short sentence, no filler)> ] } }`);
          break;

        case "footer":
          sectionJsons.push(`{ "type": "footer", "content": { "tagline": "<short tagline from About facts>", "columns": [], "phone": "${phone}", "email": "${body.email}", "address": "${city}", "copyright": "© ${year} ${body.businessName}. All rights reserved." } }`);
          break;
      }
    }

    const sectionsStr = sectionJsons.join(",\n          ");
    return `{
      "slug": "${page.slug}",
      "title": "${page.title}",
      "sections": [
          ${sectionsStr}
      ]
    }`;
  });

  return `{
  "pages": [
    ${pageJsons.join(",\n    ")}
  ],
  "nav": {
    "links": ${navJson},
    "ctaLabel": "Get a Free Quote",
    "ctaHref": "tel:${phone}"
  }
}`;
}

// ── Claude API call ───────────────────────────────────────────────────────────

async function generateSiteSpec(
  body: GenerateBody,
  templateId: string,
  themeId: string,
  templateDef: TemplateDef,
  apiKey: string,
): Promise<string> {
  // ── Debug logging ──────────────────────────────────────────────────────────
  const aboutLength = body.about?.length ?? 0;
  console.log(
    `[generate-website] businessName="${body.businessName}"`,
    `templateId="${templateId}" siteType="${templateDef.siteType}"`,
    `about.length=${aboutLength}`,
  );
  if (aboutLength === 0) {
    console.warn("[generate-website] WARNING: about field is empty — copy will use generic fallback");
  } else {
    console.log(`[generate-website] about preview: ${body.about!.slice(0, 300)}`);
  }

  // ── Parse About field ──────────────────────────────────────────────────────
  const parsedAbout = parseAbout(body.about ?? "");
  console.log(
    `[generate-website] parsedAbout.cleaned.length=${parsedAbout.cleaned.length}`,
    `trustSignals=${JSON.stringify(parsedAbout.trustSignals)}`,
    `locations=${JSON.stringify(parsedAbout.locations)}`,
  );

  // ── Top real reviews ───────────────────────────────────────────────────────
  const realReviews = Array.isArray(body.reviews) ? body.reviews : [];
  const topReviews = realReviews
    .filter((r) => r.body && r.body.trim().length > 15)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  const locationSuffix = body.postcode ? ` (${body.postcode})` : "";
  const city = body.city + locationSuffix;

  const aboutBlock = parsedAbout.cleaned.length > 0
    ? parsedAbout.cleaned
    : "(No About information provided — use industry and city as fallback only.)";

  const trustLine = parsedAbout.trustSignals.length > 0
    ? `\nTrust signals: ${parsedAbout.trustSignals.join("; ")}` : "";
  const locationLine = parsedAbout.locations.length > 0
    ? `\nService areas: ${parsedAbout.locations.join("; ")}` : "";

  const reviewsBlock =
    topReviews.length > 0
      ? `\nREAL REVIEWS (${topReviews.length} imported — already embedded in testimonials section below, DO NOT alter):\n${topReviews.map((r, idx) => `${idx + 1}. "${r.body.trim()}" — ${r.author}${r.location ? `, ${r.location}` : ""}${r.date ? ` (${r.date})` : ""}, ${r.rating > 5 ? Math.round(r.rating / 2) : r.rating}/5`).join("\n")}`
      : "\n(No real reviews available — testimonials.content.items MUST be an empty array []. Do NOT invent any reviews.)";

  // ── Build the template-specific pages schema ───────────────────────────────
  const pagesSchema = buildPagesJson(templateDef, body, topReviews, locationSuffix);

  const systemPrompt =
    "You are a professional website copywriter for Riden Technologies. " +
    "Generate a complete SiteSpec JSON for a client website. " +
    "The ABOUT section is the PRIMARY source of truth — base ALL copy on it. " +
    "Follow the exact page/section structure provided — do not add or remove pages. " +
    "Return ONLY valid JSON, no markdown, no explanation.";

  const pageCount = templateDef.pages.length;
  const siteTypeDesc = templateDef.siteType === "multi-page"
    ? `MULTI-PAGE site (${pageCount} pages with routing)`
    : "SINGLE-PAGE site (all sections on one scroll)";

  const userPrompt = `Generate a complete SiteSpec JSON for this business.

SELECTED TEMPLATE: ${templateId} (${templateDef.label})
SITE TYPE: ${siteTypeDesc}
PAGES TO GENERATE: ${templateDef.pages.map((p) => `${p.title} (${p.slug})`).join(", ")}

══════════════════════════════════════════
PRIMARY SOURCE — ABOUT THIS BUSINESS
Read this carefully. Base ALL copy on it.
══════════════════════════════════════════
${aboutBlock}${trustLine}${locationLine}
══════════════════════════════════════════

BUSINESS DETAILS:
Business Name: ${body.businessName}
Industry: ${body.industry}
City/Location: ${city}
Phone: ${body.phone}
Email: ${body.email}
Services: ${body.services}${body.accreditations ? `\nAccreditations: ${body.accreditations}` : ""}${body.rating ? `\nCheckatrade Rating: ${body.rating}/10 from ${body.reviewCount ?? 0} verified reviews` : ""}${body.notes ? `\nOpening Hours: ${body.notes}` : ""}${body.socialFacebook ? `\nFacebook: ${body.socialFacebook}` : ""}${body.socialInstagram ? `\nInstagram: ${body.socialInstagram}` : ""}
${reviewsBlock}

MANDATORY CONTENT RULES:
1. Hero (home page) — specific tagline using REAL facts from About. FORBIDDEN: "passionate professionals", "years of experience" without a number, "trusted local experts".
2. Hero (sub-pages) — brief page-specific headline, not the business tagline.
3. Services — use ONLY the items in the Services list. Do NOT pull extra services from the About text. Home page: 3–6 highlights from the list. Dedicated services page: one card per item in the list, no additions. Every description: 1 sentence, 18–32 words MAX. No business name. No filler.
4. About — professionally rewrite About text. Preserve ALL facts (dates, years, locations, capabilities).
5. Testimonials — CRITICAL: testimonials.content.items are pre-populated. Copy them exactly as given. If items is [], keep it as [] — NEVER invent testimonials.
6. Trust signals — ONLY from About/Accreditations. No invented certifications.
7. SEO — include specific services and ${city} location.
8. Contact section — include real phone, email, address, opening hours from the brief.
9. PUNCTUATION — NEVER use em dashes (—) or en dashes (–) anywhere in copy. Use commas, periods, or natural sentence structure instead. BAD: "Expert craftsmanship — fully insured". GOOD: "Expert craftsmanship, fully insured workmanship."${body.brandColours ? `\n10. BRAND COLOURS — The client has specified exact brand colours. Use them EXACTLY as provided — do not invent a different palette. accent="${body.brandColours.primary ?? 'n/a'}", primary="${body.brandColours.secondary ?? 'n/a'}", background="${body.brandColours.tertiary ?? 'n/a'}". These are already pre-filled in the brand.palette below — do not change them.` : ''}

DO NOT:
- Generate different pages than the structure provided
- Write generic filler copy
- Invent services, certifications, or reviews not in the source data
- Add or remove sections from any page
- Replace reviewer names with "Anonymous" or any other name — preserve the author field exactly as supplied; if it is missing use "Verified Customer"

The JSON must exactly match this structure (fill in all <placeholders> with real content):
{
  "version": 1,
  "businessId": "<uuid>",
  "businessName": "${body.businessName}",
  "tier": "${body.tier}",
  "themeId": "${themeId}",
  "templateId": "${templateId}",
  "siteType": "${templateDef.siteType}",
  "enabledModules": [],
  "brand": {
    "palette": {
      "primary":    "${body.brandColours?.secondary  ?? '<hex — dark colour for footer/nav>'}",
      "secondary":  "${body.brandColours?.secondary  ?? '<hex>'}",
      "accent":     "${body.brandColours?.primary    ?? '<hex — highlight/button colour>'}",
      "background": "${body.brandColours?.tertiary   ?? '<hex — light page background>'}",
      "surface":    "${body.brandColours?.tertiary   ?? '<hex — card/section background>'}",
      "text":       "<hex — dark body text, choose to contrast with background>",
      "textMuted":  "<hex — muted/secondary text>"
    },
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "tone": "professional",
    "logoText": "${body.businessName}"
  },
  ${pagesSchema.slice(1, -1).trim()},
  "seo": {
    "title": "<SEO title — specific services + ${city}>",
    "description": "<meta description using real services from About and ${city}>",
    "keywords": [ <5-8 keywords using specific services from About and location> ],
    "ogTitle": "<og title>",
    "ogDescription": "<og description>"
  }
}

Return ONLY the JSON object.`;

  console.log(
    `[generate-website] prompt.length=${userPrompt.length}`,
    `pages=${pageCount}`,
    `about.included=${userPrompt.includes(aboutBlock.slice(0, 20))}`,
  );

  // Multi-page sites with 5 pages can exceed 8 K tokens — use extended output.
  // Single-page sites rarely reach 4 K but give headroom for large about/reviews.
  const maxTokens = templateDef.siteType === "multi-page" ? 16000 : 8000;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "output-128k-2025-02-19",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as {
    content:      Array<{ type: string; text: string }>;
    stop_reason?: string;
  };
  let text = data.content.find((c) => c.type === "text")?.text ?? "";
  if (!text) throw new Error("Claude returned empty response");

  // Detect truncation before attempting JSON.parse so the error is actionable.
  if (data.stop_reason === "max_tokens") {
    throw new Error(
      "Site spec was truncated (output token limit reached). Try reducing the number of services or reviews, then regenerate.",
    );
  }

  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return text;
}

// ── POST /api/generate-website ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const apiKey = getAnthropicKey();
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 500 });
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.businessName || !body.clientName || !body.username || !body.password) {
    return NextResponse.json(
      { error: "businessName, clientName, username, and password are required." },
      { status: 400 },
    );
  }

  if (!body.about || body.about.trim().length === 0) {
    console.warn(`[generate-website] about is empty for "${body.businessName}" — copy will be generic`);
  }

  // ── Resolve template — user selection takes priority ──────────────────────
  const resolvedTemplateId = body.templateId && TEMPLATE_DEFINITIONS[body.templateId]
    ? body.templateId
    : pickTemplate(body.industry).templateId;
  const templateDef = TEMPLATE_DEFINITIONS[resolvedTemplateId];
  const resolvedThemeId = templateDef.themeId;

  console.log(
    `[generate-website] resolved templateId="${resolvedTemplateId}"`,
    `(requested="${body.templateId ?? "auto"}")`,
    `themeId="${resolvedThemeId}"`,
    `siteType="${templateDef.siteType}"`,
    `pages=${templateDef.pages.map((p) => p.slug).join(",")}`,
  );

  // ── Generate spec ──────────────────────────────────────────────────────────
  let specJson: string;
  try {
    specJson = await generateSiteSpec(body, resolvedTemplateId, resolvedThemeId, templateDef, apiKey);
    const spec = JSON.parse(specJson) as Record<string, unknown>;

    // Always enforce resolved template/tier — Claude occasionally drifts
    spec.tier = body.tier;
    spec.templateId = resolvedTemplateId;
    spec.themeId = resolvedThemeId;
    spec.siteType = templateDef.siteType;

    // Override palette with exact client brand colours if provided
    if (body.brandColours) {
      const pal = (spec.brand as Record<string, unknown>).palette as Record<string, unknown>
      if (body.brandColours.primary)   { pal.accent     = body.brandColours.primary   }
      if (body.brandColours.secondary) { pal.primary    = body.brandColours.secondary; pal.secondary = body.brandColours.secondary }
      if (body.brandColours.tertiary)  { pal.background = body.brandColours.tertiary;  pal.surface   = body.brandColours.tertiary  }
    }

    // Inject logo URL into brand config
    if (body.logoUrl) {
      const brand = spec.brand as Record<string, unknown>;
      brand.logoUrl = body.logoUrl;
    }

    const pages = spec.pages as Array<Record<string, unknown>> | undefined;

    // Pre-build the canonical review items once (rating normalised, source set)
    // Re-derive from body.reviews since topReviews is scoped inside generateSiteSpec
    const postProcessReviews = (body.reviews ?? [])
      .filter((r) => r.body && r.body.trim().length > 15)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
    const canonicalReviews = postProcessReviews.map((r) => ({
      author:   r.author || "Verified Customer",
      location: r.location || body.city,
      body:     r.body.trim(),
      rating:   r.rating > 5 ? Math.round(r.rating / 2) : Math.max(1, Math.min(5, r.rating)),
      source:   r.source || "Checkatrade",
      ...(r.date ? { date: r.date } : {}),
    }));

    if (Array.isArray(pages)) {
      for (const page of pages) {
        let sections = Array.isArray(page.sections) ? page.sections as Record<string, unknown>[] : null;
        if (!sections) continue;

        // ── Testimonials post-processing ──────────────────────────────────────
        // 1. Overwrite items with canonical reviews (or keep empty if none)
        // 2. Always inject platform metadata — never gated on platformUrl
        // 3. Remove testimonials sections with 0 items AND no rating metadata

        // Resolve authoritative rating / count — brief fields take priority over About text
        const aboutStats      = parseReviewStatsFromAbout(body.about ?? "");
        const effectiveCount  = body.reviewCount ?? aboutStats.reviewCount;
        const effectiveRating = (() => {
          if (body.rating) {
            // body.rating from Checkatrade scraper is a plain number string e.g. "9.69"
            return body.rating.includes("/") ? body.rating : `${body.rating}/10`;
          }
          return aboutStats.rating; // already "X.XX/10" from parser
        })();

        for (const section of sections) {
          if ((section.type as string) !== "testimonials") continue;
          const sc = section.content as Record<string, unknown>;

          sc.items    = canonicalReviews.length > 0 ? canonicalReviews : [];
          sc.platform = body.platform ?? "Checkatrade";

          if (effectiveCount !== undefined && effectiveCount > 0) {
            sc.totalReviews        = effectiveCount;
            sc.displayReviewCount  = formatReviewCount(effectiveCount);
          } else if (canonicalReviews.length > 0) {
            sc.totalReviews        = canonicalReviews.length;
            sc.displayReviewCount  = formatReviewCount(canonicalReviews.length);
          }

          if (effectiveRating) {
            sc.averageRating = effectiveRating;
          }

          if (body.platformUrl) {
            sc.platformUrl = body.platformUrl;
          }
        }
        // Remove testimonials sections that have no items and no rating metadata
        sections = sections.filter((s) => {
          if ((s.type as string) !== "testimonials") return true;
          const sc    = s.content as Record<string, unknown>;
          const items = sc.items as unknown[];
          const hasItems   = Array.isArray(items) && items.length > 0;
          const hasRating  = !!(sc.averageRating || (sc.totalReviews as number) > 0);
          return hasItems || hasRating;
        });
        page.sections = sections;

        const isHome = (page.slug as string) === "/";

        // Relative upload URLs like /api/media/{uuid}.webp are only valid on the
        // CRM domain. The template engine is a separate deployment, so they must
        // be stored as absolute URLs so <img src="..."> resolves correctly there.
        const crmOrigin = new URL(req.url).origin;
        const toAbsUrl = (url: string) =>
          url.startsWith("/") ? `${crmOrigin}${url}` : url;

        // Inject hero image(s) into home page hero section only.
        // heroImages[] takes priority over legacy heroImage string.
        const rawHeroImages: string[] = body.heroImages?.length
          ? body.heroImages
          : body.heroImage ? [body.heroImage] : [];

        if (isHome && rawHeroImages.length > 0) {
          const heroSection = sections.find((s) => s.type === "hero") as Record<string, unknown> | undefined;
          if (heroSection) {
            const heroContent = heroSection.content as Record<string, unknown>;
            const absImages   = rawHeroImages.map(toAbsUrl);

            heroContent.backgroundImage = absImages[0];

            if (absImages.length > 1) {
              heroContent.heroImages = absImages;
            }

            // For .webp artwork heroes, inject hotspot click zones.
            // Admin-supplied hotspots take priority; otherwise derive sensible
            // defaults from the CTA labels Claude generated.
            const isWebpHero = absImages[0].split("?")[0].toLowerCase().endsWith(".webp");
            if (isWebpHero && body.heroMobileImage) {
              heroContent.mobileBackgroundImage = toAbsUrl(body.heroMobileImage);
            }
            if (isWebpHero) {
              if (body.heroHotspots && body.heroHotspots.length > 0) {
                heroContent.hotspots = body.heroHotspots;
              } else {
                const primary       = (heroContent.cta            as string) || "Get a Free Quote";
                const primaryHref   = (heroContent.ctaHref        as string) || "#contact";
                const secondary     = (heroContent.secondaryCta   as string) || "";
                const secondaryHref = (heroContent.secondaryCtaHref as string) || "#services";
                const defaults: typeof body.heroHotspots = [
                  { label: primary, href: primaryHref, variant: "primary",   x: 4,  y: 67, width: 19, height: 9 },
                ];
                if (secondary) {
                  defaults.push({ label: secondary, href: secondaryHref, variant: "secondary", x: 25, y: 67, width: 17, height: 9 });
                }
                heroContent.hotspots = defaults;
                console.log(`[generate-website] webp hero detected — injected ${defaults.length} default hotspot(s)`);
              }
            }
          }
        }

        // Inject real photos into whichever page the template designates for gallery
        if (body.photos && body.photos.length > 0) {
          const galleryPageSlug = templateDef.pages.find((p) => p.sections.includes("gallery"))?.slug;
          const isDesignatedGalleryPage = (page.slug as string) === galleryPageSlug;
          const gallerySection = sections.find((s) => s.type === "gallery") as Record<string, unknown> | undefined;

          if (gallerySection) {
            // Override items with real photos
            (gallerySection.content as Record<string, unknown>).items = body.photos.map((src, i) => ({
              src: toAbsUrl(src),
              alt: `${body.businessName} work photo ${i + 1}`,
              caption: "",
            }));
          } else if (isDesignatedGalleryPage) {
            // Inject gallery section if Claude omitted it on the designated gallery page
            const insertBefore = sections.findIndex((s) => s.type === "cta" || s.type === "footer");
            const idx = insertBefore >= 0 ? insertBefore : sections.length - 1;
            sections.splice(idx, 0, {
              type: "gallery",
              content: {
                headline: "Our Work",
                subHeadline: "A selection of recent projects",
                items: body.photos.map((src, i) => ({
                  src: toAbsUrl(src),
                  alt: `${body.businessName} work photo ${i + 1}`,
                  caption: "",
                })),
              },
            });
          }
        }
      }

      // Debug output
      const pageMap = pages.map((p) => {
        const sections = (p.sections as Record<string, unknown>[] | undefined) ?? [];
        return `${p.slug}[${sections.map((s) => s.type).join(",")}]`;
      });
      console.log(`[generate-website] final pages: ${pageMap.join(" | ")}`);
    }

    // Inject user-defined trust cards — overrides anything Claude may have invented
    if (body.trustCards && body.trustCards.length > 0) {
      spec.trustCards = body.trustCards.filter(c => c.enabled && c.title.trim() !== '');
    }

    // Inject user-defined about proof cards — Claude never generates these
    if (body.aboutProofCards && body.aboutProofCards.length > 0) {
      spec.aboutProofCards = body.aboutProofCards.filter(c => c.enabled && c.title.trim() !== '');
    }

    // Strip any em/en dashes Claude snuck into the copy
    specJson = JSON.stringify(cleanDashesInSpec(spec));
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to generate site spec: ${String(e)}` },
      { status: 500 },
    );
  }

  // ── Save to DB ─────────────────────────────────────────────────────────────
  const id = crypto.randomUUID();
  const previewUrl = `https://sites.ridentechnologies.com/preview/${id}`;

  try {
    const sql = getDb();
    await sql`
      INSERT INTO "GeneratedSite"
        (id, "projectId", "clientName", "businessName", industry, tier, "specJson", username, password, "previewUrl", status, "createdAt", "updatedAt")
      VALUES
        (${id}, ${body.projectId ?? null}, ${body.clientName}, ${body.businessName},
         ${body.industry ?? "professional"}, ${body.tier ?? "pro_plus"}, ${specJson},
         ${body.username}, ${body.password}, ${previewUrl}, 'ready', NOW(), NOW())
    `;
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to save generated site: ${String(e)}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, siteId: id, previewUrl });
}
