import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { isMsConfigured, listCalendarEvents, getSharedMailbox, graphResponseToCrmStatus } from "@/lib/ms-graph";

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
  let statusUpdated = 0;
  const now = new Date();

  const errors: string[] = [];

  for (const event of events) {
    try {
      const existing = (
        await sql`SELECT id, status FROM "Booking" WHERE "microsoftEventId" = ${event.id} LIMIT 1`
      )[0];

      // Parse Graph datetime: "2026-05-21T10:00:00.0000000"
      const dtStr = event.start.dateTime;
      const datePart = dtStr.slice(0, 10);
      const timePart = dtStr.slice(11, 16);

      const firstAttendee = event.attendees?.find((a) => a.type === "required");
      const clientName = firstAttendee?.emailAddress.name ?? "Unknown";
      const clientEmail = firstAttendee?.emailAddress.address ?? "";
      const teamsJoinUrl = event.onlineMeeting?.joinUrl ?? event.onlineMeetingUrl ?? null;

      // Map Outlook RSVP → CRM status (attendees may be absent if invite was sent via SendGrid)
      const attendeeResponse = firstAttendee?.status?.response;
      let crmStatus = graphResponseToCrmStatus(attendeeResponse);

      // If Graph has no attendee data, fall back to any matching Lead's bookingStatus
      if (crmStatus === "awaiting_response") {
        const leadRows = await sql`
          SELECT "bookingStatus" FROM "Lead"
          WHERE "microsoftEventId" = ${event.id}
            AND "bookingStatus" IN ('accepted', 'declined')
          LIMIT 1
        `;
        if (leadRows[0]) {
          crmStatus = leadRows[0].bookingStatus === "accepted" ? "approved" : "declined";
        }
      }

      if (!existing) {
        const id = crypto.randomUUID();
        await sql`
          INSERT INTO "Booking" (
            id, title, client, "clientEmail",
            date, time, duration, "durationMinutes",
            type, status, "attendeeResponseStatus", notes, timezone,
            "microsoftEventId", "outlookCalendarEmail", "teamsJoinUrl",
            attendees, "lastSyncedAt", "createdByUserId", "createdAt", "updatedAt"
          ) VALUES (
            ${id}, ${event.subject}, ${clientName}, ${clientEmail},
            ${datePart}, ${timePart}, ${"30 min"}, ${30},
            ${"video"}, ${crmStatus}, ${attendeeResponse ?? null}, ${event.bodyPreview ?? ""}, ${"Europe/London"},
            ${event.id}, ${mailbox}, ${teamsJoinUrl},
            ${"[]"}, ${now}, ${user.id}, ${now}, ${now}
          )
        `;
        created++;
      } else {
        const previousStatus = existing.status as string;
        const statusChanged = crmStatus !== previousStatus &&
          // Don't overwrite a manually set cancelled/completed status from Outlook
          previousStatus !== "cancelled" &&
          previousStatus !== "completed" &&
          previousStatus !== "no_show";

        if (statusChanged) {
          await sql`
            UPDATE "Booking" SET
              title                      = ${event.subject},
              "teamsJoinUrl"             = ${teamsJoinUrl},
              "attendeeResponseStatus"   = ${attendeeResponse ?? null},
              status                     = ${crmStatus},
              "outlookResponseUpdatedAt" = ${now},
              "lastSyncedAt"             = ${now},
              "updatedAt"                = ${now}
            WHERE "microsoftEventId" = ${event.id}
          `;
          statusUpdated++;
        } else {
          await sql`
            UPDATE "Booking" SET
              title          = ${event.subject},
              "teamsJoinUrl" = ${teamsJoinUrl},
              "lastSyncedAt" = ${now},
              "updatedAt"    = ${now}
            WHERE "microsoftEventId" = ${event.id}
          `;
        }
        updated++;
      }
    } catch (err) {
      errors.push(`Event ${event.id}: ${err}`);
    }
  }

  return NextResponse.json({
    ok: true,
    synced: events.length,
    created,
    updated,
    statusUpdated,
    errors,
    dateRange: { start, end },
  });
}
