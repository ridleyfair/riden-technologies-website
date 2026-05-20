import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const EMPTY_STATS = {
  overview: {
    pageViews: 0, uniqueVisitors: 0, totalClicks: 0,
    formSubmissions: 0, liveVisitors: 0, conversionRate: 0,
  },
  topPages: [],
  trafficSources: [],
  deviceBreakdown: [],
  recentEvents: [],
};

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();

  try {
    const [
      overviewRows,
      liveRows,
      topPagesRows,
      sourcesRows,
      devicesRows,
      recentEventsRows,
      leadsRows,
    ] = await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE type = 'page_view') AS page_views,
          COUNT(DISTINCT "visitorId") FILTER (WHERE "visitorId" IS NOT NULL) AS unique_visitors,
          COUNT(*) FILTER (WHERE type = 'click') AS clicks,
          COUNT(*) FILTER (WHERE type = 'form_submit') AS form_submissions
        FROM "WebEvent"
        WHERE "createdAt" > NOW() - INTERVAL '30 days'
      `,
      sql`
        SELECT COUNT(*) AS count FROM "ActiveSession"
        WHERE "lastSeen" > NOW() - INTERVAL '5 minutes'
      `,
      sql`
        SELECT path, COUNT(*) AS views
        FROM "WebEvent"
        WHERE type = 'page_view' AND "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY path ORDER BY views DESC LIMIT 10
      `,
      sql`
        SELECT COALESCE(source, 'direct') AS source, COUNT(*) AS count
        FROM "WebEvent"
        WHERE type = 'page_view' AND "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY source ORDER BY count DESC LIMIT 8
      `,
      sql`
        SELECT COALESCE(device, 'unknown') AS device, COUNT(*) AS count
        FROM "WebEvent"
        WHERE type = 'page_view' AND "createdAt" > NOW() - INTERVAL '30 days'
        GROUP BY device ORDER BY count DESC
      `,
      sql`
        SELECT id, type, path, COALESCE(device, 'unknown') AS device, "createdAt"
        FROM "WebEvent"
        ORDER BY "createdAt" DESC LIMIT 20
      `,
      sql`
        SELECT COUNT(*) AS count FROM "Lead"
        WHERE "createdAt" > NOW() - INTERVAL '30 days'
      `,
    ]);

    const formSubmissions = Number(overviewRows[0]?.form_submissions ?? 0);
    const newLeads = Number(leadsRows[0]?.count ?? 0);
    const conversionRate =
      formSubmissions > 0 ? Math.round((newLeads / formSubmissions) * 1000) / 10 : 0;

    return NextResponse.json({
      overview: {
        pageViews: Number(overviewRows[0]?.page_views ?? 0),
        uniqueVisitors: Number(overviewRows[0]?.unique_visitors ?? 0),
        totalClicks: Number(overviewRows[0]?.clicks ?? 0),
        formSubmissions,
        liveVisitors: Number(liveRows[0]?.count ?? 0),
        conversionRate,
      },
      topPages: topPagesRows.map((r: Record<string, unknown>) => ({
        path: r.path,
        views: Number(r.views),
      })),
      trafficSources: sourcesRows.map((r: Record<string, unknown>) => ({
        source: r.source,
        count: Number(r.count),
      })),
      deviceBreakdown: devicesRows.map((r: Record<string, unknown>) => ({
        device: String(r.device).charAt(0).toUpperCase() + String(r.device).slice(1),
        count: Number(r.count),
      })),
      recentEvents: recentEventsRows,
    });
  } catch (err) {
    // Tables don't exist yet (migration not run)
    return NextResponse.json(EMPTY_STATS);
  }
}
