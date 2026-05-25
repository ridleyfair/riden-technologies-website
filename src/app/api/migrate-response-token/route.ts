import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  await sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "responseToken" TEXT`;

  return NextResponse.json({ ok: true, message: "responseToken column added" });
}
