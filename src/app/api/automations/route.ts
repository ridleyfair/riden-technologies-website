import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  try {
    const automations = await sql`SELECT * FROM "Automation" ORDER BY "createdAt" ASC`;
    return NextResponse.json(automations);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { name, trigger, actions = 1, status = "active" } = body;

    if (!name || !trigger) {
      return NextResponse.json({ error: "Name and trigger are required" }, { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO "Automation" (id, name, trigger, actions, status, "runsTotal", "runsToday", "createdAt")
      VALUES (${id}, ${name}, ${trigger}, ${actions}, ${status}, 0, 0, ${now})
    `;

    const [automation] = await sql`SELECT * FROM "Automation" WHERE id = ${id}`;
    return NextResponse.json(automation, { status: 201 });
  } catch (err) {
    console.error("Automation create error:", err);
    return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
  }
}
