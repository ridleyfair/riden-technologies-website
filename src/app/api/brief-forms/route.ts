import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { projectId } = await req.json();
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const sql = getDb();

  const [project] = await sql`SELECT id, name FROM "Project" WHERE id = ${projectId} LIMIT 1`;
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Return existing pending form if one already exists
  const [existing] = await sql`
    SELECT token, status, created_at FROM "ClientBriefForm"
    WHERE project_id = ${projectId} AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1
  `;
  if (existing) {
    return NextResponse.json({ token: existing.token, existing: true });
  }

  const [form] = await sql`
    INSERT INTO "ClientBriefForm" (project_id, business_name)
    VALUES (${projectId}, ${project.name as string})
    RETURNING token
  `;
  return NextResponse.json({ token: form.token, existing: false });
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ form: null });

  const sql = getDb();
  const [form] = await sql`
    SELECT token, status, created_at, submitted_at
    FROM "ClientBriefForm"
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC LIMIT 1
  `;
  return NextResponse.json({ form: form ?? null });
}
