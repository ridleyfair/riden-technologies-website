import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const sql = getDb();

  const fields = ["name", "client", "url", "status", "tier", "template", "views"];
  for (const field of fields) {
    if (body[field] !== undefined) {
      await sql`UPDATE "Website" SET ${sql(field)} = ${body[field]} WHERE id = ${id}`;
    }
  }

  const [website] = await sql`SELECT * FROM "Website" WHERE id = ${id}`;
  return NextResponse.json(website);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM "Website" WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
