import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Public — no auth. The token IS the auth.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  const [form] = await sql`
    SELECT token, business_name, status, created_at, submitted_at, project_id
    FROM "ClientBriefForm"
    WHERE token = ${token}
    LIMIT 1
  `;

  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  // Fetch linked project data for pre-filling
  let projectData: Record<string, unknown> | null = null;
  if (form.project_id) {
    try {
      const [project] = await sql`
        SELECT phone, email, city, postcode, industry, services, about,
               "socialFacebook", "socialInstagram", "openingHours",
               accreditations, "photosJson"
        FROM "Project"
        WHERE id = ${form.project_id as string}
        LIMIT 1
      `;
      projectData = project ?? null;
    } catch { /* ignore */ }
  }

  return NextResponse.json({ form, projectData });
}
