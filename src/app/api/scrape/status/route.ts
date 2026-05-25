import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAuth, unauthorized } from "@/lib/api-auth";

function getEnv(key: string): string {
  try {
    const cf = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cf[key]) return cf[key]!;
  } catch {}
  return process.env[key] ?? "";
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const token = getEnv("APIFY_API_TOKEN");
  if (!token) {
    return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Apify error: ${text}` }, { status: 500 });
    }

    const data = await res.json();
    const status = data.data.status as string;

    if (status === "SUCCEEDED") {
      const datasetId = data.data.defaultDatasetId as string;
      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&format=json`
      );
      const items = itemsRes.ok ? await itemsRes.json() : [];
      return NextResponse.json({ status: "SUCCEEDED", items });
    }

    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      return NextResponse.json({ status: "FAILED" });
    }

    return NextResponse.json({ status: "RUNNING" });
  } catch (err) {
    console.error("Scrape status error:", err);
    return NextResponse.json({ error: "Failed to check run status" }, { status: 500 });
  }
}
