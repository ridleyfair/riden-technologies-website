import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { buildGoogleBusinessBriefPatch, mergeGoogleBusinessPatchAndRunQa } from "@/lib/google-business-brief";

type SqlClient = ReturnType<typeof getDb>;

type ImportGoogleBusinessOptions = {
  sql: SqlClient;
  projectId: string;
  placeUrl?: string | null;
  scraperUrl?: string;
  preserveMachinePrefill?: boolean;
};

function getEnv(key: string): string {
  try {
    const cf = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cf[key]) return cf[key]!;
  } catch {}
  return process.env[key] ?? "";
}

export async function ensureGoogleBriefColumns(sql: SqlClient) {
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS city TEXT`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS postcode TEXT`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'trades'`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS services TEXT`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS about TEXT`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "openingHours" TEXT`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "reviewsJson" TEXT DEFAULT '[]'`;
  await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "photosJson" TEXT DEFAULT '[]'`;
}

export async function resolveGoogleMapsUrl({
  project,
  explicitUrl,
  scraperUrl = process.env.SCRAPER_API_URL ?? "http://localhost:8000",
}: {
  project: Record<string, unknown>;
  explicitUrl?: string | null;
  scraperUrl?: string;
}): Promise<string> {
  if (explicitUrl?.trim()) return explicitUrl.trim();

  const possibleClientId = typeof project.possibleClientId === "string" ? project.possibleClientId : "";
  if (possibleClientId) {
    const res = await fetch(`${scraperUrl}/api/v1/businesses/${possibleClientId}`, { cache: "no-store" });
    if (res.ok) {
      const business = await res.json();
      if (typeof business.maps_url === "string" && business.maps_url.trim()) return business.maps_url.trim();
      if (typeof business.url === "string" && business.url.includes("google")) return business.url.trim();
    }
  }

  const notes = typeof project.notes === "string" ? project.notes : "";
  const match = notes.match(/https?:\/\/[^\s]+google[^\s]+/i);
  if (match) return match[0];

  throw new Error("No Google Maps URL found for this project. Import the Possible Client with maps_url or pass placeUrl.");
}

export async function startGoogleBusinessScrape(placeUrl: string): Promise<string> {
  const token = getEnv("APIFY_API_TOKEN");
  if (!token) throw new Error("APIFY_API_TOKEN not configured");

  const actorId = "compass~crawler-google-places";
  const startRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startUrls: [{ url: placeUrl }],
      maxCrawledPlacesPerSearch: 1,
      language: "en",
      countryCode: "gb",
      maxReviews: 20,
      maxImages: 20,
      scrapeImageUrls: true,
      reviewsSort: "newest",
    }),
  });

  if (!startRes.ok) throw new Error(`Apify start error: ${await startRes.text()}`);
  const startData = await startRes.json();
  return startData.data.id as string;
}

export async function checkGoogleBusinessRun(runId: string): Promise<
  { status: "running" } |
  { status: "done"; item: Record<string, unknown> } |
  { status: "failed"; reason: string }
> {
  const token = getEnv("APIFY_API_TOKEN");
  if (!token) return { status: "failed", reason: "APIFY_API_TOKEN not configured" };

  const runRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
  if (!runRes.ok) return { status: "failed", reason: `Apify status error: ${await runRes.text()}` };

  const runData = await runRes.json();
  const apifyStatus = runData.data.status as string;

  if (["FAILED", "ABORTED", "TIMED-OUT"].includes(apifyStatus)) {
    return { status: "failed", reason: `Google Business scrape ${apifyStatus}` };
  }

  if (apifyStatus !== "SUCCEEDED") return { status: "running" };

  const datasetId = runData.data.defaultDatasetId as string;
  const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&format=json`);
  if (!itemsRes.ok) return { status: "failed", reason: `Apify dataset error: ${await itemsRes.text()}` };

  const items = await itemsRes.json();
  const item = Array.isArray(items) ? items[0] : null;
  if (!item) return { status: "failed", reason: "Scrape succeeded but returned no items" };

  return { status: "done", item };
}

export async function runGoogleBusinessScrape(placeUrl: string) {
  const runId = await startGoogleBusinessScrape(placeUrl);

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const result = await checkGoogleBusinessRun(runId);
    if (result.status === "done") return { runId, item: result.item };
    if (result.status === "failed") throw new Error(result.reason);
  }

  throw new Error("Google Business scrape timed out before completion");
}

export async function importGoogleBusinessIntoProject({ sql, projectId, placeUrl: explicitUrl, scraperUrl, preserveMachinePrefill = true }: ImportGoogleBusinessOptions) {
  await ensureGoogleBriefColumns(sql);

  const [project] = await sql`SELECT * FROM "Project" WHERE id = ${projectId} LIMIT 1`;
  if (!project) throw new Error("Project not found");

  const placeUrl = await resolveGoogleMapsUrl({ project: project as Record<string, unknown>, explicitUrl, scraperUrl });
  if (!placeUrl.includes("google")) throw new Error("Project Google URL is not a Google Maps/Business URL");

  const { runId, item } = await runGoogleBusinessScrape(placeUrl);
  const businessName = String(project.name ?? project.clientName ?? "");
  const generated = buildGoogleBusinessBriefPatch(item as Record<string, unknown>, { projectName: businessName });
  const merged = mergeGoogleBusinessPatchAndRunQa({
    businessName: businessName || "Business",
    existing: project as Record<string, unknown>,
    patch: generated,
    preserveMachinePrefill,
  });
  const now = new Date();

  const [updated] = await sql`
    UPDATE "Project" SET
      phone          = ${merged.phone ?? null},
      email          = ${merged.email ?? null},
      city           = ${merged.city ?? null},
      postcode       = ${merged.postcode ?? null},
      industry       = ${merged.industry ?? null},
      services       = ${merged.services ?? null},
      about          = ${merged.about ?? null},
      "openingHours" = ${merged.openingHours ?? null},
      "reviewsJson"  = ${merged.reviewsJson ?? null},
      "photosJson"   = ${merged.photosJson ?? null},
      "updatedAt"    = ${now}
    WHERE id = ${projectId}
    RETURNING *
  `;

  return { project: updated, runId, placeUrl, imported: true };
}
