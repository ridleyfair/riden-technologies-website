import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { isMsConfigured, listCalendarEvents } from "@/lib/ms-graph";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  if (!isMsConfigured()) {
    return NextResponse.json({ error: "Microsoft Graph not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const start =
    searchParams.get("start") ?? new Date().toISOString().split("T")[0];
  const end =
    searchParams.get("end") ??
    new Date(Date.now() + 90 * 86_400_000).toISOString().split("T")[0];

  try {
    const events = await listCalendarEvents(start, end);
    return NextResponse.json({ events, total: events.length });
  } catch (err) {
    console.error("Calendar events fetch error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
