import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { isMsConfigured, sendMail } from "@/lib/ms-graph";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  const results: Record<string, unknown> = {};

  // 1. MS config status
  results.ms_configured = isMsConfigured();

  // 2. Record counts
  const [counts] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE outreach_status = 'queued' AND approved = FALSE) AS queued_unapproved,
      COUNT(*) FILTER (WHERE outreach_status = 'queued' AND approved = TRUE)  AS queued_approved,
      COUNT(*) FILTER (WHERE outreach_status = 'sent')    AS sent,
      COUNT(*) FILTER (WHERE outreach_status = 'failed')  AS failed,
      COUNT(*) FILTER (WHERE outreach_status = 'responded') AS responded
    FROM "OutreachRecord"
  `;
  results.counts = counts;

  // 3. Sample of queued+approved records (what send would pick up)
  const sample = await sql`
    SELECT id, business_name, business_email, outreach_status, approved, error_message
    FROM "OutreachRecord"
    WHERE outreach_status = 'queued' AND opt_out = FALSE AND approved = TRUE
    LIMIT 3
  `;
  results.ready_to_send_sample = sample;

  // 4. Any recent errors
  const errors = await sql`
    SELECT business_name, business_email, error_message, updated_at
    FROM "OutreachRecord"
    WHERE outreach_status = 'failed'
    ORDER BY updated_at DESC LIMIT 5
  `;
  results.recent_failures = errors;

  // 5. Test MS send (optional — add ?test_send=1 to actually fire a test)
  if (new URL(req.url).searchParams.get("test_send") === "1") {
    try {
      await sendMail({
        to:      "ridleyfair123@gmail.com",
        subject: "Riden outreach — MS Graph test",
        html:    "<p>MS Graph is working correctly.</p>",
      });
      results.test_send = "SUCCESS — check ridleyfair123@gmail.com";
    } catch (e) {
      results.test_send = `FAILED: ${String(e)}`;
    }
  }

  return NextResponse.json(results, { status: 200 });
}
