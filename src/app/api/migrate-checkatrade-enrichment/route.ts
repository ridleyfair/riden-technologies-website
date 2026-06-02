import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS "CheckatradeEnrichment" (
      id                       TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
      business_id              TEXT         NOT NULL UNIQUE,
      has_checkatrade          BOOLEAN      NOT NULL DEFAULT false,
      checkatrade_url          TEXT,
      checkatrade_rating       NUMERIC(3,1),
      checkatrade_review_count INTEGER      NOT NULL DEFAULT 0,
      checkatrade_category     TEXT,
      checkatrade_location     TEXT,
      checkatrade_phone        TEXT,
      match_confidence         TEXT,
      opportunity_score        INTEGER      NOT NULL DEFAULT 0,
      checked_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  return NextResponse.json({ ok: true, message: "CheckatradeEnrichment table ready" });
}
