import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const { status = "Preview Email Prepared" } = await req.json().catch(() => ({}));

  const sql = getDb();
  await sql`
    UPDATE "GeneratedSite"
    SET "lastOutreachAt" = NOW(),
        "outreachStatus" = ${status},
        "updatedAt"      = NOW()
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
