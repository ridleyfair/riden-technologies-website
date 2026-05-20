import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const sql = getDb();
    const leads = await sql`SELECT * FROM "Lead" ORDER BY "createdAt" DESC`;
    return NextResponse.json(leads);
  } catch (err) {
    console.error("Leads fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const {
      name, email, company, phone, service,
      message = "", status = "new", source = "manual",
      score = 0, value = 0, notes = "",
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    const [lead] = await sql`
      INSERT INTO "Lead" (
        id, name, email, company, phone, service, message,
        status, source, score, value, notes,
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${name}, ${email},
        ${company ?? null}, ${phone ?? null}, ${service ?? null},
        ${message}, ${status}, ${source}, ${score}, ${value}, ${notes},
        ${now}, ${now}
      )
      RETURNING *
    `;
    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("Lead create error:", err);
    // Fallback: try without new columns if migration not run yet
    try {
      const body = await req.clone().json();
      const sql = getDb();
      const id = crypto.randomUUID();
      const now = new Date();
      const [lead] = await sql`
        INSERT INTO "Lead" (id, name, email, company, service, message, status, source, score, "createdAt", "updatedAt")
        VALUES (${id}, ${body.name}, ${body.email}, ${body.company ?? null}, ${body.service ?? null},
                ${body.message ?? ""}, ${body.status ?? "new"}, ${body.source ?? "manual"}, 0, ${now}, ${now})
        RETURNING *
      `;
      return NextResponse.json(lead, { status: 201 });
    } catch (e2) {
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }
  }
}
