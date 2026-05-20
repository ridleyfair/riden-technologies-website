import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

function nextInvoiceNumber(maxNum: number): string {
  return `INV-${String(maxNum + 1).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const sql = getDb();
  try {
    const invoices = await sql`
      SELECT i.*,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', li.id,
              'description', li.description,
              'quantity', li.quantity,
              'unitPrice', li."unitPrice",
              'amount', li.amount
            ) ORDER BY li."createdAt"
          )
          FROM "InvoiceLineItem" li WHERE li."invoiceId" = i.id),
          '[]'::json
        ) AS "lineItems"
      FROM "Invoice" i
      ORDER BY i."createdAt" DESC
    `;
    return NextResponse.json(invoices);
  } catch (err) {
    // If InvoiceLineItem table doesn't exist yet, fall back to plain invoices
    const invoices = await sql`SELECT * FROM "Invoice" ORDER BY "createdAt" DESC`;
    return NextResponse.json(invoices.map((i) => ({ ...i, lineItems: [] })));
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const {
      clientName,
      clientEmail = "",
      clientId = null,
      dueDate,
      status = "draft",
      taxRate = 0,
      discount = 0,
      notes = "",
      lineItems = [] as LineItemInput[],
    } = body;

    if (!clientName) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const sql = getDb();

    // Generate next invoice number
    const numRows = await sql`
      SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM 5) AS INTEGER)), 41) AS max_num
      FROM "Invoice" WHERE number ~ '^INV-[0-9]+$'
    `;
    const number = nextInvoiceNumber(Number(numRows[0]?.max_num ?? 41));

    // Calculate totals
    const subtotal = lineItems.reduce((s: number, li: LineItemInput) => s + li.quantity * li.unitPrice, 0);
    const taxAmount = subtotal * taxRate / 100;
    const total = Math.max(0, subtotal + taxAmount - discount);

    const id = crypto.randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO "Invoice" (
        id, number, "clientId", "clientName", "clientEmail",
        amount, status, "dueDate", "taxRate", discount, notes,
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${number}, ${clientId}, ${clientName}, ${clientEmail},
        ${total}, ${status}, ${dueDate ? new Date(dueDate) : null},
        ${taxRate}, ${discount}, ${notes},
        ${now}, ${now}
      )
    `;

    // Insert line items
    if (lineItems.length > 0) {
      for (const li of lineItems) {
        const liId = crypto.randomUUID();
        const amount = li.quantity * li.unitPrice;
        await sql`
          INSERT INTO "InvoiceLineItem" (id, "invoiceId", description, quantity, "unitPrice", amount)
          VALUES (${liId}, ${id}, ${li.description}, ${li.quantity}, ${li.unitPrice}, ${amount})
        `;
      }
    }

    // Return created invoice with line items
    const [invoice] = await sql`
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("Invoice create error:", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
