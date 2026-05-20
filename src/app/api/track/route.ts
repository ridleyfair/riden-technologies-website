import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const ALLOWED_TYPES = new Set(["page_view", "click", "form_submit", "heartbeat"]);
const ALLOWED_DEVICES = new Set(["mobile", "tablet", "desktop", "unknown"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, path, referrer, source, medium, campaign, device, sessionId, visitorId } = body;

    if (!type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }
    if (!path || typeof path !== "string" || path.length > 500) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const safeDevice = ALLOWED_DEVICES.has(device) ? device : "unknown";
    const sql = getDb();
    const now = new Date();

    if (type === "heartbeat") {
      // Upsert active session for live visitor count
      if (sessionId) {
        await sql`
          INSERT INTO "ActiveSession" ("sessionId", path, "lastSeen", device, "visitorId")
          VALUES (${sessionId}, ${path.slice(0, 500)}, ${now}, ${safeDevice}, ${visitorId ?? null})
          ON CONFLICT ("sessionId") DO UPDATE SET
            path = EXCLUDED.path,
            "lastSeen" = EXCLUDED."lastSeen"
        `;
      }
    } else {
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO "WebEvent" (id, type, path, referrer, source, medium, campaign, device, "sessionId", "visitorId", "createdAt")
        VALUES (
          ${id}, ${type}, ${path.slice(0, 500)},
          ${referrer ? String(referrer).slice(0, 500) : null},
          ${source ? String(source).slice(0, 100) : null},
          ${medium ? String(medium).slice(0, 100) : null},
          ${campaign ? String(campaign).slice(0, 200) : null},
          ${safeDevice},
          ${sessionId ? String(sessionId).slice(0, 100) : null},
          ${visitorId ? String(visitorId).slice(0, 100) : null},
          ${now}
        )
      `;

      // Also upsert active session on page_view
      if (type === "page_view" && sessionId) {
        await sql`
          INSERT INTO "ActiveSession" ("sessionId", path, "lastSeen", device, "visitorId")
          VALUES (${sessionId}, ${path.slice(0, 500)}, ${now}, ${safeDevice}, ${visitorId ?? null})
          ON CONFLICT ("sessionId") DO UPDATE SET
            path = EXCLUDED.path,
            "lastSeen" = EXCLUDED."lastSeen"
        `;
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Silently fail — never block the user's browsing experience
    return NextResponse.json({ ok: true });
  }
}

// Allow tracking from public pages without CORS issues
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
