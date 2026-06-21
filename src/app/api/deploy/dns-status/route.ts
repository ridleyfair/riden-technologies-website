import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

function cfHeaders() {
  return {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN ?? ""}`,
    "Content-Type": "application/json",
  };
}

async function checkDnsRecord(zoneId: string, hostname: string): Promise<boolean> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(hostname)}`,
    { headers: cfHeaders() }
  );
  const data = await res.json() as { result?: unknown[] };
  return Array.isArray(data.result) && data.result.length > 0;
}

async function checkSsl(zoneId: string): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/ssl/certificate_packs`,
    { headers: cfHeaders() }
  );
  const data = await res.json() as { result?: Array<{ status: string }> };
  const pack = data.result?.[0];
  return pack?.status ?? "unknown";
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const siteId = req.nextUrl.searchParams.get("siteId");
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const sql = getDb();
  const [site] = await sql`SELECT * FROM "GeneratedSite" WHERE id = ${siteId} LIMIT 1`;
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId  = site.cloudflareZoneId as string | null;

  if (!cfToken) {
    return NextResponse.json({
      ok: false,
      error: "CLOUDFLARE_API_TOKEN not configured",
      dnsStatus: site.dnsStatus,
      sslStatus: site.sslStatus,
    });
  }

  if (!zoneId) {
    return NextResponse.json({
      ok: false,
      error: "No Cloudflare zone linked. Assign domain first.",
      dnsStatus: site.dnsStatus,
      sslStatus: site.sslStatus,
    });
  }

  const checks: Record<string, boolean> = {};
  if (site.apexDomain) checks[site.apexDomain as string] = await checkDnsRecord(zoneId, site.apexDomain as string);
  if (site.wwwDomain)  checks[site.wwwDomain  as string] = await checkDnsRecord(zoneId, site.wwwDomain  as string);

  const allDnsActive = Object.values(checks).every(Boolean);
  const sslCertStatus = await checkSsl(zoneId);
  const sslActive = sslCertStatus === "active";

  const dnsStatus = allDnsActive ? "active" : "pending";
  const sslStatus = sslActive    ? "active" : sslCertStatus;

  // When both DNS and SSL are active, ensure deployment status is live
  const deploymentStatus = allDnsActive && sslActive ? "live" : site.deploymentStatus;

  await sql`
    UPDATE "GeneratedSite" SET
      "dnsStatus"         = ${dnsStatus},
      "sslStatus"         = ${sslStatus},
      "deploymentStatus"  = ${deploymentStatus as string},
      "updatedAt"         = NOW()
    WHERE id = ${siteId}
  `;

  return NextResponse.json({
    ok: true,
    dnsChecks: checks,
    dnsStatus,
    sslStatus,
    sslCertStatus,
  });
}
