type Jsonish = Record<string, unknown>;

type BuildProjectBriefInput = {
  possibleClient: Jsonish;
  leadId: string;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  photos?: string[];
  openingHours?: unknown[];
  socialFacebook?: string | null;
  socialInstagram?: string | null;
};

type MergeProjectBriefInput = {
  existing: Record<string, unknown>;
  generated: Record<string, unknown>;
};

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function arrayFromJson(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function openingHoursFromJson(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function inferIndustry(category: string): string {
  const text = category.toLowerCase();
  if (/plumb|electric|roof|build|carpen|paint|decorat|heating|drain|garage|mechanic/.test(text)) return "trades";
  if (/beauty|salon|spa|nail|lash|hair|barber|aesthetic/.test(text)) return "beauty";
  if (/restaurant|cafe|bar|pub|hotel|takeaway|food/.test(text)) return "hospitality";
  if (/doctor|dentist|clinic|health|physio|therapy/.test(text)) return "health";
  if (/shop|store|retail/.test(text)) return "retail";
  return "professional";
}

// Sector-family routing — mirrors SECTOR_TEMPLATE_KEYWORDS in
// /api/generate-website so imports and generation agree on the template.
const SECTOR_TEMPLATES: Array<{ templateId: string; pattern: RegExp }> = [
  { templateId: "outdoor-transform", pattern: /landscap|garden|driveway|paving|patio|fenc|tree surg|turf|decking|groundwork|artificial grass|hedge/ },
  { templateId: "emergency-trade",   pattern: /plumb|electric|gas engineer|gas safe|heating|boiler|locksmith|drain|pest control|emergency/ },
  { templateId: "reno-showcase",     pattern: /kitchen|bathroom|loft|extension|renovation|refurbish|builder|building|joiner|carpen|roof|solar/ },
  { templateId: "finish-decor",      pattern: /paint|decorat|plaster|tiler|tiling|floor|window fitt|glaz|render/ },
];

function inferTemplate(category: string): string {
  const text = category.toLowerCase();
  const sector = SECTOR_TEMPLATES.find((s) => s.pattern.test(text));
  if (sector) return sector.templateId;
  const industry = inferIndustry(category);
  if (industry === "trades") return "tradie-bold";
  if (industry === "beauty" || industry === "hospitality") return "beauty-pro-booking";
  return "modern-minimal";
}

function serviceSuggestions(category: string, description: string): string[] {
  const text = `${category} ${description}`.toLowerCase();
  if (/plumb|boiler|heating|drain|leak/.test(text)) {
    return [
      "Plumbing services",
      "Leaks and pipe repairs",
      "Bathroom and kitchen plumbing",
      "Boiler/heating enquiries — confirm exact coverage before publishing",
      "Emergency callouts — confirm availability before publishing",
    ];
  }
  if (/electric|rewire|charger|fuse/.test(text)) {
    return ["Electrical services", "Repairs and fault finding", "Installations", "Rewiring enquiries", "EV charger enquiries"];
  }
  if (/roof|gutter|fascia/.test(text)) {
    return ["Roofing services", "Roof repairs", "Guttering and fascias", "Inspections and quotes"];
  }
  if (/beauty|salon|spa|nail|lash|hair|barber|aesthetic/.test(text)) {
    return ["Treatments and services", "Consultations", "Bookings", "Aftercare advice"];
  }
  if (category) return [category, "Customer enquiries", "Quotes and consultations", "Local service information"];
  return ["Services to be confirmed", "Customer enquiries", "Quotes and consultations"];
}

function buildAbout({ name, category, city, address, description, rating, reviews, website }: {
  name: string;
  category: string;
  city: string;
  address: string;
  description: string;
  rating: number | null;
  reviews: number | null;
  website: string;
}): string {
  const parts: string[] = [];
  if (description) parts.push(description);
  else {
    const loc = city || address;
    const service = category ? ` ${category.toLowerCase()}` : " local";
    parts.push(`${name} is a${service} business${loc ? ` based in ${loc}` : ""}.`);
  }
  if (city || address) parts.push(`Location/service area from scraped data: ${city || address}.`);
  if (rating) parts.push(`${rating} Google rating${reviews ? ` from ${reviews} reviews` : ""}.`);
  if (website) parts.push(`Existing website found: ${website}.`);
  else parts.push("No existing website was listed in the scraped data, so the website brief should focus on creating a clear owned online presence.");
  parts.push("Please review and refine this About section before publishing so it only includes verified claims.");
  return parts.join("\n\n");
}

function buildWebsiteFactoryPlanSummary({ name, category, city, templateId }: { name: string; category: string; city: string; templateId: string }) {
  return {
    status: "planning_only",
    business: { name, niche: category || "local-service", location: city || null },
    templateSelection: { templateId, registryVersion: "riden-template-registry-v1" },
    safety: {
      noDeploy: true,
      noExternalOutreach: true,
      requiresApprovalBeforeGeneration: true,
      preserveCrmEdits: true,
    },
  };
}

export function buildProjectBriefFromPossibleClient(input: BuildProjectBriefInput) {
  const b = input.possibleClient;
  const name = str(b.name) || "Imported Lead";
  const category = str(b.category);
  const city = str(b.city);
  const address = str(b.address);
  const phone = input.phone ?? str(b.phone) ?? null;
  const email = input.email ?? str(b.email) ?? null;
  const website = str(b.website);
  const description = input.description ?? str(b.description);
  const photos = input.photos ?? arrayFromJson(b.photos_json);
  const openingHours = input.openingHours ?? openingHoursFromJson(b.opening_hours_json);
  const rating = num(b.rating);
  const reviews = num(b.reviews_count ?? b.reviewCount);
  const industry = inferIndustry(category);
  const templateId = inferTemplate(category);
  const services = serviceSuggestions(category, description).join("\n");
  const about = buildAbout({ name, category, city, address, description: description || "", rating, reviews, website });
  const socialFacebook = (input.socialFacebook ?? str(b.social_facebook)) || null;
  const socialInstagram = (input.socialInstagram ?? str(b.social_instagram)) || null;
  const possibleClientId = str(b.id);
  const leadTier = typeof b.lead_score === "object" && b.lead_score ? str((b.lead_score as Jsonish).lead_tier) : str(b.lead_tier);
  const leadScore = typeof b.lead_score === "object" && b.lead_score ? num((b.lead_score as Jsonish).total_score) : num(b.lead_score);
  const websiteFactoryPlan = buildWebsiteFactoryPlanSummary({ name, category, city, templateId });

  const notes = [
    "Auto-created from Possible Client import.",
    possibleClientId ? `Possible client ID: ${possibleClientId}` : null,
    input.leadId ? `Lead ID: ${input.leadId}` : null,
    `Recommended template: ${templateId}`,
    leadTier || leadScore !== null ? `Lead tier/score: ${leadTier || "unknown"}${leadScore !== null ? ` (${leadScore})` : ""}` : null,
    website ? `Existing website: ${website}` : "No existing website listed.",
    "Brief fields were prefilled from scraped business data. Review before publishing or sending to a prospect.",
  ].filter(Boolean).join("\n");

  return {
    name: `${name} Website Build`,
    clientName: name,
    status: "planning",
    progress: 5,
    budget: 0,
    spent: 0,
    notes,
    phone,
    email,
    city: city || null,
    postcode: str(b.postcode) || null,
    industry,
    services,
    about,
    accreditations: "",
    photosJson: JSON.stringify(photos),
    openingHours: openingHours.length ? JSON.stringify(openingHours) : null,
    socialFacebook,
    socialInstagram,
    leadId: input.leadId,
    possibleClientId: possibleClientId || null,
    source: "possible_client_import",
    recommendedTemplate: templateId,
    websiteFactoryPlanJson: JSON.stringify(websiteFactoryPlan),
  };
}

function hasHumanValue(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
}

export function mergeProjectBriefPreservingEdits({ existing, generated }: MergeProjectBriefInput) {
  const merged: Record<string, unknown> = { ...generated };
  for (const [key, existingValue] of Object.entries(existing)) {
    if (hasHumanValue(existingValue)) merged[key] = existingValue;
  }
  return merged;
}
