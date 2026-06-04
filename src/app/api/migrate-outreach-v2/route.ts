import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Run this once after migrate-outreach-automation to allow Possible Client sourcing
export async function GET() {
  const sql = getDb();
  const ran: string[] = [];

  async function step(name: string, fn: () => Promise<unknown>) {
    try { await fn(); ran.push(`✓ ${name}`); }
    catch (e) { ran.push(`— ${name} (${String(e).slice(0, 80)})`); }
  }

  // Make generated_site_id nullable (was NOT NULL)
  await step("generated_site_id nullable", () =>
    sql`ALTER TABLE "OutreachRecord" ALTER COLUMN generated_site_id DROP NOT NULL`
  );

  // Add possible_client_id column
  await step("possible_client_id column", () =>
    sql`ALTER TABLE "OutreachRecord" ADD COLUMN IF NOT EXISTS possible_client_id TEXT`
  );

  // Drop old partial unique index on generated_site_id
  await step("drop old unique index", () =>
    sql`DROP INDEX IF EXISTS "outreach_record_site_idx"`
  );

  // Add unique index on business_email — prevents duplicate sends regardless of source
  await step("unique index on business_email", () =>
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "outreach_record_email_idx" ON "OutreachRecord" (LOWER(business_email)) WHERE opt_out = FALSE`
  );

  return NextResponse.json({ ok: true, ran });
}
