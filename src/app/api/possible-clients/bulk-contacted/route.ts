import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

async function ensureTable(sql: ReturnType<typeof import("@/lib/db")["getDb"]>) {
  await sql`
    CREATE TABLE IF NOT EXISTS contacted_phones (
      phone TEXT PRIMARY KEY,
      contacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

function normalizePhone(raw: string): string {
  return raw.replace(/\s+/g, "").trim();
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const sql = getDb();
    await ensureTable(sql);
    const rows = await sql`SELECT phone FROM contacted_phones`;
    return NextResponse.json(rows.map((r) => r.phone as string));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let phones: string[] = [];
  try {
    const body = await req.json();
    phones = (body.phones ?? []).map(normalizePhone).filter(Boolean);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (phones.length === 0) {
    return NextResponse.json({ saved: 0 });
  }

  try {
    const sql = getDb();
    await ensureTable(sql);
    await sql`
      INSERT INTO contacted_phones (phone)
      SELECT unnest(${phones}::text[])
      ON CONFLICT (phone) DO NOTHING
    `;
    return NextResponse.json({ saved: phones.length });
  } catch {
    return NextResponse.json({ error: "Failed to save phones" }, { status: 500 });
  }
}
