import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  try {
    await sql`
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
    `;
    return NextResponse.json({ ok: true, message: "GeneratedSite table ready." });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
