import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const ran: string[] = [];

  async function step(name: string, fn: () => Promise<unknown>) {
    try { await fn(); ran.push(`✓ ${name}`); }
    catch (e) { ran.push(`— ${name} (${String(e).slice(0, 80)})`); }
  }

  await step("BusinessEmailScan table", () => sql`
    CREATE TABLE IF NOT EXISTS "BusinessEmailScan" (
      business_id  TEXT        PRIMARY KEY,
      email        TEXT,
      source       TEXT        NOT NULL DEFAULT 'website_scan',
      scanned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return NextResponse.json({ ok: true, ran });
}
