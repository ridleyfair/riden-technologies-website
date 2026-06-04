import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS "ClientBriefForm" (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      token        UUID        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      project_id   TEXT        NOT NULL,
      business_name TEXT,
      status       TEXT        NOT NULL DEFAULT 'pending',
      answers      JSONB,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      submitted_at TIMESTAMPTZ
    )
  `;
  return NextResponse.json({ ok: true, message: "ClientBriefForm table ready" });
}
