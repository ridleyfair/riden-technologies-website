import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const sql = getDb();
  const now = new Date();

  const fields = ["title", "client", "date", "time", "duration", "type", "status", "notes"];
  for (const field of fields) {
    if (body[field] !== undefined) {
      await sql`UPDATE "Booking" SET ${sql(field)} = ${body[field]}, "updatedAt" = ${now} WHERE id = ${id}`;
    }
  }

  const [booking] = await sql`SELECT * FROM "Booking" WHERE id = ${id}`;
  return NextResponse.json(booking);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM "Booking" WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
