import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const sql = getDb();
    const projects = await sql`SELECT * FROM "Project" ORDER BY "createdAt" DESC`;
    return NextResponse.json(projects);
  } catch {
    // Table may not exist yet if migration hasn't been run
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const {
      name,
      clientName = "",
      status = "planning",
      budget = 0,
      spent = 0,
      progress = 0,
      dueDate = null,
      notes = "",
      // Brief fields — pre-filled from scraper data on import
      phone           = null,
      email           = null,
      city            = null,
      postcode        = null,
      industry        = "trades",
      services        = null,
      about           = null,
      accreditations  = null,
      photosJson      = null,
      openingHours    = null,
      socialFacebook  = null,
      socialInstagram = null,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    const [project] = await sql`
      INSERT INTO "Project" (
        id, name, "clientName", status, budget, spent, progress,
        "dueDate", notes,
        phone, email, city, postcode, industry, services, about,
        accreditations, "photosJson", "openingHours", "socialFacebook", "socialInstagram",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${name.trim()}, ${clientName}, ${status},
        ${Number(budget)}, ${Number(spent)}, ${Math.min(100, Math.max(0, Number(progress)))},
        ${dueDate ?? null}, ${notes},
        ${phone}, ${email}, ${city}, ${postcode}, ${industry}, ${services}, ${about},
        ${accreditations}, ${photosJson ? JSON.stringify(photosJson) : null},
        ${openingHours}, ${socialFacebook}, ${socialInstagram},
        ${now}, ${now}
      )
      RETURNING *
    `;

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error("Project create error:", err);
    return NextResponse.json({ error: "Failed to create project. Run POST /api/migrate first." }, { status: 500 });
  }
}
