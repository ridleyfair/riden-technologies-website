import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const ran: string[] = [];

  async function step(name: string, fn: () => Promise<unknown>) {
    try { await fn(); ran.push(name); } catch (e) { ran.push(`${name} (skipped: ${String(e).slice(0, 60)})`); }
  }

  await step("OutreachRecord table", () => sql`
    CREATE TABLE IF NOT EXISTS "OutreachRecord" (
      id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      generated_site_id      TEXT        NOT NULL,
      business_name          TEXT,
      business_email         TEXT        NOT NULL,
      preview_url            TEXT,
      form_token             UUID        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      outreach_status        TEXT        NOT NULL DEFAULT 'queued',
      outreach_email_sent_at TIMESTAMPTZ,
      form_submitted_at      TIMESTAMPTZ,
      converted_lead_id      TEXT,
      converted_project_id   TEXT,
      opt_out                BOOLEAN     NOT NULL DEFAULT FALSE,
      opt_out_at             TIMESTAMPTZ,
      error_message          TEXT,
      industry               TEXT,
      location               TEXT,
      approved               BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await step("OutreachRecord unique idx", () => sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "outreach_record_site_idx"
    ON "OutreachRecord" (generated_site_id)
    WHERE opt_out = FALSE
  `);

  await step("InterestFormSubmission table", () => sql`
    CREATE TABLE IF NOT EXISTS "InterestFormSubmission" (
      id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      outreach_record_id  UUID        NOT NULL REFERENCES "OutreachRecord"(id),
      name                TEXT,
      phone               TEXT,
      email               TEXT,
      business_name       TEXT,
      preferred_domain    TEXT,
      services_wanted     TEXT,
      design_changes      TEXT,
      photo_urls          TEXT[],
      preferred_call_time TEXT,
      notes               TEXT,
      submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return NextResponse.json({
    ok: true,
    ran,
    note: "Ensure the Azure app has Mail.Send Application permission for email sending to work.",
  });
}
