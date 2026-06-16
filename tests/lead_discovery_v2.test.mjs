import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLead,
  scoreLead,
  buildLeadNotes,
  dedupeKey,
} from '../agents/lead_discovery_v2.mjs';

test('scoreLead prioritizes businesses with no website and contact phone', () => {
  const lead = normalizeLead({
    title: 'London Emergency Plumbers Ltd',
    phone: '+44 7778 486101',
    totalScore: 5,
    reviewsCount: 11,
    categoryName: 'Plumber',
  });

  const scored = scoreLead(lead, { ok: false, reason: 'no website' });

  assert.equal(scored.opportunityScore, 53);
  assert.match(scored.reasons.join('; '), /no website listed/);
  assert.match(scored.reasons.join('; '), /phone available/);
});

test('scoreLead flags weak conversion website for reputable business', () => {
  const lead = normalizeLead({
    title: 'BWD Plumbing & Heating',
    phone: '+44 7415 119500',
    website: 'https://example.com',
    totalScore: 5,
    reviewsCount: 294,
    categoryName: 'Plumber',
  });

  const scored = scoreLead(lead, {
    ok: true,
    elapsed: 1,
    text: 'Local plumbing and heating services in London. Call us today.',
  });

  assert.equal(scored.opportunityScore, 58);
  assert.match(scored.reasons.join('; '), /thin website content/);
  assert.match(scored.reasons.join('; '), /weak conversion CTA/);
  assert.match(scored.reasons.join('; '), /strong reputation/);
});

test('dedupeKey prefers phone then website then normalized name', () => {
  assert.match(dedupeKey({ name: 'A', phone: '+44 7778 486101', website: 'https://a.test' }), /^phone:/);
  assert.equal(dedupeKey({ name: 'A', website: 'https://www.Example.com/path?q=1' }), 'site:example.com');
  assert.equal(dedupeKey({ name: '  A & B Plumbing Ltd  ' }), 'name:a-and-b-plumbing-ltd');
});

test('buildLeadNotes includes provenance, score reasons, and safe no-outreach marker', () => {
  const notes = buildLeadNotes({
    name: 'Test Plumbing',
    address: '1 Test Street',
    phone: '020 0000 0000',
    website: null,
    rating: 4.8,
    reviews: 20,
    mapsUrl: 'https://maps.test',
    opportunityScore: 50,
    reasons: ['no website listed'],
  }, 'London plumbers');

  assert.match(notes, /Source: Riden Lead Discovery Agent v2/);
  assert.match(notes, /Target: London plumbers/);
  assert.match(notes, /No outreach sent/);
  assert.match(notes, /no website listed/);
});
