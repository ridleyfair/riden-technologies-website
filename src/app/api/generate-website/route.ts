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
  author: string;
  rating: number;
  body: string;
  source: string;
  date?: string;
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
  heroImage?: string;
  notes?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  reviews?: Review[];
  photos?: string[];
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
      { slug: "/",         title: "Home",     sections: ["hero", "services", "testimonials", "cta", "footer"] },
      { slug: "/about",    title: "About",    sections: ["hero", "about", "cta", "footer"] },
      { slug: "/services", title: "Services", sections: ["hero", "services", "cta", "footer"] },
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
  const reviewsNote = topReviews.length > 0
    ? "use the provided real reviews verbatim"
    : "write 2-3 short plausible testimonials";

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
            sectionJsons.push(`{ "type": "services", "content": { "headline": "Our Services", "items": [ <3 top service highlights from About/Services — name, description (1 sentence), icon (emoji), highlight (bool)> ] } }`);
          } else {
            sectionJsons.push(`{ "type": "services", "content": { "headline": "Everything We Offer", "items": [ <ALL services from About/Services with full descriptions — name, description (2-3 sentences), icon (emoji), highlight (bool)> ] } }`);
          }
          break;

        case "about":
          sectionJsons.push(`{ "type": "about", "content": { "headline": "About Us", "body": "<professionally rewritten About text — preserve ALL real facts: membership dates, years trading, specific locations, named capabilities>" } }`);
          break;

        case "testimonials":
          sectionJsons.push(`{ "type": "testimonials", "content": { "headline": "What Our Customers Say", "items": [ <${reviewsNote}; each: author, location, body, rating (1-5)> ] } }`);
          break;

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
    .slice(0, 3);

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
      ? `\nREAL REVIEWS — use verbatim in testimonials:\n${topReviews.map((r) => `- "${r.body.trim()}" — ${r.author}${r.date ? ` (${r.date})` : ""}, ${r.rating}/5`).join("\n")}`
      : "\n(No real reviews — you may write 2-3 plausible short testimonials.)";

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
3. Services (home page) — 3 highlights only. Services (dedicated page) — ALL services with full descriptions.
4. About — professionally rewrite About text. Preserve ALL facts (dates, years, locations, capabilities).
5. Testimonials — ${topReviews.length > 0 ? "use the real reviews verbatim" : "write 2-3 short plausible ones"}.
6. Trust signals — ONLY from About/Accreditations. No invented certifications.
7. SEO — include specific services and ${city} location.
8. Contact section — include real phone, email, address, opening hours from the brief.

DO NOT:
- Generate different pages than the structure provided
- Write generic filler copy
- Invent services, certifications, or reviews not in the source data
- Add or remove sections from any page

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
      "primary": "<hex>",
      "secondary": "<hex>",
      "accent": "<hex>",
      "background": "<hex>",
      "surface": "<hex>",
      "text": "<hex>",
      "textMuted": "<hex>"
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

  // Multi-page sites need more output tokens
  const maxTokens = templateDef.siteType === "multi-page" ? 8192 : 4096;

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

  const data = (await resp.json()) as { content: Array<{ type: string; text: string }> };
  let text = data.content.find((c) => c.type === "text")?.text ?? "";
  if (!text) throw new Error("Claude returned empty response");
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

    const pages = spec.pages as Array<Record<string, unknown>> | undefined;

    if (Array.isArray(pages)) {
      for (const page of pages) {
        const sections = Array.isArray(page.sections) ? page.sections as Record<string, unknown>[] : null;
        if (!sections) continue;

        const isHome = (page.slug as string) === "/";

        // Inject hero background image into home page hero section only
        if (isHome && body.heroImage) {
          const heroSection = sections.find((s) => s.type === "hero") as Record<string, unknown> | undefined;
          if (heroSection) {
            (heroSection.content as Record<string, unknown>).backgroundImage = body.heroImage;
          }
        }

        // For gallery pages or home-page gallery sections, inject real photos
        if (body.photos && body.photos.length > 0) {
          const isGalleryPage = (page.slug as string) === "/gallery";
          const gallerySection = sections.find((s) => s.type === "gallery") as Record<string, unknown> | undefined;

          if (gallerySection) {
            // Override items with real photos
            (gallerySection.content as Record<string, unknown>).items = body.photos.map((src, i) => ({
              src,
              alt: `${body.businessName} work photo ${i + 1}`,
              caption: "",
            }));
          } else if (isHome || isGalleryPage) {
            // Inject gallery section if not already present on home or gallery page
            const insertBefore = sections.findIndex((s) => s.type === "cta" || s.type === "footer");
            const idx = insertBefore >= 0 ? insertBefore : sections.length - 1;
            sections.splice(idx, 0, {
              type: "gallery",
              content: {
                headline: "Our Work",
                subHeadline: "A selection of recent projects",
                items: body.photos.map((src, i) => ({
                  src,
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

    specJson = JSON.stringify(spec);
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
