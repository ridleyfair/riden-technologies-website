import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

async function addVercelDomain(domain: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  const token     = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId    = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) return { ok: false, error: "VERCEL_TOKEN or VERCEL_PROJECT_ID not configured" };

  const url = `https://api.vercel.com/v10/projects/${projectId}/domains${teamId ? `?teamId=${teamId}` : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain }),
  });
  const data = await res.json() as Record<string, unknown>;

  if (res.ok) return { ok: true, id: data.name as string };
  // Domain already added is fine
  if ((data.error as Record<string, unknown>)?.code === "domain_already_in_use") return { ok: true };
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

  if (!site.liveDomain) {
    return NextResponse.json({ error: "Assign a domain before publishing" }, { status: 400 });
  }

  const vercelResults: string[] = [];
  let deploymentStatus = "live";
  let sslStatus = site.sslStatus ?? "pending";

  // Add domains to Vercel
  const domainsToAdd: string[] = [];
  if (site.publishTarget !== "root") domainsToAdd.push(site.wwwDomain as string);
  if (site.publishTarget !== "www")  domainsToAdd.push(site.apexDomain as string);

  for (const domain of domainsToAdd.filter(Boolean)) {
    const result = await addVercelDomain(domain);
    if (result.ok) {
      vercelResults.push(`Added ${domain} to Vercel`);
    } else {
      vercelResults.push(`Warning: ${result.error}`);
      if (result.error?.includes("not configured")) {
        deploymentStatus = "live"; // Still mark live — hosting may be manual
      }
    }
  }

  // Copy specJson → publishedSpecJson to track live vs draft
  await sql`
    UPDATE "GeneratedSite" SET
      "deploymentStatus"  = ${deploymentStatus},
      "dnsStatus"         = 'active',
      "sslStatus"         = ${sslStatus},
      "lastPublishedAt"   = NOW(),
      "publishedSpecJson" = "specJson",
      "draftSpecJson"     = NULL,
      "deploymentError"   = NULL,
      "updatedAt"         = NOW()
    WHERE id = ${siteId}
  `;

  return NextResponse.json({
    ok: true,
    deploymentStatus,
    liveDomain: site.liveDomain,
    liveUrl: `https://${site.liveDomain}`,
    vercelResults,
  });
}
