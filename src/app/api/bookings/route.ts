import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import {
  isMsConfigured,
  createTeamsCalendarEvent,
  buildStartEnd,
  getSharedMailbox,
} from "@/lib/ms-graph";
import { isSendGridConfigured, sendBookingConfirmation } from "@/lib/sendgrid";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  try {
    const bookings = await sql`SELECT * FROM "Booking" ORDER BY date ASC, time ASC`;
    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const {
      title,
      client,
      clientEmail = "",
      leadId = null,
      date,
      time,
      duration = "30 min",
      durationMinutes = 30,
      type = "video",
      status = "confirmed",
      notes = "",
      timezone = "Europe/London",
      createTeamsMeeting = false,
    } = body;

    if (!title || !client || !date || !time) {
      return NextResponse.json(
        { error: "Title, client, date and time are required" },
        { status: 400 }
      );
    }

    const { startIso, endIso } = buildStartEnd(date, time, Number(durationMinutes));
    const startTime = new Date(startIso + "Z");
    const endTime = new Date(endIso + "Z");

    let microsoftEventId: string | null = null;
    let teamsJoinUrl: string | null = null;
    let outlookCalendarEmail: string | null = null;
    let graphError: string | null = null;
    let inviteSentAt: Date | null = null;

    if (createTeamsMeeting && clientEmail && isMsConfigured()) {
      try {
        const created = await createTeamsCalendarEvent({
          leadName: client,
          leadEmail: clientEmail,
          title,
          startIso,
          endIso,
          timezone,
          notes: notes || undefined,
        });
        microsoftEventId = created.id;
        teamsJoinUrl = created.teamsJoinUrl || null;
        outlookCalendarEmail = getSharedMailbox();
        inviteSentAt = new Date();
      } catch (err) {
        graphError = String(err);
        console.error("MS Graph booking create error:", err);
      }
    }

    // Teams invite sent → awaiting response; manual booking → use whatever was passed
    const finalStatus = (createTeamsMeeting && microsoftEventId) ? "awaiting_response" : status;

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO "Booking" (
        id, title, client, "clientEmail", "leadId",
        date, time, duration, "durationMinutes",
        type, status, notes, timezone,
        "startTime", "endTime",
        "microsoftEventId", "outlookCalendarEmail", "teamsJoinUrl",
        "inviteSentAt", attendees, "createdByUserId", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${title}, ${client}, ${clientEmail || null}, ${leadId},
        ${date}, ${time}, ${duration}, ${Number(durationMinutes)},
        ${type}, ${finalStatus}, ${notes || null}, ${timezone},
        ${startTime}, ${endTime},
        ${microsoftEventId}, ${outlookCalendarEmail}, ${teamsJoinUrl},
        ${inviteSentAt}, ${"[]"}, ${user.id}, ${now}, ${now}
      )
    `;

    const [booking] = await sql`SELECT * FROM "Booking" WHERE id = ${id}`;

    // Send client confirmation email via SendGrid (bypasses blocked shared mailbox IP)
    let emailError: string | null = null;
    let emailSent = false;
    if (clientEmail && isSendGridConfigured()) {
      try {
        await sendBookingConfirmation({
          to: clientEmail,
          toName: client,
          title,
          date,
          time,
          duration,
          meetingType: type,
          teamsJoinUrl: teamsJoinUrl ?? null,
          notes: notes || null,
          timezone,
        });
        emailSent = true;
      } catch (err) {
        emailError = String(err);
        console.error("SendGrid email error:", err);
      }
    } else if (clientEmail && !isSendGridConfigured()) {
      emailError = "SendGrid not configured — SENDGRID_API_KEY missing";
    }

    return NextResponse.json({ ...booking, graphError, emailError, emailSent }, { status: 201 });
  } catch (err) {
    console.error("Booking create error:", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
