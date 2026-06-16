import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildGeneratorPayload,
  resolveTemplatePath,
  writeGeneratorPayload,
} from '../agents/website_generator_bridge.mjs';

const plan = {
  planId: 'website-plan-lead-1',
  status: 'planning_only',
  lead: { id: 'lead-1' },
  business: {
    name: 'Kenley Plumbers',
    location: 'London',
    niche: 'plumber',
    phone: '+44 20 0000 0000',
  },
  templateSelection: {
    templateId: 'tradie-bold',
    templateName: 'Tradie Bold',
  },
  variantPlan: {
    variants: [
      { variant: 'A', templateId: 'tradie-bold', status: 'active_existing_template' },
      { variant: 'B', templateId: 'modern-minimal', status: 'active_existing_template' },
      { variant: 'C', templateId: 'ai-generated-custom', status: 'future_requires_approval' },
    ],
  },
  sections: [{ id: 'hero', goal: 'Get calls quickly' }],
  copyAngle: 'Local plumber website focused on fast quote requests.',
  ctaStrategy: { primary: 'Call now' },
  galleryStrategy: 'Use before/after completed jobs.',
  readiness: { score: 82, missingInfo: [] },
  risksToAvoid: ['Avoid unverified guarantees.'],
};

test('resolveTemplatePath verifies selected real template exists in riden-website-gen', async () => {
  const resolved = await resolveTemplatePath('tradie-bold');

  assert.equal(resolved.templateId, 'tradie-bold');
  assert.equal(resolved.exists, true);
  assert.match(resolved.path, /riden-website-gen\/apps\/template-engine\/src\/templates\/tradie-bold$/);
});

test('resolveTemplatePath rejects unknown templates instead of silently generating', async () => {
  await assert.rejects(
    () => resolveTemplatePath('unknown-template'),
    /Unknown templateId: unknown-template/,
  );
});

test('buildGeneratorPayload converts a planning brief into a local generation payload without deployment', async () => {
  const payload = await buildGeneratorPayload(plan);

  assert.equal(payload.mode, 'local_preview_payload_only');
  assert.equal(payload.deploy, false);
  assert.equal(payload.template.templateId, 'tradie-bold');
  assert.equal(payload.business.name, 'Kenley Plumbers');
  assert.equal(payload.content.sections[0].id, 'hero');
  assert.equal(payload.approval.requiredBeforeGeneration, true);
  assert.equal(payload.approval.requiredBeforeDeploy, true);
});

test('writeGeneratorPayload writes a JSON artifact that can be used by the generator later', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'riden-generator-payload-'));
  try {
    const result = await writeGeneratorPayload(plan, { outputDir: dir });
    const json = JSON.parse(await readFile(result.path, 'utf8'));

    assert.equal(result.wrote, true);
    assert.match(result.path, /website-plan-lead-1\.generator-payload\.json$/);
    assert.equal(json.deploy, false);
    assert.equal(json.template.templateId, 'tradie-bold');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
