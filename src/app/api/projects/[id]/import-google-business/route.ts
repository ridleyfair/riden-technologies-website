import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import {
  startGoogleBusinessScrape,
  checkGoogleBusinessRun,
  resolveGoogleMapsUrl,
  ensureGoogleBriefColumns,
} from "@/lib/google-business-import";
import { buildGoogleBusinessBriefPatch, mergeGoogleBusinessPatchAndRunQa } from "@/lib/google-business-brief";

// POST — start an Apify run, return { runId, placeUrl } immediately
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const sql = getDb();

    const [project] = await sql`SELECT * FROM "Project" WHERE id = ${id} LIMIT 1`;
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const scraperUrl = process.env.SCRAPER_API_URL ?? "http://localhost:8000";
    const placeUrl = await resolveGoogleMapsUrl({
      project: project as Record<string, unknown>,
      explicitUrl: body.placeUrl ?? null,
      scraperUrl,
    });

    if (!placeUrl.includes("google")) {
      return NextResponse.json({ error: "No Google Maps URL found for this project" }, { status: 400 });
    }

    const runId = await startGoogleBusinessScrape(placeUrl);
    return NextResponse.json({ runId, placeUrl, status: "started" });
  } catch (err) {
    console.error("Google Business import start error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to start import" }, { status: 500 });
  }
}

// GET — poll run status; if done, apply results to project and return updated project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const runId = req.nextUrl.searchParams.get("runId");
    const placeUrl = req.nextUrl.searchParams.get("placeUrl") ?? undefined;

    if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

    const result = await checkGoogleBusinessRun(runId);

    if (result.status === "running") {
      return NextResponse.json({ status: "running" });
    }

    if (result.status === "failed") {
      return NextResponse.json({ error: result.reason }, { status: 500 });
    }

    // Done — apply results to the project
    const sql = getDb();
    await ensureGoogleBriefColumns(sql);

    const [project] = await sql`SELECT * FROM "Project" WHERE id = ${id} LIMIT 1`;
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const businessName = String((project as Record<string, unknown>).name ?? (project as Record<string, unknown>).clientName ?? "");
    const generated = buildGoogleBusinessBriefPatch(result.item, { projectName: businessName });
    const merged = mergeGoogleBusinessPatchAndRunQa({
      businessName: businessName || "Business",
      existing: project as Record<string, unknown>,
      patch: generated,
      preserveMachinePrefill: true,
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
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ status: "done", project: updated, runId, placeUrl });
  } catch (err) {
    console.error("Google Business import poll error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Import poll failed" }, { status: 500 });
  }
}
