import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  try {
    const clients = await sql`
      SELECT * FROM "Client" ORDER BY "createdAt" DESC
    `;
    return NextResponse.json(clients);
  } catch (err) {
    console.error("Clients fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { name, email = "", company, phone, tier = "starter", status = "active", monthlyRate = 0, profit = 0 } = body;

    if (!name || !company) {
      return NextResponse.json({ error: "Name and company are required" }, { status: 400 });
    }

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    const [client] = await sql`
      INSERT INTO "Client" (id, name, email, company, phone, tier, status, revenue, websites, "monthlyRate", profit, "activeFrom", "createdAt", "updatedAt")
      VALUES (
        ${id}, ${name}, ${email}, ${company},
        ${phone ?? null}, ${tier}, ${status},
        ${profit}, 0, ${Number(monthlyRate)}, ${profit},
        ${status === "active" ? now : null},
        ${now}, ${now}
      )
      RETURNING *
    `;
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error("Client create error:", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
