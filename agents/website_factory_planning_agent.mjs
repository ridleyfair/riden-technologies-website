#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectTemplateForLead, buildVariantPlanForLead } from './template_registry.mjs';

function parseJson(value) {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

function compact(items) {
  return [...new Set(items.filter(Boolean))];
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || null;
}

function businessNameFromLead(lead = {}, data = {}) {
  return firstNonEmpty(lead.company, lead.name, data.name, data.businessName, data.title) || 'Unknown business';
}

function locationFromLead(lead = {}, data = {}) {
  return firstNonEmpty(lead.city, lead.location, data.city, data.town, data.area, data.address, data.location) || null;
}

function websiteFromLead(lead = {}, data = {}) {
  return firstNonEmpty(lead.website, lead.url, data.website, data.url) || null;
}

function phoneFromLead(lead = {}, data = {}) {
  return firstNonEmpty(lead.phone, lead.mobile, data.phone, data.telephone, data.mobile) || null;
}

function emailFromLead(lead = {}, data = {}) {
  return firstNonEmpty(lead.email, data.email) || null;
}

function hasGallerySignals(lead = {}, data = {}) {
  const text = [lead.notes, data.photos, data.photoCount, data.images, data.gallery, data.enrichment?.websiteSignals?.hasBeforeAfterSignal]
    .filter((value) => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase();
  return /photo|image|gallery|before|after|portfolio|our work|completed job|true|[1-9]/.test(text);
}

function buildSections(templateSelection, business) {
  const niche = templateSelection.niche;
  const sections = [
    {
      id: 'hero',
      goal: `Position ${business.name} clearly and drive the primary enquiry action above the fold.`,
      editableFields: ['headline', 'subheadline', 'primaryCtaLabel', 'primaryCtaTarget'],
    },
    {
      id: 'trust-bar',
      goal: 'Surface rating, reviews, years in business, response speed, or service-area proof where verified.',
      editableFields: ['rating', 'reviewCount', 'trustBadges'],
    },
    {
      id: 'services',
      goal: `Explain the main ${niche === 'plumber' ? 'plumbing' : niche} services in plain customer language.`,
      editableFields: ['services'],
    },
    {
      id: 'gallery',
      goal: templateSelection.template.galleryStrategy,
      editableFields: ['galleryImages', 'galleryCaptions'],
    },
    {
      id: 'reviews',
      goal: 'Use real reviews/testimonials only; keep any placeholder copy internal until verified.',
      editableFields: ['testimonials', 'reviewSource'],
    },
    {
      id: 'faq',
      goal: 'Answer common buying objections and reduce friction before enquiry.',
      editableFields: ['faqs'],
    },
    {
      id: 'contact',
      goal: 'Make phone, quote, booking, and service-area details obvious on mobile.',
      editableFields: ['phone', 'email', 'serviceAreas', 'openingHours'],
    },
  ];

  if (['beauty', 'hospitality'].includes(niche)) {
    sections.splice(3, 0, {
      id: 'pricing',
      goal: 'Show treatments/packages, pricing-from copy, booking expectations, and cancellation policies if known.',
      editableFields: ['pricing', 'bookingUrl', 'policies'],
    });
  }

  return sections;
}

function copyAngleFor(templateSelection, business) {
  const place = business.location ? ` in ${business.location}` : '';
  if (templateSelection.niche === 'plumber') {
    return `Local plumber${place} website focused on fast calls, quote requests, emergency trust signals, reviews, and completed job proof.`;
  }
  if (['electrician', 'roofer', 'trades'].includes(templateSelection.niche)) {
    return `Local trade${place} website focused on quick enquiries, service clarity, proof of work, and trust.`;
  }
  if (['beauty', 'hospitality'].includes(templateSelection.niche)) {
    return `Premium booking-led${place} website focused on visuals, treatments/services, pricing clarity, reviews, and easy booking.`;
  }
  return `Credible local business${place} website focused on trust, clear services, proof, and low-friction enquiries.`;
}

function ctaStrategyFor(templateSelection, business) {
  if (['plumber', 'electrician', 'roofer', 'trades'].includes(templateSelection.niche)) {
    return {
      primary: business.phone ? `Call now: ${business.phone}` : 'Call now / request a quote once phone is confirmed',
      secondary: 'Request a free quote',
      placement: 'Hero, sticky mobile bar, after services, after gallery, FAQ, and footer.',
    };
  }
  if (['beauty', 'hospitality'].includes(templateSelection.niche)) {
    return {
      primary: 'Book now',
      secondary: 'View treatments/pricing',
      placement: 'Hero, treatment/pricing cards, gallery, booking section, and footer.',
    };
  }
  return {
    primary: 'Request a quote',
    secondary: 'View services',
    placement: 'Hero, services, proof/reviews, and footer.',
  };
}

function scoreReadiness({ business, hasGallery, data }) {
  let score = 100;
  const missingInfo = [];

  if (!business.name || business.name === 'Unknown business') { score -= 20; missingInfo.push('business name'); }
  if (!business.location) { score -= 10; missingInfo.push('service area or location'); }
  if (!business.phone) { score -= 20; missingInfo.push('phone'); }
  if (!business.email) { score -= 5; missingInfo.push('email'); }
  if (!hasGallery) { score -= 15; missingInfo.push('business photos or gallery assets'); }
  if (!data.rating && !data.reviews && !data.reviewCount) { score -= 10; missingInfo.push('verified review/rating data'); }
  if (!data.services && !data.enrichment?.profile?.services) { score -= 10; missingInfo.push('confirmed service list'); }

  const clamped = Math.max(0, Math.min(100, score));
  return {
    score: clamped,
    label: clamped >= 85 ? 'ready_for_preview_payload' : clamped >= 65 ? 'needs_light_review' : 'needs_crm_enrichment',
    missingInfo: compact(missingInfo),
  };
}

function risksFor(business, data) {
  const risks = [
    'Avoid unverified guarantees, accreditations, emergency availability, pricing, or response-time claims.',
    'Use real reviews/photos only after CRM confirmation; placeholders must stay internal.',
    'Do not overwrite CRM-edited project brief fields with scraped data without review.',
  ];
  if (!business.website) risks.push('Do not imply an existing website migration; lead currently has no verified website listed.');
  if (!data.rating && !data.reviews && !data.reviewCount) risks.push('Review/rating claims are unverified and must not be published yet.');
  return risks;
}

export function buildWebsiteFactoryPlan(lead = {}, options = {}) {
  const data = parseJson(lead.scraperDataJson);
  const templateSelection = selectTemplateForLead(lead);
  const variantPlan = buildVariantPlanForLead(lead);
  const business = {
    name: businessNameFromLead(lead, data),
    niche: templateSelection.niche,
    service: firstNonEmpty(lead.service, data.category, data.service),
    location: locationFromLead(lead, data),
    phone: phoneFromLead(lead, data),
    email: emailFromLead(lead, data),
    website: websiteFromLead(lead, data),
    rating: data.rating || data.stars || null,
    reviewCount: data.reviews || data.reviewCount || null,
    address: firstNonEmpty(lead.address, data.address),
  };
  const hasGallery = hasGallerySignals(lead, data);
  const readiness = scoreReadiness({ business, hasGallery, data });

  return {
    planId: options.planId || `website-plan-${lead.id || business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lead'}`,
    status: 'planning_only',
    createdAt: options.createdAt || new Date().toISOString(),
    lead: {
      id: lead.id || null,
      source: lead.source || data.source || null,
      crmStatus: lead.status || null,
    },
    business,
    templateSelection: {
      templateId: templateSelection.templateId,
      templateName: templateSelection.template.name,
      niche: templateSelection.niche,
      reason: templateSelection.reason,
      sourceRepoPath: templateSelection.template.sourceRepoPath,
      registryVersion: 'riden-template-registry-v1',
    },
    variantPlan,
    sections: buildSections(templateSelection, business),
    copyAngle: copyAngleFor(templateSelection, business),
    ctaStrategy: ctaStrategyFor(templateSelection, business),
    galleryStrategy: templateSelection.template.galleryStrategy,
    serviceAreaStrategy: business.location
      ? `Use ${business.location} as the primary service-area anchor and only add nearby areas once verified in CRM.`
      : 'Ask user/CRM to confirm service areas before generating local SEO copy.',
    trustStrategy: 'Use verified Google rating, review count, accreditations, guarantees, and team proof only when present in CRM/project brief.',
    editableCrmFields: [
      'businessDescription',
      'services',
      'serviceAreas',
      'phone',
      'email',
      'openingHours',
      'galleryImages',
      'testimonials',
      'pricing',
      'ctaPreference',
    ],
    readiness,
    risksToAvoid: risksFor(business, data),
    safety: {
      noDeploy: true,
      noExternalOutreach: true,
      requiresApprovalBeforeGeneration: true,
      preserveCrmEdits: true,
    },
  };
}

export async function writeWebsiteFactoryPlan(lead = {}, options = {}) {
  const plan = buildWebsiteFactoryPlan(lead, options);
  const outputDir = options.outputDir || '/home/skids/Riden-Technologies-Website/agent_reports/website_factory_plans';
  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `${plan.planId}.json`.replace(/[^a-zA-Z0-9._-]/g, '-');
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return { wrote: true, path: filePath, plan };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node agents/website_factory_planning_agent.mjs <lead-json-file> [output-dir]');
    process.exitCode = 1;
    return;
  }
  const lead = JSON.parse(await fs.readFile(inputPath, 'utf8'));
  const result = await writeWebsiteFactoryPlan(lead, { outputDir: process.argv[3] });
  console.log(JSON.stringify(result, null, 2));
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
