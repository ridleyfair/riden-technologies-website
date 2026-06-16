import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProjectBriefFromPossibleClient,
  mergeProjectBriefPreservingEdits,
} from '../src/lib/lead-project-brief';

const possibleClient = {
  id: 'possible_kenley_plumbers',
  name: 'Kenley Plumbers',
  category: 'Plumber',
  city: 'London',
  address: 'Kenley, London',
  phone: '+44 20 0000 0000',
  website: null,
  rating: 4.8,
  reviews_count: 18,
  description: 'Family-run plumbing company helping homeowners with leaks, heating issues and bathroom plumbing across Kenley and nearby areas.',
  photos_json: JSON.stringify(['https://example.test/van.jpg', 'https://example.test/bathroom.jpg']),
  opening_hours_json: JSON.stringify([{ day: 'Monday', hours: '08:00-18:00' }]),
  social_facebook: 'https://facebook.com/kenleyplumbers',
  lead_score: { total_score: 86, lead_tier: 'hot' },
};

test('buildProjectBriefFromPossibleClient creates project fields with populated website about and services brief', () => {
  const brief = buildProjectBriefFromPossibleClient({
    possibleClient,
    leadId: 'lead_123',
    phone: '+44 20 0000 0000',
    description: possibleClient.description,
    photos: JSON.parse(possibleClient.photos_json),
    openingHours: JSON.parse(possibleClient.opening_hours_json),
  });

  assert.equal(brief.name, 'Kenley Plumbers Website Build');
  assert.equal(brief.clientName, 'Kenley Plumbers');
  assert.equal(brief.status, 'planning');
  assert.equal(brief.progress, 5);
  assert.equal(brief.phone, '+44 20 0000 0000');
  assert.equal(brief.city, 'London');
  assert.equal(brief.industry, 'trades');
  assert.match(brief.services, /Plumbing/i);
  assert.match(brief.services, /Leaks/i);
  assert.match(brief.about, /Family-run plumbing company/i);
  assert.match(brief.about, /4\.8 Google rating/i);
  assert.match(brief.notes, /Auto-created from Possible Client import/i);
  assert.match(brief.notes, /Recommended template: emergency-trade/i);
  assert.equal(brief.leadId, 'lead_123');
  assert.equal(brief.possibleClientId, 'possible_kenley_plumbers');
  assert.equal(JSON.parse(brief.photosJson).length, 2);
  assert.match(brief.websiteFactoryPlanJson, /"templateId":"emergency-trade"|"templateId": "emergency-trade"/);
});

test('mergeProjectBriefPreservingEdits only fills blank fields and does not overwrite human edited brief text', () => {
  const generated = buildProjectBriefFromPossibleClient({ possibleClient, leadId: 'lead_123' });
  const merged = mergeProjectBriefPreservingEdits({
    existing: {
      about: 'Human edited about section — keep this.',
      services: 'Human edited service list — keep this.',
      city: '',
      phone: null,
    },
    generated,
  });

  assert.equal(merged.about, 'Human edited about section — keep this.');
  assert.equal(merged.services, 'Human edited service list — keep this.');
  assert.equal(merged.city, 'London');
  assert.equal(merged.phone, '+44 20 0000 0000');
});
