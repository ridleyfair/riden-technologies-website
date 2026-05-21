import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const sql = getDb();

  const fields = ["name", "trigger", "actions", "status", "runsTotal", "runsToday"];
  for (const field of fields) {
    if (body[field] !== undefined) {
      await sql`UPDATE "Automation" SET ${sql(field)} = ${body[field]} WHERE id = ${id}`;
    }
  }
  if (body.lastRun !== undefined) {
    const v = body.lastRun ? new Date(body.lastRun) : null;
    await sql`UPDATE "Automation" SET "lastRun" = ${v} WHERE id = ${id}`;
  }

  const [automation] = await sql`SELECT * FROM "Automation" WHERE id = ${id}`;
  return NextResponse.json(automation);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM "Automation" WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
