import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Public — token is the credential
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  const [record] = await sql`
    SELECT id FROM "OutreachRecord" WHERE form_token = ${token} LIMIT 1
  `;
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sql`
    UPDATE "OutreachRecord" SET
      opt_out          = TRUE,
      opt_out_at       = NOW(),
      outreach_status  = 'opted_out',
      updated_at       = NOW()
    WHERE id = ${record.id as string}
  `;

  return NextResponse.json({ ok: true });
}
