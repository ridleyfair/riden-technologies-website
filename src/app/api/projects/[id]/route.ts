import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

import { getTier, type PricingTier } from "@/lib/pricing";

function inferMonthlyRate(pricingTier: string | null, notes: string | null): number {
  if (pricingTier) return getTier(pricingTier as PricingTier).monthlyFee;
  const text = (notes ?? "").toLowerCase();
  if (text.includes("enterprise")) return 199;
  if (text.includes("pro+"))       return 99;
  return 50;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();
  const { id } = await params;
  const sql = getDb();
  const [project] = await sql`SELECT * FROM "Project" WHERE id = ${id} LIMIT 1`;
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
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

    const vals = {
      name:            body.name            !== undefined ? body.name                                         : ex.name,
      clientName:      body.clientName      !== undefined ? body.clientName                                   : ex.clientName,
      status:          newStatus,
      budget:          body.budget          !== undefined ? Number(body.budget)                               : ex.budget,
      spent:           body.spent           !== undefined ? Number(body.spent)                                : ex.spent,
      progress:        body.progress        !== undefined ? Math.min(100, Math.max(0, Number(body.progress))) : ex.progress,
      dueDate:         body.dueDate         !== undefined ? body.dueDate                                      : ex.dueDate,
      notes:           body.notes           !== undefined ? body.notes                                        : ex.notes,
      phone:           body.phone           !== undefined ? body.phone                                        : ex.phone,
      email:           body.email           !== undefined ? body.email                                        : ex.email,
      city:            body.city            !== undefined ? body.city                                         : ex.city,
      postcode:        body.postcode        !== undefined ? body.postcode                                     : ex.postcode,
      industry:        body.industry        !== undefined ? body.industry                                     : ex.industry,
      services:        body.services        !== undefined ? body.services                                     : ex.services,
      about:           body.about           !== undefined ? body.about                                        : ex.about,
      accreditations:  body.accreditations  !== undefined ? body.accreditations                               : ex.accreditations,
      socialFacebook:  body.socialFacebook  !== undefined ? body.socialFacebook                               : ex.socialFacebook,
      socialInstagram: body.socialInstagram !== undefined ? body.socialInstagram                              : ex.socialInstagram,
      openingHours:    body.openingHours    !== undefined ? body.openingHours                                 : ex.openingHours,
      reviewsJson:     body.reviewsJson     !== undefined ? body.reviewsJson                                  : ex.reviewsJson,
      photosJson:      body.photosJson      !== undefined ? body.photosJson                                   : ex.photosJson,
      pricingTier:     body.pricingTier     !== undefined ? body.pricingTier                                  : (ex.pricingTier ?? "pro"),
      setupFee:        body.setupFee        !== undefined ? Number(body.setupFee)                             : (Number(ex.setupFee) || 299),
      monthlyFee:      body.monthlyFee      !== undefined ? Number(body.monthlyFee)                           : (Number(ex.monthlyFee) || 50),
    };

    // Try with completedAt + brief columns (requires migration); fall back without them
    let updated: Record<string, unknown>;
    try {
      const [row] = await sql`
        UPDATE "Project" SET
          name              = ${vals.name},
          "clientName"      = ${vals.clientName},
          status            = ${vals.status},
          budget            = ${vals.budget},
          spent             = ${vals.spent},
          progress          = ${vals.progress},
          "dueDate"         = ${vals.dueDate},
          notes             = ${vals.notes},
          "completedAt"     = ${completedAt},
          phone             = ${vals.phone},
          email             = ${vals.email},
          city              = ${vals.city},
          postcode          = ${vals.postcode},
          industry          = ${vals.industry},
          services          = ${vals.services},
          about             = ${vals.about},
          accreditations    = ${vals.accreditations},
          "socialFacebook"  = ${vals.socialFacebook},
          "socialInstagram" = ${vals.socialInstagram},
          "openingHours"    = ${vals.openingHours},
          "reviewsJson"     = ${vals.reviewsJson},
          "photosJson"      = ${vals.photosJson},
          "pricingTier"     = ${vals.pricingTier},
          "setupFee"        = ${vals.setupFee},
          "monthlyFee"      = ${vals.monthlyFee},
          "updatedAt"       = ${now}
        WHERE id = ${id}
        RETURNING *
      `;
      updated = row;
    } catch {
      // brief columns may not exist yet (migration not run) — fall back to base columns
      try {
        const [row] = await sql`
          UPDATE "Project" SET
            name          = ${vals.name},
            "clientName"  = ${vals.clientName},
            status        = ${vals.status},
            budget        = ${vals.budget},
            spent         = ${vals.spent},
            progress      = ${vals.progress},
            "dueDate"     = ${vals.dueDate},
            notes         = ${vals.notes},
            "completedAt" = ${completedAt},
            "updatedAt"   = ${now}
          WHERE id = ${id}
          RETURNING *
        `;
        updated = row;
      } catch {
        // completedAt column may not exist yet either
        const [row] = await sql`
          UPDATE "Project" SET
            name         = ${vals.name},
            "clientName" = ${vals.clientName},
            status       = ${vals.status},
            budget       = ${vals.budget},
            spent        = ${vals.spent},
            progress     = ${vals.progress},
            "dueDate"    = ${vals.dueDate},
            notes        = ${vals.notes},
            "updatedAt"  = ${now}
          WHERE id = ${id}
          RETURNING *
        `;
        updated = row;
      }
    }

    // Auto-create client when project is marked complete
    let newClient = null;
    if (justCompleted) {
      const clientName = String(ex.clientName ?? "");
      const budget = Number(body.budget ?? ex.budget ?? 0);
      const spent = Number(body.spent ?? ex.spent ?? 0);
      const profit = budget - spent;
      const pricingTier = String(body.pricingTier ?? ex.pricingTier ?? "pro");
      const tier = pricingTier === "enterprise" ? "enterprise" : pricingTier === "pro_plus" ? "growth" : "starter";
      const monthlyRate = inferMonthlyRate(pricingTier, String(body.notes ?? ex.notes ?? ""));

      // Try to find an email from the Lead table
      let email = "";
      try {
        const leadRows = await sql`
          SELECT email FROM "Lead"
          WHERE LOWER(company) = LOWER(${clientName})
             OR LOWER(name)    = LOWER(${clientName})
          ORDER BY "createdAt" DESC LIMIT 1
        `;
        email = String(leadRows[0]?.email ?? "");
      } catch { /* Lead table lookup is best-effort */ }

      try {
        const clientId = crypto.randomUUID();
        // Try with new columns first
        const [client] = await sql`
          INSERT INTO "Client" (
            id, name, email, company, tier, status, revenue, websites,
            "monthlyRate", "activeFrom", profit,
            "createdAt", "updatedAt"
          ) VALUES (
            ${clientId}, ${clientName}, ${email}, ${clientName},
            ${tier}, 'active', ${profit}, 1,
            ${monthlyRate}, ${now}, ${profit},
            ${now}, ${now}
          )
          RETURNING *
        `;
        newClient = client ?? null;
      } catch {
        // Fallback: insert without migration-added columns
        try {
          const clientId = crypto.randomUUID();
          const [client] = await sql`
            INSERT INTO "Client" (id, name, email, company, tier, status, revenue, websites, "createdAt", "updatedAt")
            VALUES (${clientId}, ${clientName}, ${email}, ${clientName}, ${tier}, 'active', ${profit}, 1, ${now}, ${now})
            RETURNING *
          `;
          newClient = client ?? null;
        } catch { /* Client may already exist — not fatal */ }
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
