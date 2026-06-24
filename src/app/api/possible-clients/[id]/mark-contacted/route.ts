import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

async function ensureTable(sql: ReturnType<typeof import("@/lib/db")["getDb"]>) {
  await sql`
    CREATE TABLE IF NOT EXISTS business_contacted (
      business_id TEXT PRIMARY KEY,
      contacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  try {
    const sql = getDb();
    await ensureTable(sql);
    await sql`
      INSERT INTO business_contacted (business_id)
      VALUES (${id})
      ON CONFLICT (business_id) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to mark contacted" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  try {
    const sql = getDb();
    await ensureTable(sql);
    await sql`DELETE FROM business_contacted WHERE business_id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to unmark contacted" }, { status: 500 });
  }
}
