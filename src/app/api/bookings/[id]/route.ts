import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import {
  isMsConfigured,
  updateTeamsCalendarEvent,
  deleteTeamsCalendarEvent,
  buildStartEnd,
} from "@/lib/ms-graph";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const sql = getDb();
  const now = new Date();

  const rows = await sql`SELECT * FROM "Booking" WHERE id = ${id}`;
  const existing = rows[0];
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Update scalar fields
  const textFields = [
    "title", "client", "clientEmail", "leadId",
    "date", "time", "duration", "type", "notes", "timezone",
  ] as const;
  for (const field of textFields) {
    if (body[field] !== undefined) {
      await sql`UPDATE "Booking" SET ${sql(field)} = ${body[field]}, "updatedAt" = ${now} WHERE id = ${id}`;
    }
  }
  if (body.durationMinutes !== undefined) {
    await sql`UPDATE "Booking" SET "durationMinutes" = ${Number(body.durationMinutes)}, "updatedAt" = ${now} WHERE id = ${id}`;
  }
  if (body.status !== undefined) {
    await sql`UPDATE "Booking" SET status = ${body.status}, "updatedAt" = ${now} WHERE id = ${id}`;
  }

  // Sync with Outlook
  const microsoftEventId = existing.microsoftEventId as string | null;
  if (microsoftEventId && isMsConfigured()) {
    if (body.status === "cancelled") {
      // Cancel = delete from Outlook, keep CRM record
      try {
        await deleteTeamsCalendarEvent(microsoftEventId);
        await sql`
          UPDATE "Booking" SET
            "microsoftEventId" = NULL, "teamsJoinUrl" = NULL, "updatedAt" = ${now}
          WHERE id = ${id}
        `;
      } catch (err) {
        console.error("Graph cancel error:", err);
      }
    } else {
      const rescheduleChanged =
        body.date !== undefined || body.time !== undefined || body.durationMinutes !== undefined;
      if (rescheduleChanged || body.title !== undefined) {
        const newDate = body.date ?? existing.date;
        const newTime = body.time ?? existing.time;
        const newDuration = body.durationMinutes ?? existing.durationMinutes ?? 30;
        const newTimezone = body.timezone ?? existing.timezone ?? "Europe/London";

        try {
          const { startIso, endIso } = buildStartEnd(newDate, newTime, Number(newDuration));
          await updateTeamsCalendarEvent(microsoftEventId, {
            title: body.title !== undefined ? body.title : undefined,
            startIso: rescheduleChanged ? startIso : undefined,
            endIso: rescheduleChanged ? endIso : undefined,
            timezone: rescheduleChanged ? newTimezone : undefined,
          });
          if (rescheduleChanged) {
            const startTime = new Date(startIso + "Z");
            const endTime = new Date(endIso + "Z");
            await sql`
              UPDATE "Booking" SET "startTime" = ${startTime}, "endTime" = ${endTime}, "updatedAt" = ${now}
              WHERE id = ${id}
            `;
          }
        } catch (err) {
          console.error("Graph update error:", err);
        }
      }
    }
  }

  const [booking] = await sql`SELECT * FROM "Booking" WHERE id = ${id}`;
  return NextResponse.json(booking);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();

  const rows = await sql`SELECT "microsoftEventId" FROM "Booking" WHERE id = ${id}`;
  const existing = rows[0];

  if (existing?.microsoftEventId && isMsConfigured()) {
    try {
      await deleteTeamsCalendarEvent(existing.microsoftEventId as string);
    } catch (err) {
      console.error("Graph delete error:", err);
    }
  }

  await sql`DELETE FROM "Booking" WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
