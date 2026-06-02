import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const ids = req.nextUrl.searchParams.get("ids") ?? "";
  const idList = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
  if (idList.length === 0) return NextResponse.json([]);

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM "CheckatradeEnrichment"
      WHERE business_id = ANY(${idList})
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
