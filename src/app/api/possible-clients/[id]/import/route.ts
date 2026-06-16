import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { buildProjectBriefFromPossibleClient, mergeProjectBriefPreservingEdits } from "@/lib/lead-project-brief";
import { importGoogleBusinessIntoProject } from "@/lib/google-business-import";

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

type SqlClient = ReturnType<typeof getDb>;

async function ensureProjectImportColumns(sql: SqlClient) {
  try {
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS phone TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS email TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS city TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS postcode TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'trades'`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS services TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS about TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS accreditations TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "photosJson" TEXT DEFAULT '[]'`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "openingHours" TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "socialFacebook" TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "socialInstagram" TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "leadId" TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "possibleClientId" TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS source TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "recommendedTemplate" TEXT`;
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "websiteFactoryPlanJson" TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS "Project_possibleClientId_idx" ON "Project"("possibleClientId") WHERE "possibleClientId" IS NOT NULL`;
  } catch (err) {
    console.warn("Project import column migration skipped:", err);
  }
}

async function createProjectForImportedLead({
  sql,
  business,
  leadId,
  phone,
  description,
  photos,
  openingHours,
  socialFacebook,
  socialInstagram,
}: {
  sql: SqlClient;
  business: Record<string, unknown>;
  leadId: string;
  phone: string | null;
  description: string | null;
  photos: string[];
  openingHours: { day: string; hours: string }[];
  socialFacebook: string | null;
  socialInstagram: string | null;
}) {
  await ensureProjectImportColumns(sql);
  const brief = buildProjectBriefFromPossibleClient({
    possibleClient: business,
    leadId,
    phone,
    description,
    photos,
    openingHours,
    socialFacebook,
    socialInstagram,
  });
  const now = new Date();

  const [existing] = await sql`
    SELECT * FROM "Project"
    WHERE "possibleClientId" = ${brief.possibleClientId}
       OR (LOWER("clientName") = LOWER(${brief.clientName}) AND source = 'possible_client_import')
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;

  if (existing) {
    const merged = mergeProjectBriefPreservingEdits({ existing: existing as Record<string, unknown>, generated: brief });
    const [project] = await sql`
      UPDATE "Project" SET
        "leadId"                 = ${String(existing.leadId ?? brief.leadId)},
        "possibleClientId"       = ${String(existing.possibleClientId ?? brief.possibleClientId ?? "") || null},
        source                   = ${String(existing.source ?? brief.source)},
        phone                    = ${merged.phone as string | null},
        email                    = ${merged.email as string | null},
        city                     = ${merged.city as string | null},
        postcode                 = ${merged.postcode as string | null},
        industry                 = ${merged.industry as string | null},
        services                 = ${merged.services as string | null},
        about                    = ${merged.about as string | null},
        accreditations           = ${merged.accreditations as string | null},
        "photosJson"            = ${merged.photosJson as string | null},
        "openingHours"          = ${merged.openingHours as string | null},
        "socialFacebook"        = ${merged.socialFacebook as string | null},
        "socialInstagram"       = ${merged.socialInstagram as string | null},
        "recommendedTemplate"   = ${merged.recommendedTemplate as string | null},
        "websiteFactoryPlanJson" = ${merged.websiteFactoryPlanJson as string | null},
        "updatedAt"             = ${now}
      WHERE id = ${existing.id as string}
      RETURNING *
    `;
    return { project, created: false };
  }

  const projectId = crypto.randomUUID();
  const [project] = await sql`
    INSERT INTO "Project" (
      id, name, "clientName", status, budget, spent, progress, notes,
      phone, email, city, postcode, industry, services, about, accreditations,
      "photosJson", "openingHours", "socialFacebook", "socialInstagram",
      "leadId", "possibleClientId", source, "recommendedTemplate", "websiteFactoryPlanJson",
      "createdAt", "updatedAt"
    ) VALUES (
      ${projectId}, ${brief.name}, ${brief.clientName}, ${brief.status},
      ${brief.budget}, ${brief.spent}, ${brief.progress}, ${brief.notes},
      ${brief.phone}, ${brief.email}, ${brief.city}, ${brief.postcode}, ${brief.industry},
      ${brief.services}, ${brief.about}, ${brief.accreditations},
      ${brief.photosJson}, ${brief.openingHours}, ${brief.socialFacebook}, ${brief.socialInstagram},
      ${brief.leadId}, ${brief.possibleClientId}, ${brief.source}, ${brief.recommendedTemplate}, ${brief.websiteFactoryPlanJson},
      ${now}, ${now}
    )
    RETURNING *
  `;
  return { project, created: true };
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

    let projectResult: { project: unknown; created: boolean } | null = null;
    let googleBusinessImport: { imported: boolean; runId?: string; placeUrl?: string; error?: string } | null = null;
    try {
      projectResult = await createProjectForImportedLead({
        sql,
        business: { ...(b as Record<string, unknown>), id },
        leadId,
        phone,
        description,
        photos,
        openingHours,
        socialFacebook,
        socialInstagram,
      });
    } catch (projectErr) {
      console.error("Project auto-create error:", projectErr);
    }

    const projectId = projectResult?.project && typeof projectResult.project === "object"
      ? String((projectResult.project as Record<string, unknown>).id ?? "")
      : "";
    const googleMapsUrl = typeof b.maps_url === "string" ? b.maps_url : null;
    if (projectId && googleMapsUrl?.includes("google")) {
      try {
        const result = await importGoogleBusinessIntoProject({
          sql,
          projectId,
          placeUrl: googleMapsUrl,
          scraperUrl: SCRAPER_URL,
          preserveMachinePrefill: false,
        });
        projectResult = { project: result.project, created: projectResult?.created ?? false };
        googleBusinessImport = { imported: true, runId: result.runId, placeUrl: result.placeUrl };
      } catch (googleErr) {
        console.error("Google Business auto-fill error:", googleErr);
        googleBusinessImport = {
          imported: false,
          placeUrl: googleMapsUrl,
          error: googleErr instanceof Error ? googleErr.message : "Google Business auto-fill failed",
        };
      }
    }

    return NextResponse.json({
      lead,
      project: projectResult?.project ?? null,
      projectCreated: projectResult?.created ?? false,
      googleBusinessImport,
    }, { status: 201 });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
