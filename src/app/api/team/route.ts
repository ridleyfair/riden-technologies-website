import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  try {
    const members = await sql`SELECT id, name, email, role FROM "User" ORDER BY "createdAt" ASC`;
    const invites = await sql`SELECT * FROM "TeamInvite" ORDER BY "createdAt" DESC`;
    return NextResponse.json({ members, invites });
  } catch {
    try {
      const invites = await sql`SELECT * FROM "TeamInvite" ORDER BY "createdAt" DESC`;
      return NextResponse.json({ members: [], invites });
    } catch {
      return NextResponse.json({ members: [], invites: [] });
    }
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { name, email, role = "member" } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO "TeamInvite" (id, name, email, role, status, "createdAt")
      VALUES (${id}, ${name}, ${email}, ${role}, 'pending', ${now})
    `;

    const [invite] = await sql`SELECT * FROM "TeamInvite" WHERE id = ${id}`;
    return NextResponse.json(invite, { status: 201 });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
