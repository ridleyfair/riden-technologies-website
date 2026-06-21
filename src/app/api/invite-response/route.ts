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
  const tokenExpiry = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await sql`
    SELECT id, "bookingStatus", "microsoftEventId" FROM "Lead"
    WHERE "responseToken" = ${token}
      AND "createdAt" > ${tokenExpiry}
    LIMIT 1
  `;
  const lead = rows[0];

  if (!lead) {
    return NextResponse.redirect(new URL("/invite-response?status=invalid", req.url));
  }

  const newStatus = action === "accept" ? "accepted" : "declined";
  const bookingStatus = action === "accept" ? "approved" : "declined";
  const now = new Date();

  await sql`
    UPDATE "Lead" SET
      "bookingStatus" = ${newStatus},
      "updatedAt"     = ${now}
    WHERE "responseToken" = ${token}
  `;

  // Also update the linked Booking record if one exists for the same Outlook event
  if (lead.microsoftEventId) {
    await sql`
      UPDATE "Booking" SET
        status                     = ${bookingStatus},
        "outlookResponseUpdatedAt" = ${now},
        "updatedAt"                = ${now}
      WHERE "microsoftEventId"    = ${lead.microsoftEventId}
        AND status NOT IN ('cancelled', 'completed', 'no_show')
    `;
  }

  return NextResponse.redirect(new URL(`/invite-response?status=${newStatus}`, req.url));
}
