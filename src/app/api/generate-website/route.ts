import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import {
  buildGalleryItemsFromAlbums,
  normalizeGeneratedSiteImageUrl,
  normalizeProjectAlbumsForGeneratedSite,
} from "@/lib/generated-site-image-mapping";

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
  reviewSettings?: {
    platform:        string;
    reviewCount?:    number;
    averageRating?:  string;
    platformUrl?:    string;
    showReviewBadge: boolean;
    showRatingBadge: boolean;
  };
  photos?: string[];
  projectAlbums?: Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    sourceUrl?: string;
    coverImageUrl?: string;
    photos: Array<{ id: string; url: string; alt?: string; caption?: string; displayOrder: number }>;
    enabled: boolean;
    displayOrder: number;
  }>;
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
  serviceAreas?:         string[];   // explicit list from Checkatrade areas field
  checkatradeProfileUrl?: string;    // for sameAs schema
  googleBusinessUrl?:    string;     // for sameAs schema
  beforeAfterPairs?: Array<{
    id:           string;
    beforeUrl:    string;
    afterUrl:     string;
    title?:       string;
    caption?:     string;
    category?:    string;
    displayOrder: number;
    enabled:      boolean;
  }>;
  aboutImage?: string;
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
    siteType: "multi-page",
    label: "Tradie Bold",
    pages: [
      { slug: "/",         title: "Home",     sections: ["hero", "stats", "services", "process", "testimonials", "gallery", "about", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "faq", "cta", "footer"] },
      { slug: "/gallery",  title: "Gallery",  sections: ["hero", "gallery", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",  sections: ["hero", "contact", "footer"] },
    ],
  },
  "outdoor-transform": {
    themeId: "modern",
    siteType: "multi-page",
    label: "Outdoor Transformations",
    pages: [
      { slug: "/",                title: "Home",            sections: ["hero", "stats", "before-after", "services", "gallery", "testimonials", "process", "cta", "footer"] },
      { slug: "/transformations", title: "Transformations", sections: ["hero", "before-after", "gallery", "cta", "footer"] },
      { slug: "/services",        title: "Services",        sections: ["hero", "services", "faq", "cta", "footer"] },
      { slug: "/about",           title: "About",           sections: ["hero", "about", "testimonials", "cta", "footer"] },
      { slug: "/contact",         title: "Contact",         sections: ["hero", "contact", "footer"] },
    ],
  },
  "emergency-trade": {
    themeId: "bold",
    siteType: "multi-page",
    label: "Emergency & Response",
    pages: [
      { slug: "/",         title: "Home",           sections: ["hero", "stats", "services", "service-areas", "testimonials", "process", "faq", "cta", "footer"] },
      { slug: "/services", title: "Services",       sections: ["hero", "services", "faq", "cta", "footer"] },
      { slug: "/areas",    title: "Areas We Cover", sections: ["hero", "service-areas", "testimonials", "cta", "footer"] },
      { slug: "/about",    title: "About",          sections: ["hero", "about", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",        sections: ["hero", "contact", "footer"] },
    ],
  },
  "reno-showcase": {
    themeId: "classic",
    siteType: "multi-page",
    label: "Renovation Showcase",
    pages: [
      { slug: "/",         title: "Home",     sections: ["hero", "stats", "gallery", "before-after", "services", "process", "testimonials", "cta", "footer"] },
      { slug: "/projects", title: "Projects", sections: ["hero", "gallery", "before-after", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "process", "faq", "cta", "footer"] },
      { slug: "/about",    title: "About",    sections: ["hero", "about", "testimonials", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",  sections: ["hero", "contact", "footer"] },
    ],
  },
  "finish-decor": {
    themeId: "minimal",
    siteType: "multi-page",
    label: "Finish & Decorating",
    pages: [
      { slug: "/",         title: "Home",     sections: ["hero", "before-after", "services", "gallery", "testimonials", "process", "cta", "footer"] },
      { slug: "/our-work", title: "Our Work", sections: ["hero", "before-after", "gallery", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "faq", "cta", "footer"] },
      { slug: "/about",    title: "About",    sections: ["hero", "about", "cta", "footer"] },
      { slug: "/contact",  title: "Contact",  sections: ["hero", "contact", "footer"] },
    ],
  },
  "beauty-pro-booking": {
    themeId: "elegant",
    siteType: "multi-page",
    label: "Beauty Pro+ Booking",
    pages: [
      { slug: "/",           title: "Home",      sections: ["hero", "services", "testimonials", "gallery", "about", "cta", "footer"] },
      { slug: "/services",   title: "Services",  sections: ["hero", "services", "cta", "footer"] },
      { slug: "/gallery",    title: "Gallery",   sections: ["hero", "gallery", "cta", "footer"] },
      { slug: "/about",      title: "About",     sections: ["hero", "about", "cta", "footer"] },
      { slug: "/booking",    title: "Book Now",  sections: ["hero", "contact", "footer"] },
      { slug: "/contact",    title: "Contact",   sections: ["hero", "contact", "footer"] },
    ],
  },
};

// Kept for backward compatibility — derived from TEMPLATE_DEFINITIONS
const TEMPLATE_THEMES: Record<string, string> = Object.fromEntries(
  Object.entries(TEMPLATE_DEFINITIONS).map(([id, def]) => [id, def.themeId]),
);

// Sector-family keyword routing — most specific match wins, checked in order.
// Each scraped trade maps to the sector template built for how that business
// actually sells (transformations / emergency response / showroom / finish).
const SECTOR_TEMPLATE_KEYWORDS: Array<{ templateId: string; keywords: string[] }> = [
  {
    templateId: "outdoor-transform",
    keywords: ["landscap", "garden", "driveway", "paving", "patio", "fenc", "tree surg", "turf", "decking", "groundwork", "artificial grass", "hedge"],
  },
  {
    templateId: "emergency-trade",
    keywords: ["plumb", "electric", "gas engineer", "gas safe", "heating", "boiler", "locksmith", "drain", "pest control", "emergency"],
  },
  {
    templateId: "reno-showcase",
    keywords: ["kitchen", "bathroom", "loft", "extension", "renovation", "refurbish", "builder", "building", "joiner", "carpent", "roof", "solar"],
  },
  {
    templateId: "finish-decor",
    keywords: ["paint", "decorat", "plaster", "tiler", "tiling", "floor", "window fitt", "glaz", "render"],
  },
];

function pickTemplate(industry: string): { templateId: string; themeId: string } {
  const ind = (industry ?? "").toLowerCase();
  let templateId = "modern-minimal";

  const sectorMatch = SECTOR_TEMPLATE_KEYWORDS.find((s) => s.keywords.some((k) => ind.includes(k)));
  if (sectorMatch) {
    templateId = sectorMatch.templateId;
  } else if (["trades", "automotive", "construction", "scaffold", "handyman"].some((k) => ind.includes(k))) {
    templateId = "tradie-bold";
  } else if (["beauty", "salon", "spa", "nails", "hair", "lash", "brow", "makeup", "aesthetics"].some((k) => ind.includes(k))) {
    templateId = "beauty-pro-booking";
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

// ── SEO helpers ───────────────────────────────────────────────────────────────

/**
 * Extract distinct service-area place names from About text.
 * Looks for "Covering X, Y, Z..." / "areas covered: X" / "based in X" patterns.
 */
function extractServiceAreas(about: string, city: string): string[] {
  const areas: string[] = []

  const coveringRe = /(?:covering|areas?\s+covered|service\s+areas?|we\s+cover|covering\s+the|based\s+in|serving(?:\s+the)?)\s*:?\s*([^.\n]{5,120})/gi
  let m: RegExpExecArray | null
  while ((m = coveringRe.exec(about)) !== null) {
    const chunk = m[1]
      .replace(/\s+and\s+surrounding\s+areas?(?:\s+of\s+[^,.]+)?/gi, '')
      .replace(/\s+and\s+beyond\.?/gi, '')
    const places = chunk
      .split(/[,\s]+(?:and\s+)?/)
      .map(s => s.replace(/[^A-Za-z\s-]/g, '').trim())
      .filter(s => s.length > 2 && /^[A-Z]/.test(s) && !/^(The|And|Of|In|Around|Surrounding|Including|Plus|Also)$/.test(s))
    areas.push(...places)
  }

  // Always include primary city first
  const unique = [...new Set([city, ...areas].filter(Boolean))].slice(0, 8)
  return unique
}

/**
 * Generate a per-page SEO object for each page slug.
 * Returns a map of slug → { title, description }.
 */
function generatePageSeo(
  pages: Array<{ slug: string; title: string }>,
  businessName: string,
  primaryService: string,
  city: string,
  siteDescription: string,
  serviceList: string[],
): Record<string, { title: string; description: string }> {
  const result: Record<string, { title: string; description: string }> = {}
  const loc = city || 'UK'
  const svc = primaryService || 'Professional Services'

  for (const page of pages) {
    switch (page.slug) {
      case '/':
        result['/'] = {
          title:       `${businessName} | ${svc} in ${loc}`,
          description: siteDescription,
        }
        break
      case '/services':
        result['/services'] = {
          title:       `${svc} Services | ${businessName} in ${loc}`,
          description: `Full range of ${svc.toLowerCase()} services from ${businessName}, serving ${loc}. ${serviceList.slice(0, 3).join(', ')} and more. Free quotes available.`,
        }
        break
      case '/about':
        result['/about'] = {
          title:       `About ${businessName} | ${svc} in ${loc}`,
          description: `Learn about ${businessName}, trusted ${svc.toLowerCase()} specialists based in ${loc}. Our experience, accreditations, and commitment to quality.`,
        }
        break
      case '/contact':
        result['/contact'] = {
          title:       `Contact ${businessName} | ${svc} in ${loc}`,
          description: `Get in touch with ${businessName} for ${svc.toLowerCase()} in ${loc} and surrounding areas. Call or email for a free, no-obligation quote.`,
        }
        break
      case '/our-work':
      case '/gallery':
        result[page.slug] = {
          title:       `Our Work | ${businessName} — ${svc} in ${loc}`,
          description: `Browse completed ${svc.toLowerCase()} projects by ${businessName} across ${loc}. Photo gallery of our recent work.`,
        }
        break
      case '/practice-areas':
        result['/practice-areas'] = {
          title:       `${svc} | ${businessName} in ${loc}`,
          description: `Specialist ${svc.toLowerCase()} from ${businessName} in ${loc}. Experienced professionals delivering trusted results.`,
        }
        break
      default:
        result[page.slug] = {
          title:       `${page.title} | ${businessName}`,
          description: `${page.title} — ${businessName}, professional ${svc.toLowerCase()} in ${loc}.`,
        }
    }
  }

  return result
}

/**
 * Auto-generate FAQ items relevant to the business industry and services.
 * These are used for the FAQ section and FAQ schema markup.
 */
function generateFaqItems(
  industry: string,
  services: string,
  city: string,
  businessName: string,
): Array<{ question: string; answer: string }> {
  const serviceList = services
    .split(/[\n,;•]+/)
    .map(s => s.replace(/^[-–—*·\s]+/, '').trim())
    .filter(Boolean)
  const topService = serviceList[0] || industry || 'our services'
  const ind = (industry ?? '').toLowerCase()
  const loc = city || 'the local area'

  const faqs: Array<{ question: string; answer: string }> = []

  // Cost FAQ (always first)
  faqs.push({
    question: `How much does ${topService.toLowerCase()} cost?`,
    answer: `Costs vary depending on the scope of work, materials, and access requirements. We always provide a free, detailed quote before any work begins so you know exactly what to expect with no hidden costs. Contact us for a no-obligation estimate.`,
  })

  // Industry-specific FAQs
  if (/carpent|joiner|joinery|woodwork|bespoke|furniture/i.test(ind)) {
    faqs.push(
      {
        question: `How long does a bespoke carpentry project take?`,
        answer: `Timescales depend on project complexity. Bespoke fitted wardrobes typically take 2–4 weeks, while custom staircases or full-room joinery may take 4–8 weeks. We confirm a clear timeline during your free quote.`,
      },
      {
        question: `Can you match existing woodwork in my home?`,
        answer: `Yes. We specialise in matching timber species, stains, and profiles to blend seamlessly with your existing woodwork. Bring photos or samples and we'll advise on the best approach.`,
      },
      {
        question: `Do you supply all materials?`,
        answer: `We can source and supply all materials, including specific timber species and bespoke hardware. We're also happy to work with client-supplied materials where appropriate.`,
      },
    )
  } else if (/plumb|heat|boiler|gas|central heating/i.test(ind)) {
    faqs.push(
      {
        question: `Do you offer emergency plumbing call-outs?`,
        answer: `Yes. We offer emergency call-outs and will aim to reach you as quickly as possible to resolve urgent plumbing issues, from burst pipes to boiler breakdowns.`,
      },
      {
        question: `Are your engineers Gas Safe registered?`,
        answer: `Yes, all our engineers are fully Gas Safe registered. We can provide our registration number before any gas work begins for your peace of mind.`,
      },
      {
        question: `How often should I service my boiler?`,
        answer: `We recommend an annual boiler service to maintain efficiency, safety, and any manufacturer warranty. Regular servicing also helps catch potential issues before they become costly repairs.`,
      },
    )
  } else if (/electr/i.test(ind)) {
    faqs.push(
      {
        question: `Are your electricians NICEIC or NAPIT registered?`,
        answer: `Yes, we are registered with the relevant electrical certification body. All work is tested and certified to current BS 7671 wiring regulations, and you receive a full certificate on completion.`,
      },
      {
        question: `Do you carry out electrical safety inspections (EICR)?`,
        answer: `Yes, we carry out Electrical Installation Condition Reports for residential and commercial properties, including landlord certificates. We provide a written report with any recommended remedial actions.`,
      },
      {
        question: `Can you install EV home charging points?`,
        answer: `Yes, we install electric vehicle home charging points and are qualified to carry out this work to the required standard. Ask us about any available government grants.`,
      },
    )
  } else if (/roof|tile|guttering|flat roof/i.test(ind)) {
    faqs.push(
      {
        question: `How do I know if my roof needs repairing or replacing?`,
        answer: `Common signs include missing or cracked tiles, leaks or damp patches, sagging sections, or a roof over 20 years old. We offer a free inspection to assess the condition and recommend the most cost-effective solution.`,
      },
      {
        question: `How long does a roof replacement take?`,
        answer: `A standard terraced or semi-detached roof replacement typically takes 3–5 days. Larger or more complex roofs may take longer. We provide a realistic schedule during your quote.`,
      },
      {
        question: `Do you clean and replace gutters?`,
        answer: `Yes, we offer gutter cleaning, repair, and full replacement alongside all roofing work, ensuring your drainage system is working correctly after any roof job.`,
      },
    )
  } else if (/build|construct|extension|renovation|loft/i.test(ind)) {
    faqs.push(
      {
        question: `Do you handle planning permission and building regulations?`,
        answer: `We advise on what permissions and building regulations approvals are required and can work alongside architects and local authority planners. All structural work complies with current regulations.`,
      },
      {
        question: `How long does a home extension take?`,
        answer: `A single-storey rear extension typically takes 8–12 weeks from start to completion, depending on size and specification. We provide a detailed programme before work begins.`,
      },
      {
        question: `Do you manage the full project?`,
        answer: `Yes, we manage all aspects of your project including subcontractors, materials procurement, and scheduling, giving you a single point of contact throughout from planning to handover.`,
      },
    )
  } else if (/landscap|garden|paving|driveway|patio/i.test(ind)) {
    faqs.push(
      {
        question: `What driveway materials do you install?`,
        answer: `We install block paving, resin-bound, Indian sandstone, porcelain, and concrete driveways and patios. We'll help you choose the best option for your property, aesthetic preference, and budget.`,
      },
      {
        question: `Can you design a garden from scratch?`,
        answer: `Yes, we offer a full design and build service. We work with you to create an outdoor space that suits your lifestyle, budget, and the character of your property.`,
      },
      {
        question: `Do you offer ongoing maintenance contracts?`,
        answer: `Yes, we offer flexible garden maintenance contracts to keep your outdoor space looking its best year-round, from seasonal planting to lawn care and tidying.`,
      },
    )
  } else {
    // Generic service business
    faqs.push(
      {
        question: `How quickly can you start?`,
        answer: `This depends on our current schedule and project scope. Contact us and we'll give you an honest start date. We always try to accommodate urgent requirements where possible.`,
      },
      {
        question: `Do you provide written quotes?`,
        answer: `Yes. All quotes are provided in writing and clearly itemised so there are no surprises. We confirm everything in writing before any work commences.`,
      },
      {
        question: `What payment methods do you accept?`,
        answer: `We accept bank transfer and card payments. We do not require large upfront deposits, and payment terms are agreed clearly before work begins.`,
      },
    )
  }

  // Universal FAQs
  faqs.push(
    {
      question: `Do you offer free quotes?`,
      answer: `Yes. We provide free, no-obligation quotes for all work. Contact us and we'll get back to you promptly to discuss your requirements and provide a competitive estimate.`,
    },
    {
      question: `What areas do you cover?`,
      answer: `We are based in ${loc} and cover the surrounding areas. Get in touch to confirm we serve your location.`,
    },
    {
      question: `Are you fully insured?`,
      answer: `Yes. We hold full public liability insurance for all work carried out. Certificates are available on request before any work begins.`,
    },
  )

  return faqs.slice(0, 7)
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
  const hasPhotos = (body.photos ?? []).length > 0 || (body.projectAlbums ?? []).some(a => a.enabled && a.photos.length > 0);
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
            sectionJsons.push(`{ "type": "hero", "content": { "tagline": "<specific tagline using About facts — NOT generic filler>", "subHeadline": "<specific sub-headline with real services or trust signals>", "cta": "Get a Free Quote", "ctaHref": "tel:${phone}", "badge": "<top accreditation or trust badge, e.g. 'Gas Safe Registered' or 'NICEIC Approved' — from Accreditations; leave empty string if none>", "stats": [ <3 punchy stats — pick from: jobs completed, years in business, rating, response time, service area — e.g. {"value":"500+","label":"Jobs Done"}, {"value":"4.8★","label":"Google Rating"}, {"value":"24/7","label":"Emergency Line"}> ] } }`);
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

        case "gallery": {
          const activeAlbums = (body.projectAlbums ?? []).filter(a => a.enabled);
          if (activeAlbums.length > 0) {
            // Photo URLs are injected by post-processing — only pass album metadata to Claude
            // so the prompt stays small regardless of photo count.
            const albumMeta = activeAlbums.map(a => ({ id: a.id, title: a.title, description: a.description ?? "", category: a.category ?? "", photoCount: a.photos.length }));
            sectionJsons.push(`{ "type": "gallery", "content": { "headline": "Our Work", "subHeadline": "<one-line description of the portfolio>", "albums": ${JSON.stringify(albumMeta)}, "items": [] } }`);
          } else if (hasPhotos) {
            sectionJsons.push(`{ "type": "gallery", "content": { "headline": "Our Work", "subHeadline": "A selection of recent projects", "items": [] } }`);
          }
          // items: [] is a placeholder — post-processing injects real photo URLs
          break;
        }

        case "cta":
          sectionJsons.push(`{ "type": "cta", "content": { "headline": "<specific CTA for ${body.industry} in ${city}>", "subHeadline": "<specific sub-headline using services from About>", "cta": "Call Now", "ctaHref": "tel:${phone}" } }`);
          break;

        case "contact":
          sectionJsons.push(`{ "type": "contact", "content": { "headline": "Get In Touch", "subHeadline": "<friendly invite to get in touch>", "phone": "${phone}", "email": "${body.email}", "address": "${city}"${body.notes ? `, "openingHours": "${body.notes}"` : ""} } }`);
          break;

        case "process":
          sectionJsons.push(`{ "type": "process", "content": { "headline": "How We Work", "subHeadline": "<1-line description of the simple, clear process>", "steps": [ <4 steps specific to ${body.industry} work: each has "title" (2-4 words), "description" (max 12 words, one short sentence, no filler), "icon" (pick from: clipboard|calendar|zap|check|wrench|phone|truck|home)> ] } }`);
          break;

        case "stats":
          sectionJsons.push(`{ "type": "stats", "content": { "items": [ <4 trust stats drawn from About/accreditations — e.g. jobs completed, years in business, rating, service availability — each: "value" (bold text like "500+", "4.9★", "15yr", "24/7"), "label" (2-4 words), "sub" (8-12 word supporting detail)> ] } }`);
          break;

        case "faq":
          sectionJsons.push(`{ "type": "faq", "content": { "headline": "Common Questions", "subHeadline": "Still unsure? Give us a call.", "items": [ <5-6 FAQ items specific to ${body.industry} in ${city} — cover qualifications, response times, service areas, pricing, guarantees — each: "question" (natural phrasing a customer would use), "answer" (2-3 sentences, factual, grounded in About/accreditations data, no filler)> ] } }`);
          break;

        case "before-after": {
          // Only included when the brief has enabled before/after pairs.
          // Pair image URLs are injected post-generation — Claude writes copy only.
          const activePairs = (body.beforeAfterPairs ?? []).filter((p) => p.enabled && p.beforeUrl && p.afterUrl);
          if (activePairs.length === 0) break;
          sectionJsons.push(`{ "type": "before-after", "content": { "headline": "<transformation-led headline for ${body.industry} work, e.g. 'See the Transformation' — specific, not generic>", "subHeadline": "<one line inviting the visitor to drag the slider and compare real ${body.industry} results in ${city}>", "pairs": [] } }`);
          break;
        }

        case "service-areas":
          // Area names are injected post-generation from the brief/About data.
          sectionJsons.push(`{ "type": "service-areas", "content": { "headline": "Areas We Cover", "subHeadline": "<one line about fast local coverage around ${city}>", "responsePromise": "<specific response promise ONLY if stated in About, e.g. 'On site within 60 minutes' — empty string if not stated>", "available247": <true ONLY if About/opening hours state 24/7 or emergency availability, else false>, "areas": [] } }`);
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
Services: ${(body.services ?? "").split(/[\n,]/).map(s => s.trim()).filter(Boolean).slice(0, 25).join("\n")}${body.accreditations ? `\nAccreditations: ${body.accreditations}` : ""}${body.rating ? `\nCheckatrade Rating: ${body.rating}/10 from ${body.reviewCount ?? 0} verified reviews` : ""}${body.notes ? `\nOpening Hours: ${body.notes}` : ""}${body.socialFacebook ? `\nFacebook: ${body.socialFacebook}` : ""}${body.socialInstagram ? `\nInstagram: ${body.socialInstagram}` : ""}
${reviewsBlock}

MANDATORY CONTENT RULES:
1. Hero (home page) — specific tagline using REAL facts from About. FORBIDDEN: "passionate professionals", "years of experience" without a number, "trusted local experts".
2. Hero (sub-pages) — brief page-specific headline, not the business tagline.
3. Services — use ONLY the items in the Services list. Do NOT pull extra services from the About text. Home page: 3–6 highlights from the list. Dedicated services page: one card per item in the list, no additions. Every description: 1 sentence, 18–32 words MAX. No business name. No filler.
4. About — professionally rewrite About text. Preserve ALL facts (dates, years, locations, capabilities).
5. Testimonials — CRITICAL: testimonials.content.items are pre-populated. Copy them exactly as given. If items is [], keep it as [] — NEVER invent testimonials.
6. Trust signals — ONLY from About/Accreditations. No invented certifications.
   REVIEW COUNTS/RATINGS — NEVER write specific review counts or ratings (e.g. "10+ reviews", "170+ verified reviews", "9.69/10") anywhere in generated copy — not in hero, not in trust bars, not in about, not in CTAs. Review stats are injected post-generation from verified data. If you need to reference reviews, use generic phrases like "Verified Reviews" or "Customer Rating" without numbers.
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
    "title": "<SEO title — Business Name | Primary Service in City, e.g. BEGU Carpentry Ltd | Bespoke Carpentry in London>",
    "description": "<160-char meta description — primary service + city + key differentiator. No generic filler. Real facts from About.>",
    "keywords": [ <8-12 keywords: company name, primary service, service+city combos, near-me variants, specific service types from the list> ],
    "ogTitle": "<og:title — same as title or slightly more natural phrasing>",
    "ogDescription": "<og:description — conversational 1-sentence summary. Services + location.>",
    "serviceName": "<primary service category, e.g. 'Bespoke Carpentry', 'Emergency Plumber', 'Electrical Services'>",
    "primaryLocation": "${body.city}",
    "serviceAreas": [ <up to 8 location names extracted from About — towns, cities, counties the business covers — use ONLY names from the About text or business details> ]
  }
}

Return ONLY the JSON object.`;

  console.log(
    `[generate-website] prompt.length=${userPrompt.length}`,
    `pages=${pageCount}`,
    `about.included=${userPrompt.includes(aboutBlock.slice(0, 20))}`,
  );

  // Cloudflare Workers has a 30-second hard limit on outbound subrequests.
  // Long service lists (e.g. scraped from Checkatrade) can push output above the
  // old caps, causing mid-generation truncation. Raised to give enough headroom.
  const maxTokens = templateDef.siteType === "multi-page" ? 10000 : 7000;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
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
// Returns a text/event-stream (SSE) response so Cloudflare Workers don't 524-timeout
// while waiting for Claude. The browser reads events until it gets "done" or "error".

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

  const crmOrigin = new URL(req.url).origin;

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

    // ── Build reviewStats (source of truth for all review display) ────────────
    // Priority: manual reviewSettings > scraped (rating/reviewCount) > About text > none
    const aboutStats = parseReviewStatsFromAbout(body.about ?? "");
    const rs = body.reviewSettings;
    const effectiveCount = rs?.reviewCount ?? body.reviewCount ?? aboutStats.reviewCount;
    const effectiveRating = (() => {
      if (rs?.averageRating) return rs.averageRating.includes("/") ? rs.averageRating : `${rs.averageRating}/10`;
      if (body.rating)       return body.rating.includes("/")      ? body.rating      : `${body.rating}/10`;
      return aboutStats.rating;
    })();
    const effectivePlatform    = rs?.platform    ?? body.platform    ?? "Checkatrade";
    const effectivePlatformUrl = rs?.platformUrl ?? body.platformUrl;
    const showReviewBadge      = rs?.showReviewBadge ?? true;
    const showRatingBadge      = rs?.showRatingBadge ?? true;
    const reviewSource: "manual" | "scraped" | "none" = rs?.reviewCount || rs?.averageRating
      ? "manual"
      : body.reviewCount || body.rating ? "scraped"
      : "none";

    if (reviewSource !== "none") {
      (spec as Record<string, unknown>).reviewStats = {
        platform:           effectivePlatform,
        reviewCount:        effectiveCount ?? 0,
        displayReviewCount: effectiveCount ? formatReviewCount(effectiveCount) : "0",
        averageRating:      effectiveRating ?? "",
        platformUrl:        effectivePlatformUrl,
        source:             reviewSource,
        showReviewBadge,
        showRatingBadge,
      };
    }

    if (Array.isArray(pages)) {
      for (const page of pages) {
        let sections = Array.isArray(page.sections) ? page.sections as Record<string, unknown>[] : null;
        if (!sections) continue;

        // ── Testimonials post-processing ──────────────────────────────────────
        // 1. Overwrite items with canonical reviews (or keep empty if none)
        // 2. Always inject platform metadata — never gated on platformUrl
        // 3. Remove testimonials sections with 0 items AND no rating metadata

        for (const section of sections) {
          if ((section.type as string) !== "testimonials") continue;
          const sc = section.content as Record<string, unknown>;

          sc.items    = canonicalReviews.length > 0 ? canonicalReviews : [];
          sc.platform = effectivePlatform;

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

          if (effectivePlatformUrl) {
            sc.platformUrl = effectivePlatformUrl;
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

        // ── Contact services injection ────────────────────────────────────────
        // Parse body.services into an array and inject into every contact section.
        // Services can be separated by newlines, commas, semicolons, or bullet points.
        if (body.services) {
          const serviceList = [...new Set(
            body.services
              .split(/[\n\r,;•]+/)
              .map((s) => s.replace(/^[-–—*·\s]+/, "").trim())
              .filter(Boolean)
          )];
          if (serviceList.length > 0) {
            for (const section of sections) {
              if ((section.type as string) !== "contact") continue;
              (section.content as Record<string, unknown>).services = serviceList;
            }
          }
        }

        const isHome = (page.slug as string) === "/";

        const toGeneratedImageUrl = (url: string) => normalizeGeneratedSiteImageUrl(url, crmOrigin);

        // Inject hero image(s) into home page hero section only.
        // heroImages[] takes priority over legacy heroImage string.
        const rawHeroImages: string[] = body.heroImages?.length
          ? body.heroImages
          : body.heroImage ? [body.heroImage] : [];

        if (isHome && rawHeroImages.length > 0) {
          const heroSection = sections.find((s) => s.type === "hero") as Record<string, unknown> | undefined;
          if (heroSection) {
            const heroContent = heroSection.content as Record<string, unknown>;
            const absImages   = rawHeroImages.map(toGeneratedImageUrl);

            heroContent.backgroundImage = absImages[0];

            if (absImages.length > 1) {
              heroContent.heroImages = absImages;
            }

            // For .webp artwork heroes, inject hotspot click zones.
            // Admin-supplied hotspots take priority; otherwise derive sensible
            // defaults from the CTA labels Claude generated.
            const isWebpHero = absImages[0].split("?")[0].toLowerCase().endsWith(".webp");
            if (isWebpHero && body.heroMobileImage) {
              heroContent.mobileBackgroundImage = toGeneratedImageUrl(body.heroMobileImage);
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

        // Inject real photos into every gallery section for every template.
        // All templates need flat items; album-aware templates also receive projectAlbums.
        const activeAlbums = (body.projectAlbums ?? []).filter(a => a.enabled && a.photos.length > 0);
        const galleryItems = buildGalleryItemsFromAlbums({
          albums: activeAlbums,
          fallbackPhotos: body.photos ?? [],
          businessName: body.businessName,
          origin: crmOrigin,
        });
        const normalizedAlbums = normalizeProjectAlbumsForGeneratedSite({
          albums: activeAlbums,
          businessName: body.businessName,
          origin: crmOrigin,
        });

        if (galleryItems.length > 0 || normalizedAlbums.length > 0) {
          const galleryPageSlug = templateDef.pages.find((p) => p.sections.includes("gallery"))?.slug;
          const isDesignatedGalleryPage = (page.slug as string) === galleryPageSlug;
          const isHomePage = (page.slug as string) === "/";
          const gallerySection = sections.find((s) => s.type === "gallery") as Record<string, unknown> | undefined;

          if (gallerySection) {
            const gContent = gallerySection.content as Record<string, unknown>;
            // Home page: flat items grid (template caps display count itself).
            // Other pages (e.g. /transformations, /projects): album cards only — no flat items.
            if (isHomePage && galleryItems.length > 0) {
              gContent.items = galleryItems;
            } else {
              gContent.items = [];
            }
            if (normalizedAlbums.length > 0) {
              gContent.projectAlbums = normalizedAlbums;
            }
          } else if (isDesignatedGalleryPage && galleryItems.length > 0) {
            // Inject gallery section if Claude omitted it on the designated gallery page
            const insertBefore = sections.findIndex((s) => s.type === "cta" || s.type === "footer");
            const idx = insertBefore >= 0 ? insertBefore : sections.length - 1;
            const injectedContent: Record<string, unknown> = {
              headline: "Our Work",
              subHeadline: "A selection of recent projects",
              items: isHomePage ? galleryItems : [],
            };
            if (normalizedAlbums.length > 0) {
              injectedContent.projectAlbums = normalizedAlbums;
            }
            sections.splice(idx, 0, { type: "gallery", content: injectedContent });
          }
        }

        // ── Before/After injection ────────────────────────────────────────────
        // Inject the brief's enabled pairs (absolute/proxied URLs, ordered) into every
        // before-after section; drop the section entirely if no pairs remain.
        const activePairs = (body.beforeAfterPairs ?? [])
          .filter((p) => p.enabled && p.beforeUrl && p.afterUrl)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        for (const section of sections) {
          if ((section.type as string) !== "before-after") continue;
          (section.content as Record<string, unknown>).pairs = activePairs.map((p) => ({
            id:        p.id,
            beforeUrl: toGeneratedImageUrl(p.beforeUrl),
            afterUrl:  toGeneratedImageUrl(p.afterUrl),
            title:     p.title || "",
            caption:   p.caption || "",
            category:  p.category || "",
          }));
        }
        sections = sections.filter((s) => {
          if ((s.type as string) !== "before-after") return true;
          return activePairs.length > 0;
        });
        page.sections = sections;

        // ── About image injection ─────────────────────────────────────────────
        // If the brief has an aboutImage, inject it into every about section.
        if (body.aboutImage) {
          for (const section of sections) {
            if ((section.type as string) === "about") {
              (section.content as Record<string, unknown>).image = body.aboutImage;
            }
          }
        }

        // Strip CTA sections from gallery pages — MMGallery renders its own
        // CTA at the bottom, so a page-level CTA creates a duplicate.
        // The sector templates render plain galleries without a built-in CTA,
        // so their page-level CTAs must be kept.
        const galleryRendersOwnCta = !["outdoor-transform", "emergency-trade", "reno-showcase", "finish-decor"].includes(resolvedTemplateId);
        if (galleryRendersOwnCta && sections.some((s) => s.type === "gallery")) {
          (page as Record<string, unknown>).sections = sections.filter((s) => s.type !== "cta");
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

    // ── SEO post-processing ────────────────────────────────────────────────────

    const seo = spec.seo as Record<string, unknown>

    // Service name: use Claude's output or derive from services
    const serviceList = (body.services ?? '')
      .split(/[\n,;•]+/)
      .map((s: string) => s.replace(/^[-–—*·\s]+/, '').trim())
      .filter(Boolean)
    const primaryService = (seo.serviceName as string) || serviceList[0] || body.industry || ''

    // Service areas: prefer Claude's extracted list, fallback to About text, then body.serviceAreas
    let effectiveServiceAreas: string[] = []
    if (Array.isArray(seo.serviceAreas) && (seo.serviceAreas as string[]).length > 0) {
      effectiveServiceAreas = (seo.serviceAreas as string[]).filter(Boolean).slice(0, 8)
    } else if (body.serviceAreas && body.serviceAreas.length > 0) {
      effectiveServiceAreas = body.serviceAreas.slice(0, 8)
    } else {
      effectiveServiceAreas = extractServiceAreas(body.about ?? '', body.city)
    }
    if (effectiveServiceAreas.length > 0) seo.serviceAreas = effectiveServiceAreas

    // ── Service-areas section injection (emergency-trade template) ────────────
    // Fill every service-areas section with the verified area list and phone;
    // Claude only wrote the copy around them.
    if (Array.isArray(pages)) {
      const areaNames = effectiveServiceAreas.length > 0 ? effectiveServiceAreas : [body.city]
      for (const page of pages) {
        if (!Array.isArray(page.sections)) continue
        for (const section of page.sections as Record<string, unknown>[]) {
          if ((section.type as string) !== 'service-areas') continue
          const sa = section.content as Record<string, unknown>
          sa.areas = areaNames
          sa.phone = body.phone
        }
      }
    }

    // Primary location always set
    if (!seo.primaryLocation) seo.primaryLocation = body.city

    // sameAs: add Checkatrade profile URL + social links
    const sameAsLinks: string[] = []
    if (body.checkatradeProfileUrl) sameAsLinks.push(body.checkatradeProfileUrl)
    else if (body.reviewSettings?.platformUrl && body.reviewSettings.platformUrl.includes('checkatrade')) {
      sameAsLinks.push(body.reviewSettings.platformUrl)
    }
    if (body.googleBusinessUrl) sameAsLinks.push(body.googleBusinessUrl)
    if (body.socialFacebook)    sameAsLinks.push(body.socialFacebook)
    if (body.socialInstagram)   sameAsLinks.push(body.socialInstagram)
    if (sameAsLinks.length > 0) seo.sameAs = sameAsLinks

    // Generate FAQ items (post-generation, no Claude tokens used)
    const faqItems = generateFaqItems(body.industry, body.services ?? '', body.city, body.businessName)
    seo.faqItems = faqItems

    // Inject FAQ section into home page (before CTA/footer)
    if (Array.isArray(pages)) {
      const homePage = pages.find(p => (p.slug as string) === '/')
      if (homePage && Array.isArray(homePage.sections)) {
        const homesSections = homePage.sections as Record<string, unknown>[]
        const alreadyHasFaq = homesSections.some(s => (s.type as string) === 'faq')
        if (!alreadyHasFaq) {
          const faqSection = {
            type: 'faq',
            content: {
              headline:    'Frequently Asked Questions',
              subHeadline: `Common questions about our ${primaryService.toLowerCase()} services`,
              items: faqItems,
            },
          }
          // Insert before CTA (or before footer, or at end-1)
          const insertBefore = homesSections.findIndex(
            s => (s.type as string) === 'cta' || (s.type as string) === 'footer',
          )
          if (insertBefore >= 0) {
            homesSections.splice(insertBefore, 0, faqSection)
          } else {
            homesSections.splice(Math.max(0, homesSections.length - 1), 0, faqSection)
          }
          homePage.sections = homesSections
        }
      }
    }

    // Generate per-page SEO metadata
    if (Array.isArray(pages)) {
      const pageList = pages.map(p => ({ slug: p.slug as string, title: p.title as string }))
      const pageSeoMap = generatePageSeo(
        pageList,
        body.businessName,
        primaryService,
        body.city,
        (seo.description as string) || '',
        serviceList,
      )
      for (const page of pages) {
        const pSeo = pageSeoMap[page.slug as string]
        if (pSeo) page.seo = pSeo
      }
    }

    // Improved image alt text for gallery items — include business name + location
    if (Array.isArray(pages)) {
      for (const page of pages) {
        if (!Array.isArray(page.sections)) continue
        for (const section of page.sections as Record<string, unknown>[]) {
          if ((section.type as string) !== 'gallery') continue
          const gc = section.content as Record<string, unknown>
          if (Array.isArray(gc.items)) {
            gc.items = (gc.items as Record<string, unknown>[]).map((item, i) => ({
              ...item,
              alt: item.alt && !(item.alt as string).includes('photo')
                ? item.alt
                : `${primaryService} by ${body.businessName} in ${body.city}${i > 0 ? ` — project ${i + 1}` : ''}`,
            }))
          }
          // Album photos
          if (Array.isArray(gc.projectAlbums)) {
            gc.projectAlbums = (gc.projectAlbums as Record<string, unknown>[]).map(album => ({
              ...album,
              photos: Array.isArray(album.photos)
                ? (album.photos as Record<string, unknown>[]).map((photo, i) => ({
                    ...photo,
                    alt: photo.alt && !(photo.alt as string).includes(body.businessName)
                      ? photo.alt
                      : `${album.title as string} by ${body.businessName} in ${body.city}${i > 0 ? ` — photo ${i + 1}` : ''}`,
                  }))
                : album.photos,
            }))
          }
        }
      }
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
  try {
    const sql = getDb();

    // If this project already has a GeneratedSite, update it in place
    if (body.projectId) {
      const existing = await sql`
        SELECT id, "deploymentStatus", "previewUrl" FROM "GeneratedSite"
        WHERE "projectId" = ${body.projectId}
        ORDER BY
          CASE "deploymentStatus"
            WHEN 'live'             THEN 0
            WHEN 'update_available' THEN 1
            ELSE 2
          END,
          "createdAt" DESC
        LIMIT 1
      `;
      if (existing.length > 0) {
        const site = existing[0];
        const wasLive = site.deploymentStatus === 'live';
        await sql`
          UPDATE "GeneratedSite" SET
            "specJson"          = ${specJson},
            "businessName"      = ${body.businessName},
            "clientName"        = ${body.clientName},
            industry            = ${body.industry ?? "professional"},
            tier                = ${body.tier ?? "pro_plus"},
            "deploymentStatus"  = ${wasLive ? 'update_available' : 'draft'},
            "updatedAt"         = NOW()
          WHERE id = ${site.id as string}
        `;
        return NextResponse.json({ ok: true, siteId: site.id, previewUrl: site.previewUrl });
      }
    }

    // No existing site — create a new one
    const id = crypto.randomUUID();
    const previewUrl = `https://sites.ridentechnologies.com/preview/${id}`;
    await sql`
      INSERT INTO "GeneratedSite"
        (id, "projectId", "clientName", "businessName", industry, tier, "specJson", username, password, "previewUrl", status, "outreachEmail", "outreachStatus", "createdAt", "updatedAt")
      VALUES
        (${id}, ${body.projectId ?? null}, ${body.clientName}, ${body.businessName},
         ${body.industry ?? "professional"}, ${body.tier ?? "pro_plus"}, ${specJson},
         ${body.username}, ${body.password}, ${previewUrl}, 'ready',
         ${body.email ?? null}, 'not_contacted', NOW(), NOW())
    `;
    return NextResponse.json({ ok: true, siteId: id, previewUrl });
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to save generated site: ${String(e)}` },
      { status: 500 },
    );
  }
}
