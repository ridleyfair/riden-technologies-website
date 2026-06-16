import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWebsiteFactoryPlan } from '../agents/website_factory_planning_agent.mjs';

const plumberLead = {
  id: 'lead_plumber_1',
  company: 'Kenley Plumbers',
  name: 'Kenley Plumbers',
  service: 'Plumber',
  phone: '+44 20 0000 0000',
  email: null,
  website: null,
  notes: [
    'Niche: plumber',
    'Primary outreach angle: No website presence found for a plumber business in London.',
    'Reasons: no website listed; low review volume; phone available',
  ].join('\n'),
  scraperDataJson: JSON.stringify({
    category: 'Plumber',
    city: 'London',
    rating: 4.8,
    reviews: 18,
    address: 'Kenley, London',
    website: null,
    enrichment: {
      profile: {
        niche: 'plumber',
        recommendedTemplate: 'tradie-bold',
      },
    },
  }),
};

test('buildWebsiteFactoryPlan creates a planning-only tradie-bold brief for plumber leads', () => {
  const plan = buildWebsiteFactoryPlan(plumberLead);

  assert.equal(plan.status, 'planning_only');
  assert.equal(plan.lead.id, 'lead_plumber_1');
  assert.equal(plan.business.name, 'Kenley Plumbers');
  assert.equal(plan.business.location, 'London');
  assert.equal(plan.templateSelection.templateId, 'tradie-bold');
  assert.equal(plan.templateSelection.niche, 'plumber');
  assert.equal(plan.variantPlan.variants.length, 3);
  assert.equal(plan.variantPlan.variants[0].templateId, 'tradie-bold');
  assert.equal(plan.variantPlan.variants[2].status, 'future_requires_approval');
  assert.ok(plan.sections.some((section) => section.id === 'hero'));
  assert.ok(plan.sections.some((section) => section.id === 'services'));
  assert.match(plan.copyAngle, /local plumber/i);
  assert.match(plan.ctaStrategy.primary, /call/i);
  assert.match(plan.galleryStrategy, /before\/after|completed jobs/i);
  assert.ok(plan.editableCrmFields.includes('businessDescription'));
});

test('buildWebsiteFactoryPlan lowers readiness when required website-generation inputs are missing', () => {
  const plan = buildWebsiteFactoryPlan({
    ...plumberLead,
    phone: null,
    scraperDataJson: JSON.stringify({ category: 'Plumber', city: 'London', website: null }),
  });

  assert.ok(plan.readiness.score < 80);
  assert.ok(plan.readiness.missingInfo.includes('phone'));
  assert.ok(plan.readiness.missingInfo.includes('business photos or gallery assets'));
  assert.ok(plan.risksToAvoid.some((risk) => /unverified/i.test(risk)));
  assert.equal(plan.safety.noDeploy, true);
  assert.equal(plan.safety.noExternalOutreach, true);
});
