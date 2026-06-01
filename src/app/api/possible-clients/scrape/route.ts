import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const SCRAPER_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const res = await fetch(`${SCRAPER_URL}/api/v1/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return NextResponse.json({ error: "Scraper API error" }, { status: res.status });
    return NextResponse.json(await res.json(), { status: 202 });
  } catch {
    return NextResponse.json({ error: "Scraper offline" }, { status: 503 });
  }
}
