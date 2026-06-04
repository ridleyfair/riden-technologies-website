import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Public — token is the credential
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  const [record] = await sql`
    SELECT id, business_name, business_email, preview_url, industry, location,
           outreach_status, opt_out, form_submitted_at
    FROM "OutreachRecord"
    WHERE form_token = ${token}
    LIMIT 1
  `;

  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (record.opt_out) return NextResponse.json({ error: "opted_out" }, { status: 410 });
  if (record.form_submitted_at) return NextResponse.json({ error: "already_submitted" }, { status: 409 });

  return NextResponse.json({ record });
}
