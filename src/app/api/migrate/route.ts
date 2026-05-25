import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  const ran: string[] = [];
  const failed: { step: string; error: string }[] = [];

  async function step(name: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      ran.push(name);
    } catch (e) {
      failed.push({ step: name, error: String(e) });
    }
  }

  // Lead additions
  await step("Lead.phone", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS phone TEXT`);
  await step("Lead.value", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS value FLOAT DEFAULT 0`);
  await step("Lead.notes", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS notes TEXT`);

  // Client additions
  await step("Client.phone", () => sql`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS phone TEXT`);
  await step("Client.websites", () => sql`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS websites INTEGER DEFAULT 0`);
  await step("Client.notes", () => sql`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS notes TEXT`);

  // Invoice additions
  await step("Invoice.clientId", () => sql`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "clientId" TEXT`);
  await step("Invoice.clientEmail", () => sql`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "clientEmail" TEXT`);
  await step("Invoice.taxRate", () => sql`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "taxRate" FLOAT DEFAULT 0`);
  await step("Invoice.discount", () => sql`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS discount FLOAT DEFAULT 0`);
  await step("Invoice.notes", () => sql`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS notes TEXT`);
  await step("Invoice.paidAt", () => sql`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ`);
  await step("Invoice.sentAt", () => sql`ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMPTZ`);

  // InvoiceLineItem table
  await step("create InvoiceLineItem", () => sql`
    CREATE TABLE IF NOT EXISTS "InvoiceLineItem" (
      id TEXT PRIMARY KEY,
      "invoiceId" TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity FLOAT NOT NULL DEFAULT 1,
      "unitPrice" FLOAT NOT NULL DEFAULT 0,
      amount FLOAT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await step("idx InvoiceLineItem.invoiceId", () => sql`
    CREATE INDEX IF NOT EXISTS "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId")
  `);

  // WebEvent table for analytics
  await step("create WebEvent", () => sql`
    CREATE TABLE IF NOT EXISTS "WebEvent" (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      path TEXT NOT NULL,
      referrer TEXT,
      source TEXT,
      medium TEXT,
      campaign TEXT,
      device TEXT,
      "sessionId" TEXT,
      "visitorId" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await step("idx WebEvent.type", () => sql`CREATE INDEX IF NOT EXISTS "WebEvent_type_idx" ON "WebEvent"(type)`);
  await step("idx WebEvent.createdAt", () => sql`CREATE INDEX IF NOT EXISTS "WebEvent_createdAt_idx" ON "WebEvent"("createdAt")`);
  await step("idx WebEvent.visitorId", () => sql`CREATE INDEX IF NOT EXISTS "WebEvent_visitorId_idx" ON "WebEvent"("visitorId")`);

  // ActiveSession table for live visitor count
  await step("create ActiveSession", () => sql`
    CREATE TABLE IF NOT EXISTS "ActiveSession" (
      "sessionId" TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      "lastSeen" TIMESTAMPTZ DEFAULT NOW(),
      device TEXT,
      "visitorId" TEXT
    )
  `);
  await step("idx ActiveSession.lastSeen", () => sql`
    CREATE INDEX IF NOT EXISTS "ActiveSession_lastSeen_idx" ON "ActiveSession"("lastSeen")
  `);

  // Project table — created by Prisma migration; just ensure extra columns exist
  await step("create Project", () => sql`
    CREATE TABLE IF NOT EXISTS "Project" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "clientName" TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'planning',
      budget FLOAT DEFAULT 0,
      spent FLOAT DEFAULT 0,
      progress INTEGER DEFAULT 0,
      "dueDate" TIMESTAMPTZ,
      notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await step("Project.notes", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS notes TEXT`);
  await step("Project.completedAt", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ`);
  await step("idx Project.createdAt", () => sql`
    CREATE INDEX IF NOT EXISTS "Project_createdAt_idx" ON "Project"("createdAt")
  `);

  // Client recurring revenue columns
  await step("Client.monthlyRate", () => sql`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "monthlyRate" FLOAT DEFAULT 0`);
  await step("Client.activeFrom", () => sql`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "activeFrom" TIMESTAMPTZ`);
  await step("Client.profit", () => sql`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS profit FLOAT DEFAULT 0`);

  // Booking table
  await step("create Booking", () => sql`
    CREATE TABLE IF NOT EXISTS "Booking" (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration TEXT DEFAULT '30 min',
      type TEXT DEFAULT 'video',
      status TEXT DEFAULT 'confirmed',
      notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await step("idx Booking.date", () => sql`CREATE INDEX IF NOT EXISTS "Booking_date_idx" ON "Booking"(date)`);

  // Booking — Outlook/Teams columns
  await step("Booking.clientEmail", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "clientEmail" TEXT`);
  await step("Booking.leadId", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "leadId" TEXT`);
  await step("Booking.startTime", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMPTZ`);
  await step("Booking.endTime", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMPTZ`);
  await step("Booking.timezone", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/London'`);
  await step("Booking.durationMinutes", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER DEFAULT 30`);
  await step("Booking.microsoftEventId", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "microsoftEventId" TEXT`);
  await step("Booking.outlookCalendarEmail", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "outlookCalendarEmail" TEXT`);
  await step("Booking.teamsJoinUrl", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "teamsJoinUrl" TEXT`);
  await step("Booking.attendees", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS attendees TEXT DEFAULT '[]'`);
  await step("Booking.lastSyncedAt", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMPTZ`);
  await step("Booking.createdByUserId", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT`);
  await step("idx Booking.microsoftEventId", () => sql`
    CREATE INDEX IF NOT EXISTS "Booking_microsoftEventId_idx" ON "Booking"("microsoftEventId")
    WHERE "microsoftEventId" IS NOT NULL
  `);

  // Website table
  await step("create Website", () => sql`
    CREATE TABLE IF NOT EXISTS "Website" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      "clientId" TEXT,
      url TEXT NOT NULL,
      status TEXT DEFAULT 'building',
      tier TEXT DEFAULT 'starter',
      template TEXT DEFAULT '',
      views INTEGER DEFAULT 0,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Automation table
  await step("create Automation", () => sql`
    CREATE TABLE IF NOT EXISTS "Automation" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger TEXT NOT NULL,
      actions INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      "runsTotal" INTEGER DEFAULT 0,
      "runsToday" INTEGER DEFAULT 0,
      "lastRun" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // TeamInvite table
  await step("create TeamInvite", () => sql`
    CREATE TABLE IF NOT EXISTS "TeamInvite" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending',
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // User profile extensions
  await step("User.phone", () => sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone TEXT`);
  await step("User.company", () => sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS company TEXT`);

  // Lead — Teams booking columns
  await step("Lead.bookingStatus", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "bookingStatus" TEXT DEFAULT 'not_scheduled'`);
  await step("Lead.meetingTitle", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "meetingTitle" TEXT`);
  await step("Lead.meetingDate", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "meetingDate" TEXT`);
  await step("Lead.meetingTime", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "meetingTime" TEXT`);
  await step("Lead.meetingStartTime", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "meetingStartTime" TIMESTAMPTZ`);
  await step("Lead.meetingEndTime", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "meetingEndTime" TIMESTAMPTZ`);
  await step("Lead.meetingTimezone", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "meetingTimezone" TEXT DEFAULT 'Europe/London'`);
  await step("Lead.meetingDurationMins", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "meetingDurationMins" INTEGER DEFAULT 30`);
  await step("Lead.microsoftEventId", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "microsoftEventId" TEXT`);
  await step("Lead.teamsJoinUrl", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "teamsJoinUrl" TEXT`);
  await step("Lead.inviteSentAt", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "inviteSentAt" TIMESTAMPTZ`);
  await step("Lead.bookedByUserId", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "bookedByUserId" TEXT`);
  await step("Lead.bookingNotes", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "bookingNotes" TEXT`);
  await step("Lead.responseToken", () => sql`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "responseToken" TEXT`);

  // Booking — RSVP / status tracking columns
  await step("Booking.inviteSentAt", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "inviteSentAt" TIMESTAMPTZ`);
  await step("Booking.attendeeResponseStatus", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "attendeeResponseStatus" TEXT`);
  await step("Booking.outlookResponseUpdatedAt", () => sql`ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "outlookResponseUpdatedAt" TIMESTAMPTZ`);

  // GeneratedSite table for Website Studio
  await step("create GeneratedSite", () => sql`
    CREATE TABLE IF NOT EXISTS "GeneratedSite" (
      id TEXT PRIMARY KEY,
      "projectId" TEXT,
      "clientName" TEXT NOT NULL,
      "businessName" TEXT NOT NULL,
      industry TEXT DEFAULT 'professional',
      tier TEXT DEFAULT 'pro_plus',
      "specJson" TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      "previewUrl" TEXT,
      status TEXT DEFAULT 'ready',
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Project brief columns
  await step("Project.phone", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS phone TEXT`);
  await step("Project.email", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS email TEXT`);
  await step("Project.city", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS city TEXT`);
  await step("Project.postcode", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS postcode TEXT`);
  await step("Project.industry", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'trades'`);
  await step("Project.services", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS services TEXT`);
  await step("Project.about", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS about TEXT`);
  await step("Project.accreditations", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS accreditations TEXT`);
  await step("Project.socialFacebook", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "socialFacebook" TEXT`);
  await step("Project.socialInstagram", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "socialInstagram" TEXT`);
  await step("Project.openingHours", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "openingHours" TEXT`);
  await step("Project.reviewsJson", () => sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "reviewsJson" TEXT DEFAULT '[]'`);

  return NextResponse.json({
    ok: true,
    ran,
    failed,
    message: `Migration complete — ${ran.length} steps succeeded, ${failed.length} failed.`,
  });
}
