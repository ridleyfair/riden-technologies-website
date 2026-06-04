import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Public — no auth. The token IS the auth.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  const [form] = await sql`
    SELECT token, business_name, status, created_at, submitted_at
    FROM "ClientBriefForm"
    WHERE token = ${token}
    LIMIT 1
  `;

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  return NextResponse.json({ form });
}
