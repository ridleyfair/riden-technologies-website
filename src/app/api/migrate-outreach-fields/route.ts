import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();

  await sql`ALTER TABLE "GeneratedSite" ADD COLUMN IF NOT EXISTS "outreachEmail"   TEXT`;
  await sql`ALTER TABLE "GeneratedSite" ADD COLUMN IF NOT EXISTS "lastOutreachAt"  TIMESTAMPTZ`;
  await sql`ALTER TABLE "GeneratedSite" ADD COLUMN IF NOT EXISTS "outreachStatus"  TEXT DEFAULT 'not_contacted'`;

  return NextResponse.json({ ok: true, message: "Outreach columns added to GeneratedSite" });
}
