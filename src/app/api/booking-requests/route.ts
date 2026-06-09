import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const siteId = req.nextUrl.searchParams.get("siteId");
  const status = req.nextUrl.searchParams.get("status");

  const sql = getDb();
  try {
    let rows;
    if (siteId && status) {
      rows = await sql`
        SELECT * FROM "BeautyBookingRequest"
        WHERE "siteId" = ${siteId} AND status = ${status}
        ORDER BY "createdAt" DESC
      `;
    } else if (siteId) {
      rows = await sql`
        SELECT * FROM "BeautyBookingRequest"
        WHERE "siteId" = ${siteId}
        ORDER BY "createdAt" DESC
      `;
    } else if (status) {
      rows = await sql`
        SELECT * FROM "BeautyBookingRequest"
        WHERE status = ${status}
        ORDER BY "createdAt" DESC
      `;
    } else {
      rows = await sql`
        SELECT * FROM "BeautyBookingRequest"
        ORDER BY "createdAt" DESC
      `;
    }
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
