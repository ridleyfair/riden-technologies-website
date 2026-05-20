import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import type { LineItemInput } from "../route";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();

  try {
    const rows = await sql`
      SELECT i.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', li.id, 'description', li.description,
            'quantity', li.quantity, 'unitPrice', li."unitPrice", 'amount', li.amount
          ) ORDER BY li."createdAt")
          FROM "InvoiceLineItem" li WHERE li."invoiceId" = i.id),
          '[]'::json
        ) AS "lineItems"
      FROM "Invoice" i WHERE i.id = ${id}
    `;
    if (!rows[0]) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    const rows = await sql`SELECT * FROM "Invoice" WHERE id = ${id} LIMIT 1`;
    if (!rows[0]) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    return NextResponse.json({ ...rows[0], lineItems: [] });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const sql = getDb();

  const current = await sql`SELECT * FROM "Invoice" WHERE id = ${id} LIMIT 1`;
  if (!current[0]) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const ex = current[0] as Record<string, unknown>;

  const lineItems: LineItemInput[] | undefined = body.lineItems;

  // Recalculate total if line items provided
  let amount = ex.amount as number;
  if (lineItems !== undefined) {
    const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
    const taxRate = body.taxRate ?? (ex.taxRate as number) ?? 0;
    const discount = body.discount ?? (ex.discount as number) ?? 0;
    amount = Math.max(0, subtotal + subtotal * taxRate / 100 - discount);
  }

  const now = new Date();
  const newStatus = body.status ?? ex.status;
  const paidAt =
    newStatus === "paid" && ex.status !== "paid"
      ? now
      : body.paidAt !== undefined
      ? body.paidAt
      : (ex.paidAt ?? null);

  const [updated] = await sql`
    UPDATE "Invoice" SET
      "clientName"  = ${body.clientName  ?? ex.clientName},
      "clientEmail" = ${body.clientEmail !== undefined ? body.clientEmail : (ex.clientEmail ?? null)},
      "clientId"    = ${body.clientId    !== undefined ? body.clientId    : (ex.clientId ?? null)},
      amount        = ${amount},
      status        = ${newStatus},
      "dueDate"     = ${body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : (ex.dueDate ?? null)},
      "taxRate"     = ${body.taxRate  !== undefined ? body.taxRate  : (ex.taxRate  ?? 0)},
      discount      = ${body.discount !== undefined ? body.discount : (ex.discount ?? 0)},
      notes         = ${body.notes    !== undefined ? body.notes    : (ex.notes    ?? null)},
      "paidAt"      = ${paidAt},
      "updatedAt"   = ${now}
    WHERE id = ${id}
    RETURNING *
  `;

  // Replace line items if provided
  if (lineItems !== undefined) {
    try {
      await sql`DELETE FROM "InvoiceLineItem" WHERE "invoiceId" = ${id}`;
      for (const li of lineItems) {
        const liId = crypto.randomUUID();
        await sql`
          INSERT INTO "InvoiceLineItem" (id, "invoiceId", description, quantity, "unitPrice", amount)
          VALUES (${liId}, ${id}, ${li.description}, ${li.quantity}, ${li.unitPrice}, ${li.quantity * li.unitPrice})
        `;
      }
    } catch {
      // InvoiceLineItem table may not exist yet; skip silently
    }
  }

  return NextResponse.json({ ...updated, lineItems: lineItems ?? [] });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();

  try {
    await sql`DELETE FROM "InvoiceLineItem" WHERE "invoiceId" = ${id}`;
  } catch {
    // table may not exist
  }
  await sql`DELETE FROM "Invoice" WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
