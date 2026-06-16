import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TEMPLATE_REGISTRY,
  selectTemplateForLead,
  buildVariantPlanForLead,
  getTemplateById,
} from '../agents/template_registry.mjs';

const plumberLead = {
  service: 'Plumber',
  notes: 'Niche: plumber\nPrimary outreach angle: No website presence found for a plumber business in London.',
  scraperDataJson: JSON.stringify({ category: 'Plumber', city: 'London' }),
};

const beautyLead = {
  service: 'Beauty Salon',
  notes: 'Niche: beauty',
  scraperDataJson: JSON.stringify({ category: 'Beauty salon', city: 'London' }),
};

const professionalLead = {
  service: 'Consultant',
  notes: 'Niche: professional',
  scraperDataJson: JSON.stringify({ category: 'Business consultant', city: 'London' }),
};

test('registry contains the three real riden-website-gen templates', () => {
  assert.deepEqual(Object.keys(TEMPLATE_REGISTRY).sort(), [
    'beauty-pro-booking',
    'modern-minimal',
    'tradie-bold',
  ]);
  assert.equal(getTemplateById('tradie-bold').sourceRepoPath, '/home/skids/riden-website-gen/apps/template-engine/src/templates/tradie-bold');
});

test('selectTemplateForLead maps plumbers/trades to tradie-bold', () => {
  const selected = selectTemplateForLead(plumberLead);

  assert.equal(selected.templateId, 'tradie-bold');
  assert.equal(selected.template.name, 'Tradie Bold');
  assert.match(selected.reason, /trade/i);
  assert.ok(selected.template.supportedNiches.includes('plumber'));
});

test('selectTemplateForLead maps beauty businesses to beauty-pro-booking', () => {
  const selected = selectTemplateForLead(beautyLead);

  assert.equal(selected.templateId, 'beauty-pro-booking');
  assert.match(selected.reason, /booking/i);
});

test('selectTemplateForLead maps professional/general businesses to modern-minimal', () => {
  const selected = selectTemplateForLead(professionalLead);

  assert.equal(selected.templateId, 'modern-minimal');
  assert.match(selected.reason, /clean/i);
});

test('buildVariantPlanForLead returns three variants while marking AI-from-scratch as future disabled', () => {
  const plan = buildVariantPlanForLead(plumberLead);

  assert.equal(plan.businessNiche, 'plumber');
  assert.equal(plan.variants.length, 3);
  assert.equal(plan.variants[0].templateId, 'tradie-bold');
  assert.equal(plan.variants[0].status, 'active_existing_template');
  assert.equal(plan.variants[1].templateId, 'modern-minimal');
  assert.equal(plan.variants[1].status, 'active_existing_template');
  assert.equal(plan.variants[2].templateId, 'ai-generated-custom');
  assert.equal(plan.variants[2].status, 'future_requires_approval');
});
