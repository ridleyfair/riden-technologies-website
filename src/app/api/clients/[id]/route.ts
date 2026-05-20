import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();

  const rows = await sql`SELECT * FROM "Client" WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const sql = getDb();

  const current = await sql`SELECT * FROM "Client" WHERE id = ${id} LIMIT 1`;
  if (!current[0]) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const ex = current[0] as Record<string, unknown>;

  const now = new Date();
  const [updated] = await sql`
    UPDATE "Client" SET
      name      = ${body.name      ?? ex.name},
      email     = ${body.email     ?? ex.email},
      company   = ${body.company   ?? ex.company},
      phone     = ${body.phone     !== undefined ? body.phone     : ex.phone},
      tier      = ${body.tier      ?? ex.tier},
      status    = ${body.status    ?? ex.status},
      revenue   = ${body.revenue   !== undefined ? body.revenue   : ex.revenue},
      websites  = ${body.websites  !== undefined ? body.websites  : ex.websites ?? 0},
      notes     = ${body.notes     !== undefined ? body.notes     : ex.notes},
      "updatedAt" = ${now}
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM "Client" WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
