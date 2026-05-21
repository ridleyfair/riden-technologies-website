import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  try {
    const websites = await sql`SELECT * FROM "Website" ORDER BY "createdAt" DESC`;
    return NextResponse.json(websites);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { name, client, clientId = null, url, status = "building", tier = "starter", template = "" } = body;

    if (!name || !client || !url) {
      return NextResponse.json({ error: "Name, client and URL are required" }, { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO "Website" (id, name, client, "clientId", url, status, tier, template, views, "createdAt")
      VALUES (${id}, ${name}, ${client}, ${clientId}, ${url}, ${status}, ${tier}, ${template}, 0, ${now})
    `;

    const [website] = await sql`SELECT * FROM "Website" WHERE id = ${id}`;
    return NextResponse.json(website, { status: 201 });
  } catch (err) {
    console.error("Website create error:", err);
    return NextResponse.json({ error: "Failed to create website" }, { status: 500 });
  }
}
