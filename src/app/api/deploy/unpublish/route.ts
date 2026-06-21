import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

async function removeVercelDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  const token     = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId    = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) return { ok: false, error: "VERCEL_TOKEN or VERCEL_PROJECT_ID not configured" };

  const url = `https://api.vercel.com/v10/projects/${projectId}/domains/${encodeURIComponent(domain)}${teamId ? `?teamId=${teamId}` : ""}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok || res.status === 404) return { ok: true };
  const data = await res.json() as Record<string, unknown>;
  return { ok: false, error: (data.error as Record<string, unknown>)?.message as string ?? "Vercel error" };
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { siteId } = await req.json() as { siteId: string };
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const sql = getDb();
  const [site] = await sql`SELECT * FROM "GeneratedSite" WHERE id = ${siteId} LIMIT 1`;
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const results: string[] = [];

  // Remove both apex and www from Vercel
  const domains: string[] = [site.apexDomain, site.wwwDomain].filter(Boolean) as string[];
  for (const domain of domains) {
    const result = await removeVercelDomain(domain);
    results.push(result.ok ? `Removed ${domain} from Vercel` : `Warning: ${result.error}`);
  }

  await sql`
    UPDATE "GeneratedSite" SET
      "deploymentStatus" = 'preview_ready',
      "sslStatus"        = 'pending',
      "updatedAt"        = NOW()
    WHERE id = ${siteId}
  `;

  return NextResponse.json({ ok: true, results });
}
