import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json();
    const sql = getDb();

    const current = await sql`SELECT * FROM "Project" WHERE id = ${id} LIMIT 1`;
    if (!current[0]) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const ex = current[0] as Record<string, unknown>;

    const now = new Date();
    const [updated] = await sql`
      UPDATE "Project" SET
        name        = ${body.name        !== undefined ? body.name        : ex.name},
        "clientName" = ${body.clientName !== undefined ? body.clientName  : ex.clientName},
        status      = ${body.status      !== undefined ? body.status      : ex.status},
        budget      = ${body.budget      !== undefined ? Number(body.budget) : ex.budget},
        spent       = ${body.spent       !== undefined ? Number(body.spent)  : ex.spent},
        progress    = ${body.progress    !== undefined ? Math.min(100, Math.max(0, Number(body.progress))) : ex.progress},
        "dueDate"   = ${body.dueDate     !== undefined ? body.dueDate     : ex.dueDate},
        notes       = ${body.notes       !== undefined ? body.notes       : ex.notes},
        "updatedAt" = ${now}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Project update error:", err);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const sql = getDb();
    const result = await sql`DELETE FROM "Project" WHERE id = ${id} RETURNING id`;
    if (!result[0]) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Project delete error:", err);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
