import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

const TEMPLATE_MAP: Record<string, string> = {
  emergency: "emergency-trade",
  reno:      "reno-showcase",
  outdoor:   "outdoor-transform",
  decor:     "finish-decor",
};

const INDUSTRY_MAP: Record<string, string> = {
  emergency: "trades",
  reno:      "trades",
  outdoor:   "trades",
  decor:     "trades",
};

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // Rate limit
  try {
    const sql = getDb();
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
    const rows = await sql`
      SELECT COUNT(*) AS count FROM "Lead"
      WHERE source = 'universal-brief' AND notes ILIKE ${`%IP:${ip}%`} AND "createdAt" > ${windowStart}
    `;
    if (Number(rows[0]?.count ?? 0) >= RATE_LIMIT) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
    }
  } catch { /* fail open */ }

  try {
    const body = await req.json() as Record<string, unknown>;
    const {
      tradeGroup,
      subTrade,
      businessName,
      city,
      postcode,
      phone,
      email,
      existingWebsite,
      services,
      accreditations,
      emergencyCallouts,
      emergencyPhone,
      serviceAreas,
      yearsTrading,
      googleRating,
      googleReviewCount,
      checkatradeProfile,
      description,
      albums,
      pairs,
    } = body as {
      tradeGroup: string;
      subTrade: string;
      businessName: string;
      city: string;
      postcode: string;
      phone: string;
      email: string;
      existingWebsite?: string;
      services: string[];
      accreditations: string[];
      emergencyCallouts?: boolean;
      emergencyPhone?: string;
      serviceAreas?: string;
      yearsTrading?: string;
      googleRating?: string;
      googleReviewCount?: string;
      checkatradeProfile?: string;
      description?: string;
      albums?: Array<{ id: string; name: string; photos: Array<{ url: string; filename: string }> }>;
      pairs?: Array<{ id: string; category: string; before: { url: string; filename: string }; after: { url: string; filename: string } }>;
    };

    if (!businessName || !phone || !email || !tradeGroup) {
      return NextResponse.json({ error: "Business name, phone, email and trade are required." }, { status: 400 });
    }

    const sql = getDb();
    const now = new Date();
    const leadId = crypto.randomUUID();
    const projectId = crypto.randomUUID();

    const template = TEMPLATE_MAP[tradeGroup] ?? "modern-minimal";
    const industry = INDUSTRY_MAP[tradeGroup] ?? "trades";
    const servicesText = Array.isArray(services) ? services.join("\n") : "";
    const accreditationsText = Array.isArray(accreditations) ? accreditations.join("\n") : "";

    // Build about text from description + context
    const aboutParts = [
      description?.trim(),
      yearsTrading ? `${businessName} has been trading for ${yearsTrading} years.` : null,
      emergencyCallouts ? `We offer 24/7 emergency callouts.${emergencyPhone ? ` Emergency number: ${emergencyPhone}` : ""}` : null,
      serviceAreas ? `We cover ${serviceAreas}.` : null,
    ].filter(Boolean);
    const about = aboutParts.join(" ") || `${businessName} provides professional ${subTrade || tradeGroup} services${city ? ` in ${city}` : ""}.`;

    // Build notes
    const notes = [
      `Source: Universal Website Brief`,
      `Trade: ${subTrade || tradeGroup}`,
      `Template: ${template}`,
      existingWebsite ? `Existing website: ${existingWebsite}` : "No existing website",
      emergencyCallouts ? `Emergency callouts: YES${emergencyPhone ? ` — ${emergencyPhone}` : ""}` : null,
      googleRating ? `Google rating: ${googleRating} (${googleReviewCount ?? 0} reviews)` : null,
      checkatradeProfile ? `Checkatrade: ${checkatradeProfile}` : null,
      `IP:${ip}`,
    ].filter(Boolean).join("\n");

    // Build photosJson — regular albums first, then before/after pairs
    const albumList = albums ?? [];
    const pairList  = pairs ?? [];

    const projectAlbums = [
      ...albumList.map((album, idx) => ({
        id: `album_${idx + 1}`,
        title: album.name,
        category: album.name,
        type: "gallery",
        photos: album.photos.map((p, i) => ({ id: `a${idx}_p${i}`, url: p.url, filename: p.filename, alt: `${album.name} photo`, displayOrder: i })),
        displayOrder: idx,
        enabled: true,
        coverImageUrl: album.photos[0]?.url ?? "",
      })),
      ...pairList.map((pair, idx) => ({
        id: `pair_${idx + 1}`,
        title: pair.category,
        category: pair.category,
        type: "before-after",
        before: pair.before,
        after: pair.after,
        displayOrder: albumList.length + idx,
        enabled: true,
      })),
    ];
    const photosJson = JSON.stringify({
      gallery: [
        ...albumList.flatMap(a => a.photos.map(p => p.url)),
        ...pairList.flatMap(p => [p.before.url, p.after.url]),
      ],
      projectAlbums,
    });

    // Review settings
    const reviewSettings = googleRating ? JSON.stringify({
      platform: checkatradeProfile ? "Checkatrade" : "Google",
      reviewCount: Number(googleReviewCount) || undefined,
      averageRating: googleRating,
      platformUrl: checkatradeProfile || undefined,
      showReviewBadge: true,
      showRatingBadge: true,
    }) : null;

    // Create Lead
    await sql`
      INSERT INTO "Lead" (
        id, name, email, company, phone, service, message,
        status, source, score, value, notes,
        "createdAt", "updatedAt"
      ) VALUES (
        ${leadId}, ${businessName}, ${email}, ${businessName}, ${phone},
        ${subTrade || tradeGroup},
        ${"Submitted via Universal Website Brief"},
        ${"new"}, ${"universal-brief"}, ${60}, ${0}, ${notes},
        ${now}, ${now}
      )
    `;

    // Ensure Project columns exist
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
      await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS source TEXT`;
      await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "recommendedTemplate" TEXT`;
      await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "reviewsJson" TEXT DEFAULT '[]'`;
    } catch { /* columns already exist */ }

    // Create Project with full brief
    await sql`
      INSERT INTO "Project" (
        id, name, "clientName", status, budget, spent, progress, notes,
        phone, email, city, postcode, industry, services, about, accreditations,
        "photosJson", "openingHours", "leadId", source, "recommendedTemplate",
        "createdAt", "updatedAt"
      ) VALUES (
        ${projectId}, ${businessName}, ${businessName},
        ${"active"}, ${199}, ${0}, ${10}, ${notes},
        ${phone}, ${email}, ${city || null}, ${postcode || null},
        ${industry}, ${servicesText || null}, ${about},
        ${accreditationsText || null},
        ${photosJson},
        ${emergencyCallouts ? `24/7 emergency callouts${emergencyPhone ? ` — call ${emergencyPhone}` : ""}` : null},
        ${leadId}, ${"universal-brief"}, ${template},
        ${now}, ${now}
      )
    `;

    // Store review settings on project if provided
    if (reviewSettings) {
      try {
        await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "websiteFactoryPlanJson" TEXT`;
        await sql`
          UPDATE "Project"
          SET "websiteFactoryPlanJson" = ${JSON.stringify({ reviewSettings: JSON.parse(reviewSettings) })}
          WHERE id = ${projectId}
        `;
      } catch { /* ignore */ }
    }

    return NextResponse.json({ success: true, projectId, leadId }, { status: 201 });
  } catch (err) {
    console.error("Universal brief error:", err);
    return NextResponse.json({ error: "Failed to save brief. Please try again." }, { status: 500 });
  }
}

