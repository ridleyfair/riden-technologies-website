import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractWebsiteSignals,
  classifyWebsiteQuality,
  buildNicheProfile,
  buildOutreachAngle,
  buildEnrichmentNotes,
  mergeScraperData,
  mergeEnrichmentNotes,
} from '../agents/lead_enrichment_agent.mjs';

const plumberLead = {
  id: 'lead_1',
  name: 'Kenley Plumbers',
  company: 'Kenley Plumbers',
  phone: '+44 7424 542122',
  service: 'Plumber',
  score: 53,
  notes: [
    'Source: Riden Lead Discovery Agent v2',
    'Target: London plumbers',
    'No outreach sent. Imported for review/enrichment only.',
    'No website listed',
    'Google rating: 5 (6 reviews)',
    'Reasons: no website listed; low review volume; phone available',
  ].join('\n'),
  scraperDataJson: JSON.stringify({
    source_agent: 'riden-lead-discovery-v2',
    category: 'Plumber',
    city: 'London',
    address: 'Kenley, London',
    website: null,
    rating: 5,
    reviews_count: 6,
    reasons: ['no website listed', 'low review volume', 'phone available'],
  }),
};

test('extractWebsiteSignals finds trade conversion signals from html', () => {
  const html = `
    <html><head><title>ABC Plumbing London</title><meta name="description" content="Emergency plumber in London"></head>
    <body>
      <a href="tel:+442012345678">Call now</a>
      <h2>Emergency plumbing and boiler repair</h2>
      <p>We offer leak repair, bathroom fitting, blocked drains and free quotes.</p>
      <img src="/before-after-leak.jpg" alt="Before and after leak repair" />
      <script>ignored()</script>
    </body></html>`;

  const signals = extractWebsiteSignals(html, 'https://abc-plumbing.test');

  assert.equal(signals.title, 'ABC Plumbing London');
  assert.equal(signals.hasPhoneCta, true);
  assert.equal(signals.hasQuoteCta, true);
  assert.equal(signals.hasEmergencySignal, true);
  assert.equal(signals.hasBeforeAfterSignal, true);
  assert.ok(signals.textLength > 120);
  assert.ok(signals.serviceSignals.includes('boiler repair'));
});

test('classifyWebsiteQuality scores missing website as a strong opportunity', () => {
  const quality = classifyWebsiteQuality({ hasWebsite: false });

  assert.equal(quality.grade, 'missing');
  assert.equal(quality.opportunityScore, 90);
  assert.match(quality.summary, /No website/i);
  assert.ok(quality.painPoints.includes('No website found'));
});

test('buildNicheProfile returns plumber-specific site strategy', () => {
  const profile = buildNicheProfile(plumberLead);

  assert.equal(profile.niche, 'plumber');
  assert.equal(profile.recommendedTemplate, 'tradie-bold');
  assert.equal(profile.recommendedTemplateName, 'Tradie Bold');
  assert.equal(profile.variantPlan.variants.length, 3);
  assert.equal(profile.variantPlan.variants[2].status, 'future_requires_approval');
  assert.ok(profile.homepageSections.includes('Emergency plumbing hero with click-to-call CTA'));
  assert.ok(profile.servicePages.includes('Boiler repair'));
  assert.ok(profile.galleryStrategy.some((item) => /before\/after/i.test(item)));
  assert.ok(profile.trustSignals.includes('Google reviews'));
});

test('buildOutreachAngle creates safe angle without overclaiming', () => {
  const profile = buildNicheProfile(plumberLead);
  const quality = classifyWebsiteQuality({ hasWebsite: false });
  const angle = buildOutreachAngle(plumberLead, profile, quality);

  assert.match(angle.primaryAngle, /website presence/i);
  assert.match(angle.suggestedWhatsAppHook, /quick example/i);
  assert.doesNotMatch(angle.suggestedWhatsAppHook, /guarantee|limited time|AI/i);
  assert.ok(angle.claimsToAvoid.includes('Guaranteed enquiries'));
});

test('buildEnrichmentNotes adds provenance and no-outreach marker', () => {
  const profile = buildNicheProfile(plumberLead);
  const quality = classifyWebsiteQuality({ hasWebsite: false });
  const angle = buildOutreachAngle(plumberLead, profile, quality);
  const notes = buildEnrichmentNotes(plumberLead, { profile, quality, angle });

  assert.match(notes, /Source: Riden Lead Enrichment Agent v1/);
  assert.match(notes, /No outreach sent/);
  assert.match(notes, /Niche: plumber/);
  assert.match(notes, /Recommended template: tradie-bold/);
  assert.match(notes, /Recommended template name: Tradie Bold/);
  assert.match(notes, /Variant plan: A:tradie-bold:active_existing_template/);
});

test('mergeScraperData preserves discovery data and adds enrichment payload', () => {
  const merged = mergeScraperData(plumberLead.scraperDataJson, {
    profile: { niche: 'plumber' },
    quality: { grade: 'missing' },
    angle: { primaryAngle: 'No website presence' },
  });

  assert.equal(merged.source_agent, 'riden-lead-discovery-v2');
  assert.equal(merged.enrichment.source_agent, 'riden-lead-enrichment-v1');
  assert.equal(merged.enrichment.profile.niche, 'plumber');
});

test('mergeEnrichmentNotes replaces previous enrichment block instead of appending stale template recommendations', () => {
  const existing = [
    'Source: Riden Lead Discovery Agent v2',
    'Target: London plumbers',
    '---',
    'Source: Riden Lead Enrichment Agent v1',
    'Recommended template: plumber-emergency-local',
    'Website quality: missing (90/100 opportunity)',
  ].join('\n');
  const next = [
    'Source: Riden Lead Enrichment Agent v1',
    'Recommended template: tradie-bold',
    'Template registry version: riden-template-registry-v1',
  ].join('\n');

  const merged = mergeEnrichmentNotes(existing, next);

  assert.match(merged, /Recommended template: tradie-bold/);
  assert.doesNotMatch(merged, /plumber-emergency-local/);
  assert.equal((merged.match(/Source: Riden Lead Enrichment Agent v1/g) || []).length, 1);
});
