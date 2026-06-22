import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const CONTACT_LIMIT = 3;
const CONTACT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  try {
    const sql = getDb();
    const windowStart = new Date(Date.now() - CONTACT_WINDOW_MS);
    const rows = await sql`
      SELECT COUNT(*) AS count FROM "Lead"
      WHERE source = 'website' AND notes ILIKE ${`%IP:${ip}%`} AND "createdAt" > ${windowStart}
    `;
    if (Number(rows[0]?.count ?? 0) >= CONTACT_LIMIT) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
    }
  } catch { /* fail open */ }

  try {
    const body = await req.json();
    const {
      name, email, phone, city,
      company, industry, currentWebsite,
      servicesOffered, targetCustomers,
      plan, deadline,
      brandColours, designStyle,
      facebook, instagram, tiktok, linkedin,
      references, notes,
      // legacy single-step fields
      service, message,
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const planLabel = plan === "pro" ? "Pro (£199 build + £29.99/mo)"
      : service || "";

    const socialParts = [
      facebook && `FB: ${facebook}`,
      instagram && `IG: ${instagram}`,
      tiktok && `TikTok: ${tiktok}`,
      linkedin && `LinkedIn: ${linkedin}`,
    ].filter(Boolean).join(" | ");

    const brief = message || [
      "=== WEBSITE INTAKE BRIEF ===",
      "",
      "CONTACT",
      phone && `Phone: ${phone}`,
      city && `Location: ${city}`,
      "",
      "BUSINESS",
      industry && `Industry: ${industry}`,
      currentWebsite && `Current website: ${currentWebsite}`,
      servicesOffered && `Services/products: ${servicesOffered}`,
      targetCustomers && `Target customers: ${targetCustomers}`,
      "",
      "PLAN",
      planLabel && `Selected plan: ${planLabel}`,
      deadline && `Deadline: ${deadline}`,
      "",
      "DESIGN",
      brandColours && `Brand colours: ${brandColours}`,
      designStyle && `Style preference: ${designStyle}`,
      socialParts && `Social media: ${socialParts}`,
      references && `References: ${references}`,
      "",
      "NOTES",
      notes || "None",
    ].filter((line) => line !== false && line !== undefined && line !== "").join("\n");

    const sql = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    await sql`
      INSERT INTO "Lead" (id, name, email, company, service, message, phone, notes, status, source, score, "createdAt", "updatedAt")
      VALUES (
        ${id}, ${name}, ${email},
        ${company || null},
        ${planLabel || null},
        ${brief},
        ${phone || null},
        ${[brandColours && `Colours: ${brandColours}`, designStyle && `Style: ${designStyle}`, `IP:${ip}`].filter(Boolean).join(" | ") || null},
        'new', 'website', 0, ${now}, ${now}
      )
    `;

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }
}
