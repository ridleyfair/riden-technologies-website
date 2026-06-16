#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const DEFAULT_ENV_FILES = [
  '/home/skids/.hermes/.env',
  '/home/skids/Riden-Technologies-Website/.env.local',
  '/home/skids/Riden-Technologies-Website/.env',
];

const REPORT_DIR = '/home/skids/Riden-Technologies-Website/agent_reports';

function loadEnv(files = DEFAULT_ENV_FILES) {
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      value = value.replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function normalizePhone(phone) {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/[^0-9+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (digits.startsWith('0')) digits = `+44${digits.slice(1)}`;
  return digits || null;
}

function hostFromWebsite(website) {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function slugName(name) {
  return String(name || 'unknown')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

export function dedupeKey(lead) {
  const phone = normalizePhone(lead.phone);
  if (phone) return `phone:${phone.slice(0, 4)}****${phone.slice(-4)}`;
  const host = hostFromWebsite(lead.website);
  if (host) return `site:${host}`;
  return `name:${slugName(lead.name)}`;
}

export function normalizeLead(place) {
  return {
    name: place.title || place.name || 'Unknown business',
    category: place.categoryName || place.category || 'Plumber',
    address: place.address || null,
    city: place.city || 'London',
    phone: place.phone || null,
    normalizedPhone: normalizePhone(place.phone),
    website: place.website || null,
    websiteHost: hostFromWebsite(place.website),
    rating: place.totalScore ?? place.rating ?? null,
    reviews: place.reviewsCount ?? place.reviews_count ?? 0,
    mapsUrl: place.url || place.maps_url || null,
    raw: place,
  };
}

export function scoreLead(lead, site = {}) {
  let score = 0;
  const reasons = [];
  const reviews = Number(lead.reviews || 0);
  const rating = Number(lead.rating || 0);

  if (!lead.website) {
    score += 40;
    reasons.push('no website listed');
  } else if (!site.ok) {
    score += 35;
    reasons.push(`website fetch issue (${site.status || site.reason || 'unknown'})`);
  } else {
    const text = String(site.text || '').toLowerCase();
    if (text.length < 900) {
      score += 15;
      reasons.push('thin website content');
    }
    if (!/online booking|book online|request a quote|free quote|emergency|call now|get a quote/.test(text)) {
      score += 12;
      reasons.push('weak conversion CTA');
    }
    if (!/gallery|portfolio|case stud|before|testimonial|reviews/.test(text)) {
      score += 6;
      reasons.push('limited proof/portfolio signal');
    }
    if (Number(site.elapsed || 0) > 5) {
      score += 8;
      reasons.push('slow website response');
    }
  }

  if (reviews >= 50 && rating >= 4.5) {
    score += 20;
    reasons.push('strong reputation, worth premium pitch');
  } else if (reviews < 15) {
    score += 8;
    reasons.push('low review volume');
  }

  if (lead.phone) {
    score += 5;
    reasons.push('phone available');
  }

  return {
    ...lead,
    opportunityScore: Math.min(score, 100),
    reasons: reasons.slice(0, 6),
  };
}

export function buildLeadNotes(lead, target) {
  const lines = [
    'Source: Riden Lead Discovery Agent v2',
    `Target: ${target}`,
    'No outreach sent. Imported for review/enrichment only.',
    lead.address ? `Address: ${lead.address}` : null,
    lead.rating != null ? `Google rating: ${lead.rating} (${lead.reviews || 0} reviews)` : null,
    lead.website ? `Existing website: ${lead.website}` : 'No website listed',
    lead.mapsUrl ? `Google Maps: ${lead.mapsUrl}` : null,
    `Opportunity score: ${lead.opportunityScore}/100`,
    lead.reasons?.length ? `Reasons: ${lead.reasons.join('; ')}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

async function discoverPlaces({ industry, location, maxPlaces }) {
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN/APIFY_API_TOKEN is not configured');

  const actor = 'compass~crawler-google-places';
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=180&memory=4096`;
  const body = {
    searchStringsArray: [`${industry} ${location}`],
    locationQuery: `${location}, England, United Kingdom`,
    maxCrawledPlacesPerSearch: maxPlaces,
    language: 'en',
    countryCode: 'gb',
    maxReviews: 0,
    maxImages: 0,
    scrapeImageUrls: false,
    includeWebResults: false,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Apify error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Apify returned unexpected non-array response');
  return data;
}

async function fetchSiteSnapshot(website) {
  const key = process.env.SCRAPINGBEE_API_KEY;
  if (!key || !website) return { ok: false, reason: 'no key or website' };
  const params = new URLSearchParams({
    api_key: key,
    url: website,
    render_js: 'false',
    block_resources: 'true',
    return_page_text: 'true',
    timeout: '30000',
  });
  const start = Date.now();
  try {
    const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, { signal: AbortSignal.timeout(40000) });
    const text = await res.text();
    return { ok: res.ok, status: res.status, elapsed: (Date.now() - start) / 1000, text: text.slice(0, 8000) };
  } catch (err) {
    return { ok: false, reason: `${err.name || 'Error'}: ${err.message || err}` };
  }
}

async function existingLead(sql, lead) {
  if (lead.normalizedPhone) {
    const rows = await sql`SELECT id, name, phone FROM "Lead" WHERE regexp_replace(coalesce(phone,''), '[^0-9+]', '', 'g') IN (${lead.normalizedPhone}, ${lead.normalizedPhone.replace(/^\+44/, '0')}) LIMIT 1`;
    if (rows[0]) return rows[0];
  }
  const rows = await sql`SELECT id, name, phone FROM "Lead" WHERE lower(company) = lower(${lead.name}) OR lower(name) = lower(${lead.name}) LIMIT 1`;
  return rows[0] || null;
}

async function importLead(sql, lead, target) {
  const duplicate = await existingLead(sql, lead);
  if (duplicate) return { status: 'duplicate', id: duplicate.id, duplicate };

  const now = new Date();
  const scraperDataJson = JSON.stringify({
    source_agent: 'riden-lead-discovery-v2',
    target,
    category: lead.category,
    city: lead.city,
    address: lead.address,
    rating: lead.rating,
    reviews_count: lead.reviews,
    website: lead.website,
    website_host: lead.websiteHost,
    maps_url: lead.mapsUrl,
    opportunity_score: lead.opportunityScore,
    reasons: lead.reasons,
    raw: lead.raw,
  });
  const notes = buildLeadNotes(lead, target);
  const id = crypto.randomUUID();
  const email = '';
  const message = 'Imported by Riden Lead Discovery Agent v2 for review. No outreach sent.';

  const rows = await sql`
    INSERT INTO "Lead" (
      id, name, email, company, phone, service, message,
      status, source, score, value, notes, "scraperDataJson",
      "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${lead.name}, ${email}, ${lead.name}, ${lead.phone}, ${lead.category}, ${message},
      ${'new'}, ${'agent-lead-discovery'}, ${lead.opportunityScore}, ${0}, ${notes}, ${scraperDataJson},
      ${now}, ${now}
    )
    RETURNING id, name, phone, score
  `;
  return { status: 'imported', id: rows[0].id, row: rows[0] };
}

function parseArgs(argv) {
  const opts = { industry: 'plumbers', location: 'London', maxPlaces: 10, minScore: 45, limit: 5, import: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--import') opts.import = true;
    else if (arg === '--industry') opts.industry = argv[++i];
    else if (arg === '--location') opts.location = argv[++i];
    else if (arg === '--max') opts.maxPlaces = Number(argv[++i]);
    else if (arg === '--min-score') opts.minScore = Number(argv[++i]);
    else if (arg === '--limit') opts.limit = Number(argv[++i]);
  }
  return opts;
}

function formatReport({ target, leads, importResults, reportPath, didImport }) {
  const lines = [
    '🔎 Riden Lead Discovery Agent v2',
    `Target: ${target}`,
    `Found/scored: ${leads.length} businesses`,
    `Mode: ${didImport ? 'DB import enabled — no outreach sent' : 'report-only — no database writes, no outreach sent'}`,
  ];
  if (importResults) {
    const imported = importResults.filter((r) => r.status === 'imported').length;
    const duplicates = importResults.filter((r) => r.status === 'duplicate').length;
    lines.push(`DB result: ${imported} imported, ${duplicates} duplicates skipped`);
  }
  lines.push('', 'Top opportunities:');
  for (const [idx, lead] of leads.slice(0, 7).entries()) {
    lines.push(`${idx + 1}. ${lead.name} — score ${lead.opportunityScore}/100`);
    const bits = [];
    if (lead.rating != null) bits.push(`⭐ ${lead.rating} (${lead.reviews || 0} reviews)`);
    if (lead.phone) bits.push(`☎ ${lead.phone}`);
    bits.push(lead.website ? `🌐 ${lead.website}` : '🌐 no website listed');
    lines.push(`   ${bits.join(' | ')}`);
    if (lead.address) lines.push(`   📍 ${lead.address}`);
    if (lead.reasons?.length) lines.push(`   Why: ${lead.reasons.join('; ')}`);
  }
  lines.push('', `Full JSON report saved: ${reportPath}`);
  lines.push('Next step: review imported leads in the portal, then approve outreach drafts for the best 3.');
  return lines.join('\n');
}

export async function run(argv = process.argv.slice(2)) {
  loadEnv();
  const opts = parseArgs(argv);
  const target = `${opts.location} ${opts.industry}`;
  const places = await discoverPlaces(opts);
  const scored = [];

  for (const place of places.slice(0, opts.maxPlaces)) {
    const lead = normalizeLead(place);
    const site = lead.website ? await fetchSiteSnapshot(lead.website) : { ok: false, reason: 'no website' };
    scored.push(scoreLead(lead, site));
  }
  scored.sort((a, b) => b.opportunityScore - a.opportunityScore);
  const selected = scored.filter((lead) => lead.opportunityScore >= opts.minScore).slice(0, opts.limit);

  let importResults = null;
  if (opts.import) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
    const sql = neon(process.env.DATABASE_URL);
    importResults = [];
    for (const lead of selected) importResults.push(await importLead(sql, lead, target));
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const reportPath = path.join(REPORT_DIR, `${slugName(target)}_${stamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ target, options: opts, leads: scored, selected, importResults }, null, 2));

  return formatReport({ target, leads: selected.length ? selected : scored, importResults, reportPath, didImport: opts.import });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  run().then((report) => {
    console.log(report);
  }).catch((err) => {
    console.error(`Riden Lead Discovery Agent v2 failed: ${err.stack || err.message || err}`);
    process.exit(1);
  });
}
