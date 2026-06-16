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

  await step("Project.phone", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS phone TEXT`);
  await step("Project.email", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS email TEXT`);
  await step("Project.city", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS city TEXT`);
  await step("Project.postcode", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS postcode TEXT`);
  await step("Project.industry", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'trades'`);
  await step("Project.services", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS services TEXT`);
  await step("Project.about", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS about TEXT`);
  await step("Project.accreditations", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS accreditations TEXT`);
  await step("Project.socialFacebook", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "socialFacebook" TEXT`);
  await step("Project.socialInstagram", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "socialInstagram" TEXT`);
  await step("Project.openingHours", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "openingHours" TEXT`);
  await step("Project.reviewsJson", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "reviewsJson" TEXT DEFAULT '[]'`);
  await step("Project.photosJson", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "photosJson" TEXT DEFAULT '[]'`);
  await step("Project.leadId", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "leadId" TEXT`);
  await step("Project.possibleClientId", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "possibleClientId" TEXT`);
  await step("Project.source", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS source TEXT`);
  await step("Project.recommendedTemplate", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "recommendedTemplate" TEXT`);
  await step("Project.websiteFactoryPlanJson", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "websiteFactoryPlanJson" TEXT`);
  await step("idx Project.possibleClientId", () => sql`
    CREATE INDEX IF NOT EXISTS "Project_possibleClientId_idx" ON "Project"("possibleClientId") WHERE "possibleClientId" IS NOT NULL
  `);

  return NextResponse.json({
    ok: true,
    ran,
    failed,
    message: `Brief migration complete — ${ran.length} steps succeeded, ${failed.length} failed.`,
  });
}
