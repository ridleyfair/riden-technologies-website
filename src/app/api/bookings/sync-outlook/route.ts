import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { isMsConfigured, listCalendarEvents, getSharedMailbox } from "@/lib/ms-graph";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  if (!isMsConfigured()) {
    return NextResponse.json({ error: "Microsoft Graph not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const start =
    body.start ?? new Date(Date.now() - 7 * 86_400_000).toISOString().split("T")[0];
  const end =
    body.end ?? new Date(Date.now() + 90 * 86_400_000).toISOString().split("T")[0];

  let events;
  try {
    events = await listCalendarEvents(start, end);
  } catch (err) {
    return NextResponse.json({ error: `Failed to fetch from Outlook: ${err}` }, { status: 500 });
  }

  const sql = getDb();
  const mailbox = getSharedMailbox();
  let created = 0;
  let updated = 0;
  const now = new Date();

  for (const event of events) {
    const existing = (
      await sql`SELECT id FROM "Booking" WHERE "microsoftEventId" = ${event.id} LIMIT 1`
    )[0];

    // Parse Graph datetime: "2026-05-21T10:00:00.0000000"
    const dtStr = event.start.dateTime;
    const datePart = dtStr.slice(0, 10);
    const timePart = dtStr.slice(11, 16);

    const firstAttendee = event.attendees?.find((a) => a.type === "required");
    const clientName = firstAttendee?.emailAddress.name ?? "Unknown";
    const clientEmail = firstAttendee?.emailAddress.address ?? "";
    const teamsJoinUrl =
      event.onlineMeeting?.joinUrl ?? event.onlineMeetingUrl ?? null;

    if (!existing) {
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO "Booking" (
          id, title, client, "clientEmail",
          date, time, duration, "durationMinutes",
          type, status, notes, timezone,
          "microsoftEventId", "outlookCalendarEmail", "teamsJoinUrl",
          attendees, "lastSyncedAt", "createdByUserId", "createdAt", "updatedAt"
        ) VALUES (
          ${id}, ${event.subject}, ${clientName}, ${clientEmail},
          ${datePart}, ${timePart}, ${"30 min"}, ${30},
          ${"video"}, ${"confirmed"}, ${event.bodyPreview ?? ""}, ${"Europe/London"},
          ${event.id}, ${mailbox}, ${teamsJoinUrl},
          ${"[]"}, ${now}, ${user.id}, ${now}, ${now}
        )
      `;
      created++;
    } else {
      await sql`
        UPDATE "Booking" SET
          title = ${event.subject},
          "teamsJoinUrl" = ${teamsJoinUrl},
          "lastSyncedAt" = ${now},
          "updatedAt" = ${now}
        WHERE "microsoftEventId" = ${event.id}
      `;
      updated++;
    }
  }

  return NextResponse.json({
    ok: true,
    synced: events.length,
    created,
    updated,
    dateRange: { start, end },
  });
}
