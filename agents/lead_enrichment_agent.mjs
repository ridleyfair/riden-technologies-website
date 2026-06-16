#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { selectTemplateForLead, buildVariantPlanForLead } from './template_registry.mjs';

const ENV_FILES = [
  '/home/skids/.hermes/.env',
  '/home/skids/Riden-Technologies-Website/.env.local',
  '/home/skids/Riden-Technologies-Website/.env',
];
const REPORT_DIR = '/home/skids/Riden-Technologies-Website/agent_reports';

function loadEnv() {
  for (const file of ENV_FILES) {
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function stripTags(html = '') {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function extractWebsiteSignals(html = '', url = '') {
  const source = String(html || '');
  const text = stripTags(source);
  const lower = text.toLowerCase();
  const title = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || null;
  const metaDescription = source.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() || null;
  const imgAlts = [...source.matchAll(/<img[^>]+alt=["']([^"']+)["']/gi)].map((m) => m[1].toLowerCase());
  const serviceMap = [
    ['emergency plumbing', /emergency plumber|emergency plumbing/],
    ['boiler repair', /boiler repair|boiler service|gas boiler/],
    ['leak repair', /leak repair|leaking pipe|burst pipe/],
    ['bathroom fitting', /bathroom fitting|bathroom installation/],
    ['blocked drains', /blocked drain|drain unblocking|drainage/],
    ['central heating', /central heating|radiator/],
  ];
  return {
    url,
    title,
    metaDescription,
    textLength: text.length,
    hasWebsite: Boolean(url),
    hasPhoneCta: /call now|tel:|phone|mobile|ring us/i.test(source),
    hasQuoteCta: /free quote|get a quote|request a quote|quote today|book online|contact us/i.test(lower),
    hasEmergencySignal: /24\/7|emergency|same day|urgent|callout/i.test(lower),
    hasBeforeAfterSignal: /before and after|before\/after|gallery|our work|case stud/i.test(lower) || imgAlts.some((alt) => /before|after|gallery|job|repair/.test(alt)),
    hasReviewSignal: /review|testimonial|trustpilot|checkatrade|rated|google reviews/i.test(lower),
    serviceSignals: unique(serviceMap.filter(([, re]) => re.test(lower)).map(([name]) => name)),
  };
}

export function classifyWebsiteQuality(signals = {}) {
  if (!signals.hasWebsite) {
    return {
      grade: 'missing',
      opportunityScore: 90,
      summary: 'No website found or listed. Strong opportunity for a mobile-friendly local trade site.',
      painPoints: ['No website found', 'No owned online presence', 'Harder to convert Google searches into enquiries'],
    };
  }

  let score = 35;
  const painPoints = [];
  const strengths = [];
  if ((signals.textLength || 0) < 900) {
    score += 18;
    painPoints.push('Thin website content');
  } else strengths.push('Reasonable page content');
  if (!signals.hasPhoneCta) {
    score += 15;
    painPoints.push('Weak phone call CTA');
  } else strengths.push('Phone CTA present');
  if (!signals.hasQuoteCta) {
    score += 12;
    painPoints.push('Weak quote/request CTA');
  } else strengths.push('Quote CTA present');
  if (!signals.hasBeforeAfterSignal) {
    score += 8;
    painPoints.push('No clear before/after or work gallery signal');
  } else strengths.push('Gallery/work proof signal present');
  if (!signals.hasReviewSignal) {
    score += 7;
    painPoints.push('Limited review/testimonial signal');
  } else strengths.push('Review signal present');

  const grade = score >= 75 ? 'weak' : score >= 55 ? 'average' : 'good';
  return {
    grade,
    opportunityScore: Math.min(score, 100),
    summary: grade === 'good'
      ? 'Website has several conversion basics, but can still be improved with niche-specific sections.'
      : 'Website likely has conversion gaps that a niche-specific redesign could improve.',
    painPoints,
    strengths,
  };
}

function parseScraperData(lead) {
  try { return JSON.parse(lead.scraperDataJson || '{}'); } catch { return {}; }
}

export function buildNicheProfile(lead) {
  const data = parseScraperData(lead);
  const service = `${lead.service || data.category || ''}`.toLowerCase();
  const target = `${lead.notes || ''} ${data.target || ''}`.toLowerCase();
  const niche = /plumb|boiler|drain/.test(`${service} ${target}`) ? 'plumber' : 'local-service';

  const templateSelection = selectTemplateForLead(lead);
  const variantPlan = buildVariantPlanForLead(lead);

  if (niche === 'plumber') {
    return {
      niche,
      recommendedTemplate: templateSelection.templateId,
      recommendedTemplateName: templateSelection.template.name,
      templateReason: templateSelection.reason,
      templateRegistryVersion: 'riden-template-registry-v1',
      variantPlan,
      homepageSections: [
        'Emergency plumbing hero with click-to-call CTA',
        'Google reviews and local trust strip',
        'Core services grid: leaks, boilers, drains, bathrooms, heating',
        'Before/after job gallery',
        'Service area coverage section',
        'Fast quote/contact form',
      ],
      servicePages: ['Emergency plumbing', 'Boiler repair', 'Leak repair', 'Blocked drains', 'Bathroom fitting', 'Central heating'],
      galleryStrategy: [
        'Use before/after repair photos where available',
        'Group photos by job type: leaks, boilers, bathrooms, drainage',
        'Prioritise real vans, team, tools, and completed work over generic stock photos',
      ],
      trustSignals: ['Google reviews', 'Local service areas', 'Emergency availability', 'Qualified/insured wording only if verified', 'Clear phone CTA'],
      ctaStrategy: 'Primary CTA should be call/request quote, repeated above the fold and after services/gallery.',
    };
  }

  return {
    niche: templateSelection.niche,
    recommendedTemplate: templateSelection.templateId,
    recommendedTemplateName: templateSelection.template.name,
    templateReason: templateSelection.reason,
    templateRegistryVersion: 'riden-template-registry-v1',
    variantPlan,
    homepageSections: ['Hero with CTA', 'Services', 'Reviews/proof', 'Gallery', 'Service areas', 'Contact form'],
    servicePages: ['Main service page'],
    galleryStrategy: ['Use real work photos and captions where available'],
    trustSignals: ['Reviews', 'Local coverage', 'Clear contact details'],
    ctaStrategy: 'Use a clear request quote/contact CTA.',
  };
}

function ratingPhrase(lead) {
  const data = parseScraperData(lead);
  const rating = data.rating ?? lead.rating;
  const reviews = data.reviews_count ?? data.reviews ?? lead.reviews;
  if (rating && reviews && Number(reviews) >= 5) return `They already have some useful social proof (${rating} stars from ${reviews} reviews).`;
  if (rating && reviews) return `They have a small Google review footprint (${rating} stars from ${reviews} review${Number(reviews) === 1 ? '' : 's'}).`;
  return 'Review footprint is unclear from available data.';
}

export function buildOutreachAngle(lead, profile, quality) {
  const data = parseScraperData(lead);
  const place = data.city || 'their local area';
  const noSite = quality.grade === 'missing';
  const primaryAngle = noSite
    ? `No website presence found for a ${profile.niche} business in ${place}.`
    : `Current website has ${quality.painPoints?.[0]?.toLowerCase() || 'conversion'} gaps for a ${profile.niche} business.`;
  return {
    primaryAngle,
    suggestedWhatsAppHook: noSite
      ? `I noticed there wasn’t much of a website presence showing and thought a quick example of a local ${profile.niche} site could be useful.`
      : `I had a quick look at the site and noticed a few ways it could make enquiries easier, especially on mobile. Would you be open to seeing a quick example?`,
    websiteFactoryBrief: `Create a ${profile.recommendedTemplate} concept focused on ${profile.ctaStrategy}`,
    evidence: [ratingPhrase(lead), quality.summary],
    claimsToAvoid: ['Guaranteed enquiries', 'Verified qualifications unless source confirms it', 'Fake urgency', 'Claims about revenue uplift'],
  };
}

export function buildEnrichmentNotes(lead, enrichment) {
  const { profile, quality, angle } = enrichment;
  return [
    'Source: Riden Lead Enrichment Agent v1',
    'No outreach sent. Internal enrichment only.',
    `Niche: ${profile.niche}`,
    `Recommended template: ${profile.recommendedTemplate}`,
    profile.recommendedTemplateName ? `Recommended template name: ${profile.recommendedTemplateName}` : null,
    profile.templateReason ? `Template reason: ${profile.templateReason}` : null,
    profile.templateRegistryVersion ? `Template registry version: ${profile.templateRegistryVersion}` : null,
    profile.variantPlan?.variants?.length ? `Variant plan: ${profile.variantPlan.variants.map((v) => `${v.variant}:${v.templateId}:${v.status}`).join(', ')}` : null,
    `Website quality: ${quality.grade} (${quality.opportunityScore}/100 opportunity)`,
    `Primary outreach angle: ${angle.primaryAngle}`,
    quality.painPoints?.length ? `Pain points: ${quality.painPoints.join('; ')}` : null,
    `Website factory brief: ${angle.websiteFactoryBrief}`,
  ].filter(Boolean).join('\n');
}

export function mergeEnrichmentNotes(existingNotes = '', enrichmentNotes = '') {
  const existing = String(existingNotes || '').trim();
  const cleaned = existing
    .replace(/\n?---\nSource: Riden Lead Enrichment Agent v1[\s\S]*?(?=\n---\n|$)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return `${cleaned}${cleaned ? '\n\n---\n' : ''}${enrichmentNotes}`.trim();
}

export function mergeScraperData(existingJson, enrichment) {
  let existing = {};
  try { existing = JSON.parse(existingJson || '{}'); } catch { existing = {}; }
  return {
    ...existing,
    enrichment: {
      source_agent: 'riden-lead-enrichment-v1',
      enriched_at: new Date().toISOString(),
      ...enrichment,
    },
  };
}

async function fetchWebsiteSignals(website) {
  if (!website) return { hasWebsite: false };
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) return { hasWebsite: true, fetchError: 'SCRAPINGBEE_API_KEY missing' };
  const params = new URLSearchParams({ api_key: apiKey, url: website, render_js: 'false', block_resources: 'true', timeout: '30000' });
  try {
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, { signal: AbortSignal.timeout(40000) });
    const html = await res.text();
    return { ...extractWebsiteSignals(html, website), status: res.status, fetchOk: res.ok };
  } catch (err) {
    return { hasWebsite: true, url: website, fetchOk: false, fetchError: `${err.name || 'Error'}: ${err.message || err}` };
  }
}

function websiteFromLead(lead) {
  const data = parseScraperData(lead);
  return data.website || data.url || null;
}

async function enrichLead(lead) {
  const websiteSignals = await fetchWebsiteSignals(websiteFromLead(lead));
  const quality = classifyWebsiteQuality(websiteSignals);
  const profile = buildNicheProfile(lead);
  const angle = buildOutreachAngle(lead, profile, quality);
  return { leadId: lead.id, businessName: lead.company || lead.name, websiteSignals, quality, profile, angle };
}

function parseArgs(argv) {
  const opts = { limit: 5, target: 'London plumbers', write: true };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--limit') opts.limit = Number(argv[++i]);
    else if (argv[i] === '--target') opts.target = argv[++i];
    else if (argv[i] === '--report-only') opts.write = false;
  }
  return opts;
}

async function fetchLeads(sql, opts) {
  return sql`
    SELECT id, name, company, phone, service, score, status, source, notes, "scraperDataJson", "createdAt"
    FROM "Lead"
    WHERE source = 'agent-lead-discovery'
      AND coalesce(notes, '') ILIKE ${`%Target: ${opts.target}%`}
      AND ("scraperDataJson" IS NULL OR "scraperDataJson" NOT ILIKE '%riden-template-registry-v1%')
    ORDER BY score DESC, "createdAt" DESC
    LIMIT ${opts.limit}
  `;
}

async function updateLead(sql, lead, enrichment) {
  const enrichmentNotes = buildEnrichmentNotes(lead, enrichment);
  const merged = mergeScraperData(lead.scraperDataJson, enrichment);
  const notes = mergeEnrichmentNotes(lead.notes || '', enrichmentNotes);
  await sql`
    UPDATE "Lead"
    SET notes = ${notes}, "scraperDataJson" = ${JSON.stringify(merged)}, "updatedAt" = ${new Date()}
    WHERE id = ${lead.id}
  `;
}

function slugName(name) {
  return String(name || 'enrichment').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'enrichment';
}

function formatReport(items, reportPath, opts) {
  const lines = [
    '🧠 Riden Lead Enrichment Agent v1',
    `Target: ${opts.target}`,
    `Enriched: ${items.length} leads`,
    `Mode: ${opts.write ? 'internal database enrichment only' : 'report-only'}`,
    'No outreach sent.',
    '',
  ];
  for (const [idx, item] of items.entries()) {
    lines.push(`${idx + 1}. ${item.businessName}`);
    lines.push(`   Niche: ${item.profile.niche}`);
    lines.push(`   Template: ${item.profile.recommendedTemplate}`);
    lines.push(`   Website quality: ${item.quality.grade} (${item.quality.opportunityScore}/100 opportunity)`);
    lines.push(`   Angle: ${item.angle.primaryAngle}`);
  }
  lines.push('', `Full JSON report saved: ${reportPath}`);
  lines.push('Next step: Outreach Draft Agent can use this richer context; later Website Factory Agent can use the websiteFactoryBrief.');
  return lines.join('\n');
}

export async function run(argv = process.argv.slice(2)) {
  loadEnv();
  const opts = parseArgs(argv);
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  const sql = neon(process.env.DATABASE_URL);
  const leads = await fetchLeads(sql, opts);
  const items = [];
  for (const lead of leads) {
    const enrichment = await enrichLead(lead);
    items.push(enrichment);
    if (opts.write) await updateLead(sql, lead, enrichment);
  }
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const reportPath = path.join(REPORT_DIR, `${slugName(opts.target)}-lead-enrichment_${stamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ target: opts.target, write: opts.write, enriched: items }, null, 2));
  return formatReport(items, reportPath, opts);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  run().then((out) => console.log(out)).catch((err) => {
    console.error(`Riden Lead Enrichment Agent failed: ${err.stack || err.message || err}`);
    process.exit(1);
  });
}
