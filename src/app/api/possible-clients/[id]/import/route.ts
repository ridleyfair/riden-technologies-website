import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

const SCRAPER_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";

type WebsiteData = {
  facebook:    string | null;
  instagram:   string | null;
  description: string | null;
  phone:       string | null;
};

async function scrapeWebsiteData(websiteUrl: string): Promise<WebsiteData> {
  const empty: WebsiteData = { facebook: null, instagram: null, description: null, phone: null };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(websiteUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RidenBot/1.0)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return empty;
    const html = await res.text();

    const cleanUrl = (u: string) => u.replace(/['">\s].*/g, "").split("?")[0].replace(/\/$/, "");

    // Social links
    const fbMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|dialog)[A-Za-z0-9_./-]+/i);
    const igMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.-]+/i);

    // Meta description
    const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,300})["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']{20,300})["'][^>]+name=["']description["']/i);
    const ogMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{20,300})["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']{20,300})["'][^>]+property=["']og:description["']/i);
    const rawDescription = metaMatch?.[1] ?? ogMatch?.[1] ?? null;
    const description = rawDescription
      ? rawDescription.replace(/&#\d+;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim()
      : null;

    // Phone number (UK format)
    const phoneMatch = html.match(/\b((?:0|\+44)[0-9()\s-]{9,14})\b/);
    const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, " ").trim() : null;

    return {
      facebook:    fbMatch  ? cleanUrl(fbMatch[0])  : null,
      instagram:   igMatch  ? cleanUrl(igMatch[0])  : null,
      description,
      phone,
    };
  } catch {
    return empty;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const scraperRes = await fetch(`${SCRAPER_URL}/api/v1/businesses/${id}`, { cache: "no-store" });
    if (!scraperRes.ok) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const b = await scraperRes.json();
    const sql = getDb();

    // Look up any existing Checkatrade enrichment
    let enrichment: Record<string, unknown> | null = null;
    try {
      const [row] = await sql`
        SELECT * FROM "CheckatradeEnrichment" WHERE business_id = ${id} LIMIT 1
      `;
      enrichment = row ?? null;
    } catch { /* table may not exist yet */ }

    // Parse photos from DB (stored as JSON string)
    let photos: string[] = [];
    if (b.photos_json) {
      try { photos = JSON.parse(b.photos_json); } catch { /* ignore */ }
    }

    // Parse opening hours from DB
    let openingHours: { day: string; hours: string }[] = [];
    if (b.opening_hours_json) {
      try { openingHours = JSON.parse(b.opening_hours_json); } catch { /* ignore */ }
    }

    // Enrich from business website — social links, description, phone
    let socialFacebook: string | null  = b.social_facebook ?? null;
    let socialInstagram: string | null = b.social_instagram ?? null;
    let websiteDescription: string | null = null;
    let websitePhone: string | null = null;

    if (b.website) {
      const site = await scrapeWebsiteData(b.website);
      if (!socialFacebook)  socialFacebook  = site.facebook;
      if (!socialInstagram) socialInstagram = site.instagram;
      websiteDescription = site.description;
      websitePhone       = site.phone;
    }

    // Description: prefer Google Maps, fall back to website meta
    const description: string | null = b.description ?? websiteDescription ?? null;
    // Phone: prefer Google Maps, fall back to website
    const phone: string | null = b.phone ?? websitePhone ?? null;

    const notes = [
      b.city ? `City: ${b.city}` : null,
      b.address ? `Address: ${b.address}` : null,
      b.rating != null ? `Google rating: ${b.rating} (${b.reviews_count ?? 0} reviews)` : null,
      b.website ? `Existing website: ${b.website}` : "No website",
      b.maps_url ? `Google Maps: ${b.maps_url}` : null,
      b.lead_score ? `Lead tier: ${b.lead_score.lead_tier?.toUpperCase()} (score: ${b.lead_score.total_score})` : null,
      enrichment?.has_checkatrade
        ? `Checkatrade: ${enrichment.checkatrade_url} (${enrichment.checkatrade_review_count} reviews, ${enrichment.checkatrade_rating}/10, confidence: ${enrichment.match_confidence})`
        : null,
      enrichment?.has_checkatrade && !b.website
        ? "⚡ Hot Lead: Has Checkatrade profile but no website"
        : null,
    ].filter(Boolean).join("\n");
    const leadId = crypto.randomUUID();
    const now = new Date();

    const scraperDataJson = JSON.stringify({
      name:             b.name,
      phone:            phone,
      category:         b.category         ?? null,
      city:             b.city             ?? null,
      address:          b.address          ?? null,
      rating:           b.rating           ?? null,
      reviews_count:    b.reviews_count    ?? null,
      website:          b.website          ?? null,
      maps_url:         b.maps_url         ?? null,
      lead_tier:        b.lead_score?.lead_tier   ?? null,
      lead_score:       b.lead_score?.total_score ?? null,
      description,
      photos,
      opening_hours:    openingHours,
      social_facebook:  socialFacebook,
      social_instagram: socialInstagram,
      checkatrade: enrichment?.has_checkatrade ? {
        url:           enrichment.checkatrade_url,
        review_count:  enrichment.checkatrade_review_count,
        rating:        enrichment.checkatrade_rating,
        confidence:    enrichment.match_confidence,
      } : null,
    });

    // Try inserting with scraperDataJson — fall back without it if column doesn't exist yet
    let lead;
    try {
      [lead] = await sql`
        INSERT INTO "Lead" (
          id, name, email, company, phone, service, message,
          status, source, score, value, notes, "scraperDataJson",
          "createdAt", "updatedAt"
        ) VALUES (
          ${leadId}, ${b.name}, ${""}, ${b.name},
          ${phone}, ${b.category ?? null},
          ${"Imported from Google Maps scraper"},
          ${"new"}, ${"scraper"},
          ${b.lead_score?.total_score ?? 0}, ${0}, ${notes}, ${scraperDataJson},
          ${now}, ${now}
        )
        RETURNING *
      `;
    } catch {
      // scraperDataJson column not yet migrated — insert without it
      [lead] = await sql`
        INSERT INTO "Lead" (
          id, name, email, company, phone, service, message,
          status, source, score, value, notes,
          "createdAt", "updatedAt"
        ) VALUES (
          ${leadId}, ${b.name}, ${""}, ${b.name},
          ${phone}, ${b.category ?? null},
          ${"Imported from Google Maps scraper"},
          ${"new"}, ${"scraper"},
          ${b.lead_score?.total_score ?? 0}, ${0}, ${notes},
          ${now}, ${now}
        )
        RETURNING *
      `;
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
