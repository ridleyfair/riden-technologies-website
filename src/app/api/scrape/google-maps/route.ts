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

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { placeUrl } = body;

    if (!placeUrl || !placeUrl.includes("google")) {
      return NextResponse.json({ error: "Please paste a Google Maps URL" }, { status: 400 });
    }

    const token = getEnv("APIFY_API_TOKEN");
    if (!token) {
      return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 });
    }

    const actorId = "compass~crawler-google-places";
    const res = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url: placeUrl }],
          maxCrawledPlacesPerSearch: 1,
          language: "en",
          countryCode: "gb",
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Apify error: ${text}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ runId: data.data.id });
  } catch (err) {
    console.error("Google Maps scrape error:", err);
    return NextResponse.json({ error: "Failed to start Google Maps scrape" }, { status: 500 });
  }
}
