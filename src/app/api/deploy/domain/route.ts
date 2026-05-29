import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

function cfHeaders() {
  return {
    "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN ?? ""}`,
    "Content-Type": "application/json",
  };
}

async function cfFetch(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { ...cfHeaders(), ...(init?.headers ?? {}) },
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function findCfZone(domain: string): Promise<string | null> {
  const parts = domain.replace(/^www\./, "").split(".");
  // try progressively shorter apex: e.g. sub.example.co.uk → example.co.uk → co.uk
  for (let i = 0; i < parts.length - 1; i++) {
    const apex = parts.slice(i).join(".");
    const data = await cfFetch(`/zones?name=${encodeURIComponent(apex)}&status=active`);
    const results = data.result as Array<{ id: string }> | undefined;
    if (Array.isArray(results) && results.length > 0) return results[0].id;
  }
  return null;
}

async function upsertDnsRecord(
  zoneId: string,
  type: string,
  name: string,
  content: string,
  proxied = true
) {
  // Check for existing record
  const existing = await cfFetch(
    `/zones/${zoneId}/dns_records?type=${type}&name=${encodeURIComponent(name)}`
  );
  const records = existing.result as Array<{ id: string }> | undefined;

  if (Array.isArray(records) && records.length > 0) {
    await cfFetch(`/zones/${zoneId}/dns_records/${records[0].id}`, {
      method: "PUT",
      body: JSON.stringify({ type, name, content, proxied, ttl: 1 }),
    });
  } else {
    await cfFetch(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({ type, name, content, proxied, ttl: 1 }),
    });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { siteId, apexDomain, wwwDomain, publishTarget = "both", createDns = true } =
    await req.json() as {
      siteId: string;
      apexDomain: string;
      wwwDomain?: string;
      publishTarget?: string;
      createDns?: boolean;
    };

  if (!siteId || !apexDomain) {
    return NextResponse.json({ error: "siteId and apexDomain are required" }, { status: 400 });
  }

  const cleanApex = apexDomain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  const cleanWww  = wwwDomain
    ? wwwDomain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase()
    : `www.${cleanApex}`;

  const sql = getDb();

  // Check domain not already assigned to a different site
  const conflict = await sql`
    SELECT id FROM "GeneratedSite"
    WHERE ("liveDomain" = ${cleanApex} OR "liveDomain" = ${cleanWww}
        OR "wwwDomain"  = ${cleanApex} OR "wwwDomain"  = ${cleanWww})
      AND id != ${siteId}
    LIMIT 1
  `;
  if (conflict.length > 0) {
    return NextResponse.json({ error: "Domain already assigned to another site" }, { status: 409 });
  }

  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cnameTarget = process.env.HOSTING_CNAME_TARGET ?? "cname.vercel-dns.com";

  let cloudflareZoneId: string | null = null;
  const dnsResults: string[] = [];
  let dnsStatus = "pending";

  if (createDns && cfToken) {
    try {
      cloudflareZoneId = await findCfZone(cleanApex);

      if (!cloudflareZoneId) {
        dnsResults.push(`Zone not found in Cloudflare for ${cleanApex}. Ensure the domain uses Cloudflare nameservers.`);
        dnsStatus = "zone_not_found";
      } else {
        // www CNAME
        if (publishTarget !== "root") {
          await upsertDnsRecord(cloudflareZoneId, "CNAME", cleanWww, cnameTarget);
          dnsResults.push(`Created CNAME ${cleanWww} → ${cnameTarget}`);
        }
        // Apex — Cloudflare supports CNAME flattening at root
        if (publishTarget !== "www") {
          await upsertDnsRecord(cloudflareZoneId, "CNAME", cleanApex, cnameTarget);
          dnsResults.push(`Created CNAME ${cleanApex} → ${cnameTarget} (Cloudflare proxied)`);
        }
        dnsStatus = "created";
      }
    } catch (e) {
      dnsResults.push(`Cloudflare error: ${String(e)}`);
      dnsStatus = "error";
    }
  } else {
    dnsStatus = "manual";
  }

  // Save to DB
  const liveDomain = publishTarget === "www" ? cleanWww : cleanApex;

  await sql`
    UPDATE "GeneratedSite" SET
      "liveDomain"       = ${liveDomain},
      "wwwDomain"        = ${cleanWww},
      "apexDomain"       = ${cleanApex},
      "publishTarget"    = ${publishTarget},
      "deploymentStatus" = 'domain_pending',
      "dnsStatus"        = ${dnsStatus},
      "cloudflareZoneId" = ${cloudflareZoneId ?? null},
      "deploymentError"  = NULL,
      "updatedAt"        = NOW()
    WHERE id = ${siteId}
  `;

  return NextResponse.json({
    ok:        true,
    liveDomain,
    wwwDomain: cleanWww,
    apexDomain: cleanApex,
    dnsStatus,
    dnsResults,
    cloudflareZoneId,
    nextStep:  dnsStatus === "created"
      ? "DNS records created. Add domain to hosting provider, then publish."
      : "Add DNS records manually, then publish.",
  });
}
