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

// ── Template / theme picker ───────────────────────────────────────────────────

const TEMPLATE_THEMES: Record<string, string> = {
  "starter-simple":          "minimal",
  "starter-landing":         "modern",
  "modern-minimal":          "minimal",
  "tradie-bold":             "bold",
  "healthcare-clean":        "minimal",
  "beauty-elegant":          "elegant",
  "luxury-premium":          "elegant",
  "corporate-professional":  "modern",
  "legal-authority":         "classic",
};

function pickTemplate(industry: string): { templateId: string; themeId: string } {
  const ind = (industry ?? "").toLowerCase();
  if (["trades", "automotive", "construction", "plumbing", "electrical", "roofing"].some((k) => ind.includes(k))) {
    return { templateId: "tradie-bold", themeId: "bold" };
  }
  if (["beauty", "salon", "spa", "nails", "hair"].some((k) => ind.includes(k))) {
    return { templateId: "beauty-elegant", themeId: "elegant" };
  }
  if (["health", "medical", "dental", "therapy", "care"].some((k) => ind.includes(k))) {
    return { templateId: "healthcare-clean", themeId: "minimal" };
  }
  if (["legal", "law", "solicitor"].some((k) => ind.includes(k))) {
    return { templateId: "luxury-premium", themeId: "elegant" };
  }
  return { templateId: "modern-minimal", themeId: "minimal" };
}

// ── About field parser — cleans scraped Checkatrade / web text ────────────────
// Strips navigation noise while preserving trust signals and location data.

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

  // Remove consecutive duplicate lines (Checkatrade sometimes repeats headings)
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

// ── Claude API call ───────────────────────────────────────────────────────────

async function generateSiteSpec(body: GenerateBody, apiKey: string): Promise<string> {
  // ── Debug logging (no secrets logged) ─────────────────────────────────────
  const aboutLength = body.about?.length ?? 0;
  console.log(`[generate-website] businessName="${body.businessName}" about.length=${aboutLength}`);
  if (aboutLength === 0) {
    console.warn("[generate-website] WARNING: about field is empty — website copy will use generic fallback");
  } else {
    console.log(`[generate-website] about preview (first 300 chars): ${body.about!.slice(0, 300)}`);
  }

  // ── Clean the About field ──────────────────────────────────────────────────
  const parsedAbout = parseAbout(body.about ?? "");
  console.log(
    `[generate-website] parsedAbout cleaned.length=${parsedAbout.cleaned.length}`,
    `trustSignals=${JSON.stringify(parsedAbout.trustSignals)}`,
    `locations=${JSON.stringify(parsedAbout.locations)}`,
  );

  // ── Select top real reviews to pass verbatim to Claude ────────────────────
  const realReviews = Array.isArray(body.reviews) ? body.reviews : [];
  const topReviews = realReviews
    .filter((r) => r.body && r.body.trim().length > 15)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const { templateId, themeId } = pickTemplate(body.industry);
  const locationSuffix = body.postcode ? ` (${body.postcode})` : "";

  const aboutBlock = parsedAbout.cleaned.length > 0
    ? parsedAbout.cleaned
    : "(No About information provided — use industry and city as fallback only.)";

  const trustLine = parsedAbout.trustSignals.length > 0
    ? `\nTrust signals found in About: ${parsedAbout.trustSignals.join("; ")}`
    : "";

  const locationLine = parsedAbout.locations.length > 0
    ? `\nService area mentions in About: ${parsedAbout.locations.join("; ")}`
    : "";

  const reviewsBlock =
    topReviews.length > 0
      ? `\nREAL CUSTOMER REVIEWS — use these verbatim in testimonials; do NOT invent new ones:\n${topReviews.map((r) => `- "${r.body.trim()}" — ${r.author}${r.date ? ` (${r.date})` : ""}, rated ${r.rating}/5`).join("\n")}`
      : "\n(No real reviews provided — you may write 2-3 short plausible testimonials only.)";

  const systemPrompt =
    "You are a professional website copywriter for Riden Technologies. " +
    "Generate a complete SiteSpec JSON for a client website. " +
    "The ABOUT section is the PRIMARY source of truth — every section of the website must be grounded in it. " +
    "Return ONLY valid JSON, no markdown, no explanation.";

  const userPrompt = `Generate a complete SiteSpec JSON for this business.

══════════════════════════════════════════
PRIMARY SOURCE — ABOUT THIS BUSINESS
Read this carefully. Base ALL copy on it.
══════════════════════════════════════════
${aboutBlock}${trustLine}${locationLine}
══════════════════════════════════════════

BUSINESS DETAILS:
Business Name: ${body.businessName}
Industry: ${body.industry}
City/Location: ${body.city}${locationSuffix}
Phone: ${body.phone}
Email: ${body.email}
Services: ${body.services}${body.accreditations ? `\nAccreditations: ${body.accreditations}` : ""}${body.rating ? `\nCheckatrade Rating: ${body.rating}/10 from ${body.reviewCount ?? 0} verified reviews` : ""}${body.notes ? `\nOpening Hours: ${body.notes}` : ""}${body.socialFacebook ? `\nFacebook: ${body.socialFacebook}` : ""}${body.socialInstagram ? `\nInstagram: ${body.socialInstagram}` : ""}
${reviewsBlock}

MANDATORY CONTENT RULES:
1. Hero tagline — write a specific, compelling 1-line headline using REAL facts from the About section (e.g. specific trades, location, Checkatrade membership date, rating). FORBIDDEN: "We are passionate professionals", "With years of experience", "Your trusted local experts" or any other generic filler.
2. Hero sub-headline — use 1-2 specific services or trust signals from About.
3. Services — list ONLY services explicitly named in the About or Services fields. Do NOT invent services.
4. About section body — professionally rewrite the About text. Preserve ALL factual claims (membership dates, years trading, specific locations, named capabilities). Remove navigation noise and repetition. Keep it factually accurate.
5. Testimonials — if real reviews are provided above, use them verbatim. Do NOT invent fake reviews.
6. Trust signals — use ONLY facts from About/Accreditations (e.g. "Checkatrade member since February 2020", "Gas Safe Registered"). Do NOT add fake certifications, fake awards, or fake guarantees.
7. SEO title/description — include specific services and the ${body.city}${body.postcode ? `/${body.postcode}` : ""} location.
8. Local copy — if About mentions specific towns, postcodes, or service areas, include them in the copy.
9. CTA copy — make it specific to the industry and location, not generic.
10. Colour palette — choose colours that fit the ${body.industry} industry: professional and trustworthy.

ABSOLUTELY DO NOT:
- Write "We are passionate professionals" or similar filler
- Write "With years of experience" without a specific number from About
- Invent certifications, accreditations, or awards not in the source data
- Invent a team size
- Invent fake opening hours (use the provided ones or omit)
- Write fake reviews if real ones are provided above

The JSON must exactly match this structure:
{
  "version": 1,
  "businessId": "<uuid>",
  "businessName": "${body.businessName}",
  "tier": "${body.tier}",
  "themeId": "${themeId}",
  "templateId": "${templateId}",
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
  "nav": {
    "links": [
      { "label": "Home", "href": "/" },
      { "label": "Services", "href": "#services" },
      { "label": "About", "href": "#about" },
      { "label": "Contact", "href": "#contact" }
    ],
    "ctaLabel": "Get a Free Quote",
    "ctaHref": "tel:${body.phone}"
  },
  "pages": [
    {
      "slug": "/",
      "title": "Home",
      "sections": [
        { "type": "hero", "content": { "tagline": "<specific tagline from About facts — not generic>", "subHeadline": "<specific sub-headline using real services or trust signals from About>", "cta": "Get a Free Quote", "ctaHref": "tel:${body.phone}" } },
        { "type": "services", "content": { "headline": "Our Services", "items": [ <3-6 service items using ONLY services named in About/Services. Each: name, description (1-2 sentences), icon (emoji), highlight (boolean)> ] } },
        { "type": "about", "content": { "headline": "About Us", "body": "<professionally rewritten About text — preserve real facts, remove navigation noise, keep factual accuracy>" } },
        { "type": "testimonials", "content": { "headline": "What Our Customers Say", "items": [ <use real reviews verbatim if provided; each: author, location, body, rating (1-5)> ] } },
        ${body.photos && body.photos.length > 0 ? `{ "type": "gallery", "content": { "headline": "Our Work", "subHeadline": "A selection of our recent projects", "items": ${JSON.stringify(body.photos.map((src, i) => ({ src, alt: `Work photo ${i + 1}`, caption: "" })))} } },` : ""}
        { "type": "cta", "content": { "headline": "<specific CTA for ${body.industry} in ${body.city}>", "subHeadline": "<specific sub-headline using services from About>", "cta": "Call Now", "ctaHref": "tel:${body.phone}" } },
        { "type": "footer", "content": { "tagline": "<short tagline from About facts>", "columns": [], "phone": "${body.phone}", "email": "${body.email}", "address": "${body.city}${locationSuffix}", "copyright": "© ${new Date().getFullYear()} ${body.businessName}. All rights reserved." } }
      ]
    }
  ],
  "seo": {
    "title": "<SEO title — specific services + ${body.city} location>",
    "description": "<meta description using real services from About and ${body.city} location>",
    "keywords": [ <5-8 keywords using specific services from About and location> ],
    "ogTitle": "<og title>",
    "ogDescription": "<og description>"
  }
}

Return ONLY the JSON object.`;

  console.log(`[generate-website] prompt.length=${userPrompt.length} about.included=${userPrompt.includes(aboutBlock.slice(0, 30))}`);

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  let text = data.content.find((c) => c.type === "text")?.text ?? "";
  if (!text) throw new Error("Claude returned empty response");
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return text;
}

// ── POST /api/generate-website ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const apiKey = getAnthropicKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 }
    );
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
      { status: 400 }
    );
  }

  if (!body.about || body.about.trim().length === 0) {
    console.warn(`[generate-website] about is empty for "${body.businessName}" — proceeding but copy will be generic`);
  }

  // Generate spec via Claude — use manual template selection if provided
  const { templateId, themeId } = body.templateId && TEMPLATE_THEMES[body.templateId]
    ? { templateId: body.templateId, themeId: TEMPLATE_THEMES[body.templateId] }
    : pickTemplate(body.industry);
  let specJson: string;
  try {
    specJson = await generateSiteSpec(body, apiKey);
    const spec = JSON.parse(specJson) as Record<string, unknown>;
    // Always enforce the requested tier and template — Claude sometimes overrides these
    spec.tier = body.tier;
    spec.templateId = templateId;
    spec.themeId = themeId;
    const pages = spec.pages as Array<Record<string, unknown>> | undefined;
    const sections = Array.isArray(pages?.[0]?.sections) ? pages![0].sections as Record<string, unknown>[] : null;

    if (sections) {
      // Inject hero background image
      if (body.heroImage) {
        const heroSection = sections.find((s) => s.type === "hero") as Record<string, unknown> | undefined;
        if (heroSection) {
          const heroContent = heroSection.content as Record<string, unknown>;
          heroContent.backgroundImage = body.heroImage;
        }
      }

      // Ensure gallery section is present when work photos provided
      if (body.photos && body.photos.length > 0) {
        const hasGallery = sections.some((s) => s.type === "gallery");
        if (!hasGallery) {
          const gallerySection = {
            type: "gallery",
            content: {
              headline: "Our Work",
              subHeadline: "A selection of our recent projects",
              items: body.photos.map((src, i) => ({
                src,
                alt: `${body.businessName} work photo ${i + 1}`,
                caption: "",
              })),
            },
          };
          sections.splice(Math.max(0, sections.length - 2), 0, gallerySection);
        } else {
          const gallery = sections.find((s) => s.type === "gallery") as Record<string, unknown>;
          const content = gallery.content as Record<string, unknown>;
          content.items = body.photos.map((src, i) => ({
            src,
            alt: `${body.businessName} work photo ${i + 1}`,
            caption: "",
          }));
        }
      }

      // Debug: log generated section types and About body preview
      const sectionTypes = sections.map((s) => s.type as string);
      console.log(`[generate-website] generated sections: ${sectionTypes.join(", ")}`);
      const aboutSection = sections.find((s) => s.type === "about") as Record<string, unknown> | undefined;
      if (aboutSection) {
        const aboutContent = aboutSection.content as Record<string, unknown>;
        console.log(`[generate-website] about.body preview: ${String(aboutContent.body ?? "").slice(0, 200)}`);
      }
    }

    specJson = JSON.stringify(spec);
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to generate site spec: ${String(e)}` },
      { status: 500 }
    );
  }

  // Save to DB
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
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, siteId: id, previewUrl });
}
