import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg":  "jpg",
  "image/jpg":   "jpg",
  "image/png":   "png",
  "image/webp":  "webp",
};

async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS "UploadedMedia" (
      id           TEXT PRIMARY KEY,
      filename     TEXT        NOT NULL,
      "contentType" TEXT       NOT NULL,
      data         TEXT        NOT NULL,
      "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: JPG, PNG, WEBP` },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 8 MB)" },
      { status: 413 },
    );
  }

  const buf    = await file.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const id     = crypto.randomUUID();

  try {
    await ensureTable();
    const sql = getDb();
    await sql`
      INSERT INTO "UploadedMedia" (id, filename, "contentType", data)
      VALUES (${id}, ${file.name}, ${file.type}, ${base64})
    `;
  } catch (e) {
    console.error("[upload] db error:", e);
    return NextResponse.json({ error: "Failed to store file" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: `/api/media/${id}`, id });
}
