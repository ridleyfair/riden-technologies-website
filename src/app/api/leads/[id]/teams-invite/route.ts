import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import {
  createTeamsCalendarEvent,
  updateTeamsCalendarEvent,
  deleteTeamsCalendarEvent,
  buildStartEnd,
  isMsConfigured,
} from "@/lib/ms-graph";
import { sendBookingConfirmation, isSendGridConfigured } from "@/lib/sendgrid";

// ── Shared helpers ────────────────────────────────────────────────────────────

async function getLead(id: string) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM "Lead" WHERE id = ${id} LIMIT 1`;
  return rows[0] as Record<string, unknown> | undefined;
}

function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── POST — send Teams invite ──────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    if (!isMsConfigured()) {
      return NextResponse.json(
        { error: "Microsoft Graph is not configured on this server. Add the required environment variables." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      date,
      time,
      durationMinutes = 30,
      timezone = "Europe/London",
      title = "Riden Technologies Strategy Call",
      notes = "",
      forceResend = false,
    } = body;

    // Validate required fields
    if (!date) return NextResponse.json({ error: "Meeting date is required" }, { status: 400 });
    if (!time) return NextResponse.json({ error: "Meeting time is required" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Invalid date format (use YYYY-MM-DD)" }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "Invalid time format (use HH:mm)" }, { status: 400 });

    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const email = lead.email as string;
    if (!email) return NextResponse.json({ error: "This lead has no email address" }, { status: 400 });
    if (!validateEmailFormat(email)) return NextResponse.json({ error: "Lead email address is invalid" }, { status: 400 });

    // Duplicate invite prevention
    if (lead.bookingStatus === "invite_sent" && !forceResend) {
      return NextResponse.json(
        {
          error: "An invite has already been sent for this lead. Set forceResend: true to send a new one.",
          code: "DUPLICATE_INVITE",
          teamsJoinUrl: lead.teamsJoinUrl,
          meetingDate: lead.meetingDate,
          meetingTime: lead.meetingTime,
        },
        { status: 409 }
      );
    }

    // Cancel existing calendar event before creating a new one (force resend)
    if (forceResend && lead.microsoftEventId) {
      try {
        await deleteTeamsCalendarEvent(lead.microsoftEventId as string);
      } catch {
        // Log but don't fail — old event may already be deleted
      }
    }

    const { startIso, endIso } = buildStartEnd(date, time, durationMinutes);

    const event = await createTeamsCalendarEvent({
      leadName: lead.name as string,
      leadEmail: email,
      company: lead.company as string | null,
      service: lead.service as string | null,
      title,
      startIso,
      endIso,
      timezone,
      notes,
    });

    const now = new Date();
    const startDt = new Date(`${date}T${time}:00`);
    const endDt = new Date(startDt.getTime() + durationMinutes * 60_000);

    const sql = getDb();
    await sql`
      UPDATE "Lead" SET
        "bookingStatus"      = 'invite_sent',
        "meetingTitle"       = ${title},
        "meetingDate"        = ${date},
        "meetingTime"        = ${time},
        "meetingStartTime"   = ${startDt},
        "meetingEndTime"     = ${endDt},
        "meetingTimezone"    = ${timezone},
        "meetingDurationMins"= ${durationMinutes},
        "microsoftEventId"   = ${event.id},
        "teamsJoinUrl"       = ${event.teamsJoinUrl},
        "inviteSentAt"       = ${now},
        "bookingNotes"       = ${notes},
        "bookedByUserId"     = ${user.id},
        status               = 'contacted',
        "updatedAt"          = ${now}
      WHERE id = ${id}
    `;

    let emailError: string | null = null;
    if (isSendGridConfigured()) {
      try {
        const durationLabel = durationMinutes >= 60
          ? `${durationMinutes / 60} hour${durationMinutes > 60 ? "s" : ""}`
          : `${durationMinutes} minutes`;
        await sendBookingConfirmation({
          to: email,
          toName: lead.name as string,
          title,
          date,
          time,
          duration: durationLabel,
          meetingType: "video",
          teamsJoinUrl: event.teamsJoinUrl,
          notes: notes || null,
          timezone,
        });
      } catch (e) {
        emailError = e instanceof Error ? e.message : "Failed to send confirmation email";
      }
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
      teamsJoinUrl: event.teamsJoinUrl,
      bookingStatus: "invite_sent",
      ...(emailError ? { emailError } : {}),
    });
  } catch (err) {
    console.error("Teams invite error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send Teams invite" },
      { status: 500 }
    );
  }
}

// ── PATCH — reschedule (update existing calendar event) ───────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      date,
      time,
      durationMinutes = 30,
      timezone = "Europe/London",
      title,
    } = body;

    if (!date || !time) {
      return NextResponse.json({ error: "Date and time are required" }, { status: 400 });
    }

    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (!lead.microsoftEventId) {
      return NextResponse.json({ error: "No existing calendar event to update" }, { status: 400 });
    }

    const { startIso, endIso } = buildStartEnd(date, time, durationMinutes);
    const resolvedTitle = title ?? (lead.meetingTitle as string) ?? "Riden Technologies Strategy Call";

    await updateTeamsCalendarEvent(lead.microsoftEventId as string, {
      title: resolvedTitle,
      startIso,
      endIso,
      timezone,
    });

    const startDt = new Date(`${date}T${time}:00`);
    const endDt = new Date(startDt.getTime() + durationMinutes * 60_000);
    const now = new Date();

    const sql = getDb();
    await sql`
      UPDATE "Lead" SET
        "bookingStatus"      = 'invite_sent',
        "meetingTitle"       = ${resolvedTitle},
        "meetingDate"        = ${date},
        "meetingTime"        = ${time},
        "meetingStartTime"   = ${startDt},
        "meetingEndTime"     = ${endDt},
        "meetingDurationMins"= ${durationMinutes},
        "updatedAt"          = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, bookingStatus: "invite_sent" });
  } catch (err) {
    console.error("Teams reschedule error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reschedule meeting" },
      { status: 500 }
    );
  }
}

// ── DELETE — cancel meeting ───────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (lead.microsoftEventId) {
      await deleteTeamsCalendarEvent(lead.microsoftEventId as string);
    }

    const now = new Date();
    const sql = getDb();
    await sql`
      UPDATE "Lead" SET
        "bookingStatus"    = 'cancelled',
        "microsoftEventId" = NULL,
        "teamsJoinUrl"     = NULL,
        "updatedAt"        = ${now}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, bookingStatus: "cancelled" });
  } catch (err) {
    console.error("Teams cancel error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cancel meeting" },
      { status: 500 }
    );
  }
}
