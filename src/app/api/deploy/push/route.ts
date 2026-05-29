import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// POST /api/deploy/push
// Updates the live specJson for an already-published site.
// Keeps the same siteId, domain, and DNS records — no reassignment needed.
export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { siteId } = await req.json() as { siteId: string };
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const sql = getDb();
  const [site] = await sql`SELECT * FROM "GeneratedSite" WHERE id = ${siteId} LIMIT 1`;
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  if (site.deploymentStatus !== "live" && site.deploymentStatus !== "update_available") {
    return NextResponse.json({ error: "Site must be live before pushing updates" }, { status: 400 });
  }

  // Promote draftSpecJson → specJson (if a draft exists), else keep current specJson
  const hasDraft = !!site.draftSpecJson;

  await sql`
    UPDATE "GeneratedSite" SET
      "specJson"          = COALESCE("draftSpecJson", "specJson"),
      "publishedSpecJson" = COALESCE("draftSpecJson", "specJson"),
      "draftSpecJson"     = NULL,
      "deploymentStatus"  = 'live',
      "lastPublishedAt"   = NOW(),
      "deploymentError"   = NULL,
      "updatedAt"         = NOW()
    WHERE id = ${siteId}
  `;

  return NextResponse.json({
    ok:       true,
    siteId,
    liveUrl:  site.liveDomain ? `https://${site.liveDomain}` : site.previewUrl,
    promoted: hasDraft,
    message:  hasDraft ? "Draft promoted to live." : "Current spec republished.",
  });
}
