import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
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

    const planLabel = plan === "pro" ? "Pro (£299 setup + £50/mo)"
      : plan === "pro_plus" ? "Pro+ (£499 setup + £99/mo)"
      : plan === "enterprise" ? "Enterprise (£999 setup + £199/mo)"
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
        ${[brandColours && `Colours: ${brandColours}`, designStyle && `Style: ${designStyle}`].filter(Boolean).join(" | ") || null},
        'new', 'website', 0, ${now}, ${now}
      )
    `;

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }
}
