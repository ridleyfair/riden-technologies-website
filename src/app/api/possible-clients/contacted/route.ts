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

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const sql = getDb();
    await ensureTable(sql);
    const rows = await sql`SELECT business_id FROM business_contacted`;
    return NextResponse.json(rows.map((r) => r.business_id as string));
  } catch {
    return NextResponse.json([]);
  }
}
