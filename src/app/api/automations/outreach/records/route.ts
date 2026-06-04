import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit  = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const sql = getDb();

  const rows = status
    ? await sql`
        SELECT * FROM "OutreachRecord"
        WHERE outreach_status = ${status}
        ORDER BY created_at DESC LIMIT ${limit}
      `
    : await sql`
        SELECT * FROM "OutreachRecord"
        ORDER BY created_at DESC LIMIT ${limit}
      `;

  return NextResponse.json(rows);
}

// Approve / retry / delete individual records
export async function PATCH(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id, action } = await req.json() as { id: string; action: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sql = getDb();

  if (action === "approve") {
    await sql`UPDATE "OutreachRecord" SET approved = TRUE, updated_at = NOW() WHERE id = ${id}`;
  } else if (action === "approve_all") {
    await sql`UPDATE "OutreachRecord" SET approved = TRUE, updated_at = NOW() WHERE outreach_status = 'queued' AND opt_out = FALSE`;
  } else if (action === "retry") {
    await sql`UPDATE "OutreachRecord" SET outreach_status = 'queued', approved = TRUE, error_message = NULL, updated_at = NOW() WHERE id = ${id}`;
  } else if (action === "delete") {
    await sql`DELETE FROM "OutreachRecord" WHERE id = ${id}`;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
