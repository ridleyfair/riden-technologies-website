import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PER_IP_PER_HOUR = 30;
const WINDOW_MS = 60 * 60 * 1000;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/heic": "jpg",
  "image/heif": "jpg",
};

function getIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

// Simple in-memory counter per IP (resets on cold start — good enough)
const uploads = new Map<string, { count: number; since: number }>();

function checkUploadLimit(ip: string): boolean {
  const now = Date.now();
  const entry = uploads.get(ip);
  if (!entry || now - entry.since > WINDOW_MS) {
    uploads.set(ip, { count: 1, since: now });
    return true;
  }
  if (entry.count >= MAX_PER_IP_PER_HOUR) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkUploadLimit(ip)) {
    return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Accepted formats: JPG, PNG, WEBP" }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  const buf    = await file.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const id     = crypto.randomUUID();

  try {
    const sql = getDb();
    await sql`
      INSERT INTO "UploadedMedia" (id, filename, "contentType", data)
      VALUES (${id}, ${file.name.slice(0, 255)}, ${file.type}, ${base64})
    `;
  } catch (err) {
    console.error("[brief-upload] db error:", err);
    return NextResponse.json({ error: "Failed to store file" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: `/api/media/${id}.${ext}`, id });
}
