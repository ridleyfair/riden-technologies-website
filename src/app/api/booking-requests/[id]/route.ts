import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body;

  const sql = getDb();
  const now = new Date();

  try {
    if (status !== undefined && notes !== undefined) {
      await sql`
        UPDATE "BeautyBookingRequest"
        SET status = ${status}, notes = ${notes}, "updatedAt" = ${now}
        WHERE id = ${id}
      `;
    } else if (status !== undefined) {
      await sql`
        UPDATE "BeautyBookingRequest"
        SET status = ${status}, "updatedAt" = ${now}
        WHERE id = ${id}
      `;
    } else if (notes !== undefined) {
      await sql`
        UPDATE "BeautyBookingRequest"
        SET notes = ${notes}, "updatedAt" = ${now}
        WHERE id = ${id}
      `;
    }

    const [row] = await sql`SELECT * FROM "BeautyBookingRequest" WHERE id = ${id}`;
    return NextResponse.json(row);
  } catch (err) {
    console.error("booking-request patch error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const sql = getDb();

  try {
    await sql`DELETE FROM "BeautyBookingRequest" WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("booking-request delete error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
