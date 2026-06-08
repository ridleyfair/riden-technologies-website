import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const ran: string[] = [];
  const failed: { step: string; error: string }[] = [];

  async function step(name: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      ran.push(name);
    } catch (e) {
      failed.push({ step: name, error: String(e) });
    }
  }

  await step('Project.pricingTier', () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "pricingTier" TEXT DEFAULT 'pro'`);
  await step('Project.setupFee',    () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "setupFee" INTEGER DEFAULT 299`);
  await step('Project.monthlyFee',  () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "monthlyFee" INTEGER DEFAULT 50`);

  return NextResponse.json({
    ok: true,
    ran,
    failed,
    message: `Pricing tier migration complete — ${ran.length} steps succeeded, ${failed.length} failed.`,
  });
}
