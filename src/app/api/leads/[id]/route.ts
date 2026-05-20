import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const sql = getDb();

    const current = await sql`SELECT * FROM "Lead" WHERE id = ${id} LIMIT 1`;
    if (!current[0]) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const existing = current[0] as Record<string, unknown>;

    const now = new Date();
    const updated = await sql`
      UPDATE "Lead" SET
        name     = ${body.name     ?? existing.name},
        email    = ${body.email    ?? existing.email},
        company  = ${body.company  !== undefined ? body.company  : existing.company},
        service  = ${body.service  !== undefined ? body.service  : existing.service},
        message  = ${body.message  ?? existing.message},
        status   = ${body.status   ?? existing.status},
        score    = ${body.score    !== undefined ? body.score    : existing.score},
        "updatedAt" = ${now}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error("Lead update error:", err);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM "Lead" WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lead delete error:", err);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
