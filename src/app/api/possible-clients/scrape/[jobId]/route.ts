import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const SCRAPER_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { jobId } = await params;

  try {
    const res = await fetch(`${SCRAPER_URL}/api/v1/scrape/${jobId}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Job not found" }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Scraper offline" }, { status: 503 });
  }
}
