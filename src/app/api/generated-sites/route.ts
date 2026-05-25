import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// GET /api/generated-sites — list all (no specJson)
export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  const rows = await sql`
    SELECT
      id,
      "projectId",
      "clientName",
      "businessName",
      industry,
      tier,
      username,
      password,
      "previewUrl",
      status,
      "createdAt"
    FROM "GeneratedSite"
    ORDER BY "createdAt" DESC
  `;

  return NextResponse.json(rows);
}
