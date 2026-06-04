import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type SubmitBody = {
  name:              string;
  phone?:            string;
  email:             string;
  businessName?:     string;
  preferredDomain?:  string;
  servicesWanted?:   string;
  designChanges?:    string;
  photoUrls?:        string[];
  preferredCallTime?: string;
  notes?:            string;
};

// Public — token is the credential
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  const [record] = await sql`
    SELECT * FROM "OutreachRecord" WHERE form_token = ${token} LIMIT 1
  `;
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (record.opt_out) return NextResponse.json({ error: "opted_out" }, { status: 410 });
  if (record.form_submitted_at) return NextResponse.json({ error: "already_submitted" }, { status: 409 });

  const body: SubmitBody = await req.json();
  const { name, email } = body;
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const now         = new Date();
  const businessName = body.businessName || (record.business_name as string) || "";
  const notes = [
    "Source: Website Preview Outreach",
    body.preferredDomain    ? `Preferred domain: ${body.preferredDomain}` : null,
    body.preferredCallTime  ? `Best time to call: ${body.preferredCallTime}` : null,
    body.servicesWanted     ? `Services wanted: ${body.servicesWanted}` : null,
    body.designChanges      ? `Design preferences: ${body.designChanges}` : null,
    body.notes              ? `Notes: ${body.notes}` : null,
    `Preview: ${record.preview_url as string}`,
  ].filter(Boolean).join("\n");

  // Create Lead
  const leadId = crypto.randomUUID();
  await sql`
    INSERT INTO "Lead" (
      id, name, email, company, phone, service, message,
      status, source, score, value, notes, "createdAt", "updatedAt"
    ) VALUES (
      ${leadId}, ${name.trim()}, ${email.trim()},
      ${businessName}, ${body.phone ?? null},
      ${"Website"}, ${"Responded to website preview outreach"},
      ${"interested"}, ${"Website Preview Outreach"},
      ${80}, ${299}, ${notes},
      ${now}, ${now}
    )
  `;

  // Create Project
  const projectId = crypto.randomUUID();
  await sql`
    INSERT INTO "Project" (
      id, name, "clientName", status, budget, spent, progress,
      "dueDate", notes, email, phone, "createdAt", "updatedAt"
    ) VALUES (
      ${projectId},
      ${`${businessName} — Website`},
      ${businessName},
      ${"planning"},
      ${299}, ${0}, ${5},
      ${null},
      ${notes},
      ${email.trim()},
      ${body.phone ?? null},
      ${now}, ${now}
    )
  `;

  // Link GeneratedSite to Project
  await sql`
    UPDATE "GeneratedSite"
    SET "projectId" = ${projectId}, "outreachStatus" = 'Responded', "updatedAt" = ${now}
    WHERE id = ${record.generated_site_id as string}
  `;

  // Save submission
  await sql`
    INSERT INTO "InterestFormSubmission" (
      outreach_record_id, name, phone, email, business_name,
      preferred_domain, services_wanted, design_changes,
      photo_urls, preferred_call_time, notes
    ) VALUES (
      ${record.id as string}, ${name.trim()}, ${body.phone ?? null},
      ${email.trim()}, ${businessName},
      ${body.preferredDomain ?? null}, ${body.servicesWanted ?? null},
      ${body.designChanges ?? null},
      ${body.photoUrls?.length ? body.photoUrls : null},
      ${body.preferredCallTime ?? null}, ${body.notes ?? null}
    )
  `;

  // Update outreach record
  await sql`
    UPDATE "OutreachRecord" SET
      outreach_status       = 'responded',
      form_submitted_at     = ${now},
      converted_lead_id     = ${leadId},
      converted_project_id  = ${projectId},
      updated_at            = ${now}
    WHERE id = ${record.id as string}
  `;

  return NextResponse.json({ ok: true, leadId, projectId });
}
