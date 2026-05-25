import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  const results: string[] = [];

  try {
    await sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "inviteSentAt" TIMESTAMPTZ`;
    results.push("inviteSentAt: added");
  } catch (e) {
    results.push(`inviteSentAt: failed — ${e}`);
  }

  try {
    await sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "attendeeResponseStatus" TEXT`;
    results.push("attendeeResponseStatus: added");
  } catch (e) {
    results.push(`attendeeResponseStatus: failed — ${e}`);
  }

  try {
    await sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "outlookResponseUpdatedAt" TIMESTAMPTZ`;
    results.push("outlookResponseUpdatedAt: added");
  } catch (e) {
    results.push(`outlookResponseUpdatedAt: failed — ${e}`);
  }

  return NextResponse.json({ ok: true, results });
}
