import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { googleSiteVerification } = (await req.json()) as { googleSiteVerification?: string };
  if (!googleSiteVerification) {
    return NextResponse.json({ error: "googleSiteVerification is required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT "specJson" FROM "GeneratedSite" WHERE id = ${id} LIMIT 1
  ` as Array<{ specJson: string }>;

  if (!rows.length) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const spec = JSON.parse(rows[0].specJson) as Record<string, unknown>;
  const seo  = (spec.seo ?? {}) as Record<string, unknown>;
  seo.googleSiteVerification = googleSiteVerification;
  spec.seo = seo;

  await sql`
    UPDATE "GeneratedSite"
    SET "specJson" = ${JSON.stringify(spec)}, "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
