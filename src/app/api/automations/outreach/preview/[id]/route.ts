import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { buildOutreachEmailHtml } from "@/lib/outreach-email";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();

  const [record] = await sql`
    SELECT * FROM "OutreachRecord" WHERE id = ${id} LIMIT 1
  `;
  if (!record) return new NextResponse("Record not found", { status: 404 });

  const origin       = new URL(req.url).origin;
  const formUrl      = `${origin}/website-interest/${record.form_token}`;
  const unsubscribeUrl = `${origin}/unsubscribe/${record.form_token}`;

  const { subject, html } = buildOutreachEmailHtml({
    businessName:   String(record.business_name ?? ""),
    trade:          String(record.industry  ?? ""),
    location:       String(record.location   ?? ""),
    previewUrl:     record.preview_url ? String(record.preview_url) : undefined,
    formUrl,
    unsubscribeUrl,
  });

  // Wrap the email HTML with a subject banner so it's easy to review
  const page = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Preview</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #1a1a2e; }
    .banner {
      background: #0f1117; color: #94a3b8; font-size: 12px;
      padding: 10px 20px; display: flex; align-items: center; gap: 16px;
      border-bottom: 1px solid #2d2d3d; position: sticky; top: 0; z-index: 10;
    }
    .banner strong { color: #fff; }
    .banner .tag {
      background: #1e293b; border: 1px solid #334155; border-radius: 4px;
      padding: 2px 8px; font-size: 11px; color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="banner">
    <span class="tag">PREVIEW</span>
    <span>To: <strong>${record.business_email}</strong></span>
    <span>Subject: <strong>${subject}</strong></span>
    ${record.preview_url ? `<span class="tag">Has preview URL</span>` : `<span class="tag" style="color:#f59e0b;border-color:#92400e;">No preview URL</span>`}
  </div>
  ${html}
</body>
</html>`;

  return new NextResponse(page, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
