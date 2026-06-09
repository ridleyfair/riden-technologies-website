import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  const steps: string[] = [];

  async function step(name: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      steps.push(`✓ ${name}`);
    } catch (err) {
      steps.push(`✗ ${name}: ${err}`);
    }
  }

  await step("create BeautyBookingRequest table", () => sql`
    CREATE TABLE IF NOT EXISTS "BeautyBookingRequest" (
      id TEXT PRIMARY KEY,
      "siteId" TEXT,
      "businessName" TEXT NOT NULL DEFAULT '',
      "customerName" TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      treatment TEXT DEFAULT '',
      "preferredDate" TEXT DEFAULT '',
      "preferredTime" TEXT DEFAULT '',
      "specialRequests" TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await step("index BeautyBookingRequest.siteId", () => sql`
    CREATE INDEX IF NOT EXISTS "BeautyBookingRequest_siteId_idx"
    ON "BeautyBookingRequest" ("siteId")
  `);

  await step("index BeautyBookingRequest.status", () => sql`
    CREATE INDEX IF NOT EXISTS "BeautyBookingRequest_status_idx"
    ON "BeautyBookingRequest" (status)
  `);

  return NextResponse.json({ ok: true, steps });
}
