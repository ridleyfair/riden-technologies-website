import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendMail, isMsConfigured } from "@/lib/ms-graph";

type BriefAnswers = {
  businessName:       string;
  contactName:        string;
  email:              string;
  phone?:             string;
  serviceArea?:       string;
  servicesOffered?:   string;
  aboutBusiness?:     string;
  preferredDomain?:   string;
  existingDomain?:    string;
  logoUrl?:           string;
  brandColours?:      string;
  socialFacebook?:    string;
  socialInstagram?:   string;
  socialTikTok?:      string;
  socialLinkedIn?:    string;
  photoUrls?:         string[];
  galleryUrls?:       string[];
  testimonials?:      string;
  reviews?:           string;
  designStyle?:       string;
  competitorWebsites?: string;
  additionalNotes?:   string;
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

  const answers: BriefAnswers = await req.json();
  const { businessName, contactName, email } = answers;
  if (!contactName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Contact name and email are required" }, { status: 400 });
  }

  const now          = new Date();
  const bizName      = businessName?.trim() || (record.business_name as string) || "";
  const contactEmail = email.trim();

  // Build notes string with extra brief data
  const noteLines = [
    "Source: Website Brief Outreach",
    answers.preferredDomain   ? `Preferred domain: ${answers.preferredDomain}` : null,
    answers.existingDomain    ? `Existing website: ${answers.existingDomain}` : null,
    answers.brandColours      ? `Brand colours: ${answers.brandColours}` : null,
    answers.socialTikTok      ? `TikTok: ${answers.socialTikTok}` : null,
    answers.socialLinkedIn    ? `LinkedIn: ${answers.socialLinkedIn}` : null,
    answers.testimonials      ? `Testimonials:\n${answers.testimonials}` : null,
    answers.reviews           ? `Reviews:\n${answers.reviews}` : null,
    answers.designStyle       ? `Preferred design style: ${answers.designStyle}` : null,
    answers.competitorWebsites ? `Competitor websites:\n${answers.competitorWebsites}` : null,
    answers.additionalNotes   ? `Additional notes: ${answers.additionalNotes}` : null,
  ].filter(Boolean).join("\n");

  // Build photosJson
  const logoUrl     = (answers.logoUrl      ?? "").trim();
  const photoUrls   = (answers.photoUrls    ?? []).filter(Boolean);
  const galleryUrls = (answers.galleryUrls  ?? []).filter(Boolean);
  const allPhotos   = [...new Set([...photoUrls, ...galleryUrls])];
  const photosJson  = {
    ...(logoUrl      ? { logo: logoUrl } : {}),
    ...(allPhotos.length ? { heroImages: allPhotos, hero: allPhotos[0], gallery: allPhotos } : {}),
  };

  // Build reviewsJson from testimonials/reviews text
  const reviewsJson = answers.testimonials || answers.reviews
    ? JSON.stringify({
        testimonials: answers.testimonials ?? null,
        reviewsText:  answers.reviews ?? null,
      })
    : null;

  // ── 1. Create Lead ────────────────────────────────────────────────────────────
  const leadId = crypto.randomUUID();
  await sql`
    INSERT INTO "Lead" (
      id, name, email, company, phone, service, message,
      status, source, score, value, notes, "createdAt", "updatedAt"
    ) VALUES (
      ${leadId}, ${contactName.trim()}, ${contactEmail},
      ${bizName}, ${answers.phone ?? null},
      ${"Website"}, ${"Submitted website brief via outreach"},
      ${"interested"}, ${"Website Brief Outreach"},
      ${80}, ${299}, ${noteLines},
      ${now}, ${now}
    )
  `;

  // ── 2. Create Project ─────────────────────────────────────────────────────────
  const projectId = crypto.randomUUID();
  await sql`
    INSERT INTO "Project" (
      id, name, "clientName", status, budget, spent, progress,
      "dueDate", notes, email, phone, city, services, about,
      "socialFacebook", "socialInstagram", "photosJson", "reviewsJson",
      "createdAt", "updatedAt"
    ) VALUES (
      ${projectId},
      ${`${bizName} Website`},
      ${bizName},
      ${"Website Brief Submitted"},
      ${299}, ${0}, ${10},
      ${null},
      ${noteLines},
      ${contactEmail},
      ${answers.phone ?? null},
      ${answers.serviceArea ?? (record.location as string) ?? null},
      ${answers.servicesOffered ?? null},
      ${answers.aboutBusiness ?? null},
      ${answers.socialFacebook ?? null},
      ${answers.socialInstagram ?? null},
      ${Object.keys(photosJson).length ? JSON.stringify(photosJson) : null},
      ${reviewsJson},
      ${now}, ${now}
    )
  `;

  // ── 3. Update OutreachRecord ──────────────────────────────────────────────────
  await sql`
    UPDATE "OutreachRecord" SET
      outreach_status      = 'responded',
      form_submitted_at    = ${now},
      converted_lead_id    = ${leadId},
      converted_project_id = ${projectId},
      brief_answers        = ${JSON.stringify(answers)},
      updated_at           = ${now}
    WHERE id = ${record.id as string}
  `;

  // ── 4. Admin notification (best-effort) ───────────────────────────────────────
  if (isMsConfigured()) {
    try {
      const notifHtml = `
        <h2>New Website Brief Submitted</h2>
        <p><strong>Business:</strong> ${bizName}</p>
        <p><strong>Contact:</strong> ${contactName.trim()}</p>
        <p><strong>Email:</strong> ${contactEmail}</p>
        <p><strong>Phone:</strong> ${answers.phone ?? "—"}</p>
        <p><strong>Services:</strong> ${answers.servicesOffered ?? "—"}</p>
        <p><strong>Location:</strong> ${answers.serviceArea ?? record.location ?? "—"}</p>
        <p><a href="https://ridentechnologies.com/portal/leads">View Lead in CRM →</a></p>
      `;
      await sendMail({
        to:      "ridleyfair123@gmail.com",
        subject: `New website brief: ${bizName}`,
        html:    notifHtml,
      });
    } catch { /* notification failure must not block the response */ }
  }

  return NextResponse.json({ ok: true, leadId, projectId });
}
