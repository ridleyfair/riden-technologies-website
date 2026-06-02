import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

const SCRAPER_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";

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

    const [lead] = await sql`
      INSERT INTO "Lead" (
        id, name, email, company, phone, service, message,
        status, source, score, value, notes,
        "createdAt", "updatedAt"
      ) VALUES (
        ${leadId}, ${b.name}, ${""}, ${b.name},
        ${b.phone ?? null}, ${b.category ?? null},
        ${"Imported from Google Maps scraper"},
        ${"new"}, ${"scraper"},
        ${b.lead_score?.total_score ?? 0}, ${0}, ${notes},
        ${now}, ${now}
      )
      RETURNING *
    `;

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
