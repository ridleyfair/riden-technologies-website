import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg", "image/jpg": "jpg",
  "image/png":  "png", "image/webp": "webp",
  "image/heic": "jpg", "image/heif": "jpg",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  const [record] = await sql`
    SELECT id, form_submitted_at FROM "OutreachRecord" WHERE form_token = ${token} LIMIT 1
  `;
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (record.form_submitted_at) return NextResponse.json({ error: "Form already submitted" }, { status: 409 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "Accepted: JPG, PNG, WEBP" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 413 });

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const id     = crypto.randomUUID();

  await sql`
    INSERT INTO "UploadedMedia" (id, filename, "contentType", data)
    VALUES (${id}, ${file.name}, ${file.type}, ${base64})
  `;

  const origin = new URL(req.url).origin;
  return NextResponse.json({ ok: true, url: `${origin}/api/media/${id}.${ext}`, id });
}
