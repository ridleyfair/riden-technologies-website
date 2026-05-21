import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

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
    const { title, client, date, time, duration = "30 min", type = "video", status = "confirmed", notes = "" } = body;

    if (!title || !client || !date || !time) {
      return NextResponse.json({ error: "Title, client, date and time are required" }, { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO "Booking" (id, title, client, date, time, duration, type, status, notes, "createdAt", "updatedAt")
      VALUES (${id}, ${title}, ${client}, ${date}, ${time}, ${duration}, ${type}, ${status}, ${notes}, ${now}, ${now})
    `;

    const [booking] = await sql`SELECT * FROM "Booking" WHERE id = ${id}`;
    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    console.error("Booking create error:", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
