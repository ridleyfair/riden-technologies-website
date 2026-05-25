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

interface GenerateBody {
  projectId?: string;
  businessName: string;
  clientName: string;
  industry: string;
  city: string;
  phone: string;
  email: string;
  services: string;
  tier: string;
  username: string;
  password: string;
  notes?: string;
}

// ── Claude API call ───────────────────────────────────────────────────────────

async function generateSiteSpec(body: GenerateBody, apiKey: string): Promise<string> {
  const systemPrompt =
    "You are a professional website copywriter for Riden Technologies. " +
    "Generate a complete SiteSpec JSON for a client website based on the business data provided. " +
    "Return ONLY valid JSON, no markdown, no explanation.";

  const userPrompt = `Generate a complete SiteSpec JSON for the following business:

Business Name: ${body.businessName}
Industry: ${body.industry}
City/Location: ${body.city}
Phone: ${body.phone}
Email: ${body.email}
Services: ${body.services}
Tier: ${body.tier}
${body.notes ? `Notes/Brief: ${body.notes}` : ""}

The JSON must exactly match this structure:
{
  "version": 1,
  "businessId": "<uuid>",
  "businessName": "${body.businessName}",
  "tier": "${body.tier}",
  "themeId": "minimal",
  "templateId": "modern-minimal",
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
        { "type": "hero", "content": { "tagline": "<compelling tagline>", "subHeadline": "<sub headline>", "cta": "Get a Free Quote", "ctaHref": "tel:${body.phone}" } },
        { "type": "services", "content": { "headline": "Our Services", "items": [ <3-5 service items based on: ${body.services}> ] } },
        { "type": "about", "content": { "headline": "About Us", "body": "<about paragraph tailored to the business>" } },
        { "type": "testimonials", "content": { "headline": "What Our Customers Say", "items": [ <2-3 plausible testimonials> ] } },
        { "type": "cta", "content": { "headline": "Ready to Get Started?", "subHeadline": "Contact us today for a free consultation.", "cta": "Call Now", "ctaHref": "tel:${body.phone}" } },
        { "type": "footer", "content": { "tagline": "<short tagline>", "columns": [], "phone": "${body.phone}", "email": "${body.email}", "address": "${body.city}", "copyright": "© ${new Date().getFullYear()} ${body.businessName}. All rights reserved." } }
      ]
    }
  ],
  "seo": {
    "title": "<SEO title>",
    "description": "<meta description>",
    "keywords": [ <5-8 relevant keywords> ],
    "ogTitle": "<og title>",
    "ogDescription": "<og description>"
  }
}

Choose a colour palette that fits the ${body.industry} industry in ${body.city}.
Each service item must have: name, description, icon (emoji or simple word), highlight (boolean).
Each testimonial must have: author, location, body, rating (4 or 5).
Return ONLY the JSON object.`;

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

  // Generate spec via Claude
  let specJson: string;
  try {
    specJson = await generateSiteSpec(body, apiKey);
    // Validate it parses as JSON
    JSON.parse(specJson);
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
