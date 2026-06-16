import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { importGoogleBusinessIntoProject } from "@/lib/google-business-import";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const sql = getDb();
    const result = await importGoogleBusinessIntoProject({
      sql,
      projectId: id,
      placeUrl: body.placeUrl ?? null,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Google Business project import error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Google Business import failed" }, { status: 500 });
  }
}
