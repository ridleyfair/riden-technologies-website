import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

function inferTierAndRate(notes: string | null): { tier: string; monthlyRate: number } {
  const text = (notes ?? "").toLowerCase();
  if (text.includes("enterprise") || text.includes("1,000") || text.includes("1000")) {
    return { tier: "enterprise", monthlyRate: 100 };
  }
  if (text.includes("pro+") || text.includes("pro ") || text.includes("500")) {
    return { tier: "growth", monthlyRate: 50 };
  }
  if (text.includes("starter") || text.includes("150")) {
    return { tier: "starter", monthlyRate: 25 };
  }
  return { tier: "starter", monthlyRate: 25 };
}

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
    const newStatus = body.status !== undefined ? body.status : ex.status;
    const wasCompleted = ex.status === "completed";
    const justCompleted = newStatus === "completed" && !wasCompleted;

    const completedAt = justCompleted ? now : (ex.completedAt ?? null);

    const [updated] = await sql`
      UPDATE "Project" SET
        name          = ${body.name        !== undefined ? body.name        : ex.name},
        "clientName"  = ${body.clientName  !== undefined ? body.clientName  : ex.clientName},
        status        = ${newStatus},
        budget        = ${body.budget      !== undefined ? Number(body.budget)   : ex.budget},
        spent         = ${body.spent       !== undefined ? Number(body.spent)    : ex.spent},
        progress      = ${body.progress    !== undefined ? Math.min(100, Math.max(0, Number(body.progress))) : ex.progress},
        "dueDate"     = ${body.dueDate     !== undefined ? body.dueDate     : ex.dueDate},
        notes         = ${body.notes       !== undefined ? body.notes       : ex.notes},
        "completedAt" = ${completedAt},
        "updatedAt"   = ${now}
      WHERE id = ${id}
      RETURNING *
    `;

    // Auto-create client when project is marked complete
    let newClient = null;
    if (justCompleted) {
      const clientName = String(ex.clientName ?? "");
      const budget = Number(ex.budget ?? body.budget ?? 0);
      const spent = Number(ex.spent ?? body.spent ?? 0);
      const profit = budget - spent;
      const { tier, monthlyRate } = inferTierAndRate(String(ex.notes ?? ""));

      // Try to find an email from the Lead table
      const leadRows = await sql`
        SELECT email FROM "Lead"
        WHERE LOWER(company) = LOWER(${clientName})
           OR LOWER(name) = LOWER(${clientName})
        ORDER BY "createdAt" DESC LIMIT 1
      `;
      const email = leadRows[0]?.email ?? null;

      try {
        const clientId = crypto.randomUUID();
        const [client] = await sql`
          INSERT INTO "Client" (
            id, name, email, company, tier, status, revenue, websites,
            "monthlyRate", "activeFrom", profit,
            "createdAt", "updatedAt"
          ) VALUES (
            ${clientId}, ${clientName}, ${email ?? ""}, ${clientName},
            ${tier}, 'active',
            ${profit}, 1,
            ${monthlyRate}, ${now}, ${profit},
            ${now}, ${now}
          )
          ON CONFLICT DO NOTHING
          RETURNING *
        `;
        newClient = client ?? null;
      } catch {
        // ON CONFLICT DO NOTHING — client may already exist; not a fatal error
      }
    }

    return NextResponse.json({ project: updated, client: newClient });
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
