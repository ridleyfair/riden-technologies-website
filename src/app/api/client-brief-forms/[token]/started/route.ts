import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Public — marks the form as started (for CRM tracking)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  await sql`
    UPDATE "OutreachRecord"
    SET form_started_at = COALESCE(form_started_at, NOW()), updated_at = NOW()
    WHERE form_token = ${token} AND opt_out = FALSE AND form_submitted_at IS NULL
  `;

  return NextResponse.json({ ok: true });
}
