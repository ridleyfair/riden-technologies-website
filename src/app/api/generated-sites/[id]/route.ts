import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

interface RouteContext {
  params: { id: string };
}

// GET /api/generated-sites/[id] — return single site including specJson
export async function GET(req: NextRequest, { params }: RouteContext) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  const rows = await sql`
    SELECT * FROM "GeneratedSite" WHERE id = ${params.id} LIMIT 1
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// DELETE /api/generated-sites/[id]
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  await sql`DELETE FROM "GeneratedSite" WHERE id = ${params.id}`;

  return NextResponse.json({ ok: true });
}
