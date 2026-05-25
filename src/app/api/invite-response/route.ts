import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const action = searchParams.get("action");

  if (!token || (action !== "accept" && action !== "decline")) {
    return NextResponse.redirect(new URL("/invite-response?status=invalid", req.url));
  }

  const sql = getDb();
  const rows = await sql`SELECT id, "bookingStatus" FROM "Lead" WHERE "responseToken" = ${token} LIMIT 1`;
  const lead = rows[0];

  if (!lead) {
    return NextResponse.redirect(new URL("/invite-response?status=invalid", req.url));
  }

  const newStatus = action === "accept" ? "accepted" : "declined";

  await sql`
    UPDATE "Lead" SET
      "bookingStatus" = ${newStatus},
      "updatedAt"     = ${new Date()}
    WHERE "responseToken" = ${token}
  `;

  return NextResponse.redirect(new URL(`/invite-response?status=${newStatus}`, req.url));
}
