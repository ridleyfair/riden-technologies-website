import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// One-off: injects Google Search Console verification into a site's specJson.
// GET /api/set-google-verification?siteId=xxx&code=yyy

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  const code   = req.nextUrl.searchParams.get("code");

  if (!siteId || !code) {
    return NextResponse.json({ error: "siteId and code are required" }, { status: 400 });
  }

  const sql  = getDb();
  const rows = await sql`
    SELECT "specJson" FROM "GeneratedSite" WHERE id = ${siteId} LIMIT 1
  ` as Array<{ specJson: string }>;

  if (!rows.length) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const spec = JSON.parse(rows[0].specJson) as Record<string, unknown>;
  const seo  = (spec.seo ?? {}) as Record<string, unknown>;
  seo.googleSiteVerification = code;
  spec.seo = seo;

  await sql`
    UPDATE "GeneratedSite"
    SET "specJson" = ${JSON.stringify(spec)}, "updatedAt" = NOW()
    WHERE id = ${siteId}
  `;

  return NextResponse.json({ ok: true, siteId, googleSiteVerification: code });
}
