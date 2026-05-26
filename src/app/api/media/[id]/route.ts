import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;

  // Strip optional extension (e.g. "uuid.webp" → "uuid") so URLs can carry
  // the file extension for client-side type detection without breaking the lookup.
  const id = rawId.replace(/\.[a-z0-9]+$/i, "");

  // Basic UUID validation — prevent SQL injection via path param
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  let row: { contentType: string; data: string } | undefined;
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT "contentType", data
      FROM   "UploadedMedia"
      WHERE  id = ${id}
      LIMIT  1
    `;
    row = rows[0] as typeof row;
  } catch {
    return new NextResponse("Storage error", { status: 500 });
  }

  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buf = Buffer.from(row.data, "base64");

  return new NextResponse(buf, {
    headers: {
      "Content-Type":  row.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(buf.byteLength),
    },
  });
}
