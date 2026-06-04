import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/heic": "jpg",
  "image/heif": "jpg",
};

// Public — token is the credential
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  const [form] = await sql`
    SELECT id, status FROM "ClientBriefForm" WHERE token = ${token} LIMIT 1
  `;
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.status === "submitted") return NextResponse.json({ error: "Form already submitted" }, { status: 409 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Accepted formats: JPG, PNG, WEBP" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 413 });

  const buf    = await file.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const id     = crypto.randomUUID();

  await sql`
    INSERT INTO "UploadedMedia" (id, filename, "contentType", data)
    VALUES (${id}, ${file.name}, ${file.type}, ${base64})
  `;

  const origin = new URL(req.url).origin;
  const url    = `${origin}/api/media/${id}.${ext}`;
  return NextResponse.json({ ok: true, url, id });
}
