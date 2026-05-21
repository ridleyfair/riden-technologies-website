import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { isMsConfigured, deleteTeamsCalendarEvent } from "@/lib/ms-graph";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  const now = new Date();

  const rows = await sql`SELECT * FROM "Booking" WHERE id = ${id}`;
  const booking = rows[0];
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.microsoftEventId && isMsConfigured()) {
    try {
      await deleteTeamsCalendarEvent(booking.microsoftEventId as string);
    } catch (err) {
      console.error("Graph cancel error:", err);
    }
  }

  await sql`
    UPDATE "Booking" SET
      status = 'cancelled',
      "microsoftEventId" = NULL,
      "teamsJoinUrl" = NULL,
      "updatedAt" = ${now}
    WHERE id = ${id}
  `;

  const [updated] = await sql`SELECT * FROM "Booking" WHERE id = ${id}`;
  return NextResponse.json(updated);
}
