import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const leads = await sql`SELECT * FROM "Lead" ORDER BY "createdAt" DESC`;
    return NextResponse.json(leads);
  } catch (err) {
    console.error("Leads fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
