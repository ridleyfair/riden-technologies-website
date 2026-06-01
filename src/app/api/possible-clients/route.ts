import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const SCRAPER_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();

  for (const key of ["city", "category", "keyword", "lead_tier", "min_score", "has_website", "page", "page_size"]) {
    const v = searchParams.get(key);
    if (v !== null) params.set(key, v);
  }

  try {
    const res = await fetch(`${SCRAPER_URL}/api/v1/businesses?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "Scraper API error" }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Scraper offline" }, { status: 503 });
  }
}
