import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT * FROM "GeneratedSite" WHERE id = ${id} LIMIT 1`;

  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  const sql = getDb();

  const allowed = [
    "liveDomain", "wwwDomain", "apexDomain", "publishTarget",
    "deploymentStatus", "dnsStatus", "sslStatus",
    "cloudflareZoneId", "vercelDomainId", "deploymentError",
    "lastPublishedAt", "specJson", "draftSpecJson", "publishedSpecJson",
    "status",
  ];

  for (const field of allowed) {
    if (body[field] !== undefined) {
      await sql`UPDATE "GeneratedSite" SET ${sql(field)} = ${body[field] as string}, "updatedAt" = NOW() WHERE id = ${id}`;
    }
  }

  const [row] = await sql`SELECT * FROM "GeneratedSite" WHERE id = ${id} LIMIT 1`;
  return NextResponse.json(row);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM "GeneratedSite" WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
