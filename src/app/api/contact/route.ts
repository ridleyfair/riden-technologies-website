import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, service, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO "Lead" (id, name, email, company, service, message, status, source, score, "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${email}, ${company || null}, ${service || null}, ${message}, 'new', 'website', 0, ${now}, ${now})
    `;

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }
}
