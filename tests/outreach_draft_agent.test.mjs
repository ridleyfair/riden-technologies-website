import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLeadNotes,
  buildWhatsAppDraft,
  buildEmailDraft,
  shouldDraftForLead,
} from '../agents/outreach_draft_agent.mjs';

const lead = {
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
    '---',
    'Source: Riden Lead Enrichment Agent v1',
    'Niche: plumber',
    'Recommended template: plumber-emergency-local',
    'Website quality: missing (90/100 opportunity)',
    'Primary outreach angle: No website presence found for a plumber business in London.',
  ].join('\n'),
};

test('parseLeadNotes extracts target, website status, rating, and reasons', () => {
  const parsed = parseLeadNotes(lead.notes);

  assert.equal(parsed.target, 'London plumbers');
  assert.equal(parsed.hasNoWebsite, true);
  assert.equal(parsed.ratingText, '5 (6 reviews)');
  assert.equal(parsed.niche, 'plumber');
  assert.equal(parsed.recommendedTemplate, 'plumber-emergency-local');
  assert.match(parsed.primaryOutreachAngle, /No website presence/);
  assert.deepEqual(parsed.reasons, ['no website listed', 'low review volume', 'phone available']);
});

test('buildWhatsAppDraft sounds human, concise, and uses approved sign-off', () => {
  const text = buildWhatsAppDraft(lead, { signoff: 'Ridley from Riden Technologies' });

  assert.match(text, /^Hi Kenley Plumbers, hope you’re well/);
  assert.match(text, /great reviews/i);
  assert.match(text, /website/i);
  assert.match(text, /Would you be open/i);
  assert.match(text, /Ridley from Riden Technologies/);
  assert.doesNotMatch(text, /AI|automated|limited time|guaranteed/i);
  assert.ok(text.length < 700);
});

test('buildEmailDraft creates a subject and non-robotic email body', () => {
  const draft = buildEmailDraft(lead, { signoff: 'Ridley from Riden Technologies' });

  assert.match(draft.subject, /Kenley Plumbers/);
  assert.match(draft.body, /^Hi Kenley Plumbers,/);
  assert.match(draft.body, /I came across Kenley Plumbers/i);
  assert.match(draft.body, /quick example/i);
  assert.match(draft.body, /Ridley from Riden Technologies/);
  assert.doesNotMatch(draft.body, /Dear Sir\/Madam|synergy|revolutionize/i);
});

test('shouldDraftForLead only selects new agent leads with a phone number', () => {
  assert.equal(shouldDraftForLead({ ...lead, source: 'agent-lead-discovery', status: 'new' }), true);
  assert.equal(shouldDraftForLead({ ...lead, source: 'website', status: 'new' }), false);
  assert.equal(shouldDraftForLead({ ...lead, source: 'agent-lead-discovery', status: 'contacted' }), false);
  assert.equal(shouldDraftForLead({ ...lead, source: 'agent-lead-discovery', status: 'new', phone: '' }), false);
});
