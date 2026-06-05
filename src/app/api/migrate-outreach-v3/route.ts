import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const ran: string[] = [];

  async function step(name: string, fn: () => Promise<unknown>) {
    try { await fn(); ran.push(`✓ ${name}`); }
    catch (e) { ran.push(`— ${name} (${String(e).slice(0, 80)})`); }
  }

  await step("business_phone column", () =>
    sql`ALTER TABLE "OutreachRecord" ADD COLUMN IF NOT EXISTS business_phone TEXT`
  );

  await step("email_opened_at column", () =>
    sql`ALTER TABLE "OutreachRecord" ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ`
  );

  await step("form_started_at column", () =>
    sql`ALTER TABLE "OutreachRecord" ADD COLUMN IF NOT EXISTS form_started_at TIMESTAMPTZ`
  );

  await step("brief_answers column", () =>
    sql`ALTER TABLE "OutreachRecord" ADD COLUMN IF NOT EXISTS brief_answers JSONB`
  );

  return NextResponse.json({ ok: true, ran });
}
