import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// GET /api/generated-sites/[id] — return single site including specJson
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT * FROM "GeneratedSite" WHERE id = ${id} LIMIT 1`;

  if (!rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// DELETE /api/generated-sites/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM "GeneratedSite" WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
