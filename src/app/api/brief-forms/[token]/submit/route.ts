import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type DayHours = { day: string; open: boolean; hours: string };

type FormAnswers = {
  businessName?:        string;
  industry?:            string;
  tradingYears?:        string;
  about?:               string;
  services?:            string[];
  customServices?:      string;
  capabilities?:        string[];
  phone?:               string;
  email?:               string;
  city?:                string;
  postcode?:            string;
  openingHoursDays?:    DayHours[];
  socialFacebook?:      string;
  socialInstagram?:     string;
  logoUrl?:             string;
  heroUrls?:            string[];
  galleryUrls?:         string[];
  hasCheckatrade?:      boolean;
  checkatradeUrl?:      string;
  accreditations?:      string[];
  customAccreditations?: string;
  extras?:              string;
};

function mapAnswers(answers: FormAnswers) {
  // Services: checked items + custom lines
  const serviceLines = [
    ...(answers.services ?? []),
    ...(answers.customServices ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
  ];
  const services = serviceLines.join("\n");

  // About: description + trading years + capabilities
  let about = (answers.about ?? "").trim();
  if (answers.tradingYears) {
    about = [about, `Trading for ${answers.tradingYears}.`].filter(Boolean).join("\n\n");
  }
  if ((answers.capabilities ?? []).length > 0) {
    about = [about, `We offer: ${(answers.capabilities ?? []).join(", ")}.`].filter(Boolean).join("\n\n");
  }
  if ((answers.extras ?? "").trim()) {
    about = [about, (answers.extras ?? "").trim()].filter(Boolean).join("\n\n");
  }

  // Opening hours: e.g. "Mon 8am-5pm, Tue 8am-5pm, Wed Closed"
  const hourParts = (answers.openingHoursDays ?? [])
    .filter((h) => h.open && h.hours.trim())
    .map((h) => `${h.day} ${h.hours.trim()}`);
  const openingHours = hourParts.join(", ");

  // Accreditations
  const accredParts = [...(answers.accreditations ?? [])];
  if ((answers.customAccreditations ?? "").trim()) accredParts.push((answers.customAccreditations ?? "").trim());
  if (answers.hasCheckatrade && (answers.checkatradeUrl ?? "").trim()) {
    accredParts.push(`Checkatrade: ${(answers.checkatradeUrl ?? "").trim()}`);
  } else if (answers.hasCheckatrade) {
    accredParts.push("Checkatrade");
  }
  const accreditations = accredParts.join(", ");

  return {
    industry:        answers.industry       || "trades",
    services:        services               || undefined,
    about:           about                  || undefined,
    phone:           answers.phone          || undefined,
    email:           answers.email          || undefined,
    city:            answers.city           || undefined,
    postcode:        answers.postcode       || undefined,
    openingHours:    openingHours           || undefined,
    socialFacebook:  answers.socialFacebook || undefined,
    socialInstagram: answers.socialInstagram || undefined,
    accreditations:  accreditations         || undefined,
  };
}

// Public — no auth. Token is the credential.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getDb();

  const [form] = await sql`
    SELECT id, project_id, status FROM "ClientBriefForm"
    WHERE token = ${token} LIMIT 1
  `;
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (form.status === "submitted") return NextResponse.json({ error: "Already submitted" }, { status: 409 });

  const answers: FormAnswers = await req.json();
  const brief = mapAnswers(answers);

  // Patch project with mapped brief fields + photos
  const [project] = await sql`SELECT * FROM "Project" WHERE id = ${form.project_id as string} LIMIT 1`;
  if (project) {
    const ex = project as Record<string, unknown>;
    const merged: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(brief)) {
      merged[k] = v !== undefined ? v : ex[k];
    }

    // Merge photos into photosJson — preserve any existing complex fields (trust cards, colours, etc.)
    let existingPhotos: Record<string, unknown> = {};
    try { existingPhotos = JSON.parse((ex.photosJson as string) ?? "{}"); } catch { /* ignore */ }
    if (Array.isArray(existingPhotos)) existingPhotos = {};

    const logoUrl     = (answers.logoUrl    ?? "").trim();
    const heroUrls    = (answers.heroUrls   ?? []).filter(Boolean);
    const galleryUrls = (answers.galleryUrls ?? []).filter(Boolean);
    const newPhotosJson = {
      ...existingPhotos,
      ...(logoUrl        ? { logo: logoUrl } : {}),
      ...(heroUrls.length ? {
        heroImages: heroUrls,
        hero:       heroUrls[0],
      } : {}),
      ...(galleryUrls.length ? {
        gallery: galleryUrls,
      } : {}),
    };

    const now = new Date();
    await sql`
      UPDATE "Project" SET
        industry          = ${merged.industry as string},
        services          = ${merged.services as string ?? ex.services as string},
        about             = ${merged.about as string ?? ex.about as string},
        phone             = ${merged.phone as string ?? ex.phone as string},
        email             = ${merged.email as string ?? ex.email as string},
        city              = ${merged.city as string ?? ex.city as string},
        postcode          = ${merged.postcode as string ?? ex.postcode as string},
        "openingHours"    = ${merged.openingHours as string ?? ex.openingHours as string},
        "socialFacebook"  = ${merged.socialFacebook as string ?? ex.socialFacebook as string},
        "socialInstagram" = ${merged.socialInstagram as string ?? ex.socialInstagram as string},
        accreditations    = ${merged.accreditations as string ?? ex.accreditations as string},
        "photosJson"      = ${JSON.stringify(newPhotosJson)},
        "updatedAt"       = ${now}
      WHERE id = ${form.project_id as string}
    `;
  }

  // Mark form submitted
  await sql`
    UPDATE "ClientBriefForm"
    SET status = 'submitted', answers = ${JSON.stringify(answers)}, submitted_at = NOW()
    WHERE id = ${form.id as string}
  `;

  return NextResponse.json({ ok: true });
}
