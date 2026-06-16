#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTemplateById } from './template_registry.mjs';

export const WEBSITE_GENERATOR_ROOT = '/home/skids/riden-website-gen';
export const TEMPLATE_ENGINE_ROOT = `${WEBSITE_GENERATOR_ROOT}/apps/template-engine`;
export const TEMPLATE_ROOT = `${TEMPLATE_ENGINE_ROOT}/src/templates`;

function safeSlug(value = 'payload') {
  return String(value || 'payload')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'payload';
}

export async function resolveTemplatePath(templateId, options = {}) {
  const template = getTemplateById(templateId);
  const templatePath = options.templatePath || template.sourceRepoPath || path.join(TEMPLATE_ROOT, templateId);

  let stat;
  try {
    stat = await fs.stat(templatePath);
  } catch {
    throw new Error(`Template path does not exist for ${templateId}: ${templatePath}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`Template path is not a directory for ${templateId}: ${templatePath}`);
  }

  return {
    templateId,
    name: template.name,
    path: templatePath,
    exists: true,
    generatorRoot: options.generatorRoot || WEBSITE_GENERATOR_ROOT,
    templateEngineRoot: options.templateEngineRoot || TEMPLATE_ENGINE_ROOT,
  };
}

function assertPlanningOnly(plan = {}) {
  if (!plan || typeof plan !== 'object') throw new Error('Website factory plan is required');
  if (plan.status && plan.status !== 'planning_only') {
    throw new Error(`Refusing to build generator payload for non-planning status: ${plan.status}`);
  }
  const templateId = plan.templateSelection?.templateId || plan.variantPlan?.primaryTemplateId;
  if (!templateId) throw new Error('Plan is missing templateSelection.templateId');
  return templateId;
}

export async function buildGeneratorPayload(plan = {}, options = {}) {
  const templateId = assertPlanningOnly(plan);
  const resolvedTemplate = await resolveTemplatePath(templateId, options);

  return {
    schemaVersion: 'riden-website-generator-payload-v1',
    mode: 'local_preview_payload_only',
    deploy: false,
    generatedAt: options.generatedAt || new Date().toISOString(),
    source: {
      crmRepo: '/home/skids/Riden-Technologies-Website',
      generatorRepo: options.generatorRoot || WEBSITE_GENERATOR_ROOT,
      planId: plan.planId || null,
      leadId: plan.lead?.id || null,
    },
    template: {
      templateId: resolvedTemplate.templateId,
      templateName: resolvedTemplate.name,
      path: resolvedTemplate.path,
    },
    business: plan.business || {},
    content: {
      copyAngle: plan.copyAngle || null,
      ctaStrategy: plan.ctaStrategy || null,
      galleryStrategy: plan.galleryStrategy || null,
      serviceAreaStrategy: plan.serviceAreaStrategy || null,
      trustStrategy: plan.trustStrategy || null,
      sections: plan.sections || [],
    },
    variants: plan.variantPlan?.variants || [],
    readiness: plan.readiness || null,
    risksToAvoid: plan.risksToAvoid || [],
    approval: {
      requiredBeforeGeneration: true,
      requiredBeforeDeploy: true,
      requiredBeforeExternalOutreach: true,
      note: 'This bridge currently writes local preview payloads only. It must not deploy or contact leads without user approval.',
    },
  };
}

export async function writeGeneratorPayload(plan = {}, options = {}) {
  const payload = await buildGeneratorPayload(plan, options);
  const outputDir = options.outputDir || '/home/skids/Riden-Technologies-Website/agent_reports/website_generator_payloads';
  await fs.mkdir(outputDir, { recursive: true });
  const base = safeSlug(plan.planId || plan.lead?.id || plan.business?.name || 'website-plan');
  const filePath = path.join(outputDir, `${base}.generator-payload.json`);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return { wrote: true, path: filePath, payload };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node agents/website_generator_bridge.mjs <website-plan-json-file> [output-dir]');
    process.exitCode = 1;
    return;
  }
  const plan = JSON.parse(await fs.readFile(inputPath, 'utf8'));
  const result = await writeGeneratorPayload(plan, { outputDir: process.argv[3] });
  console.log(JSON.stringify(result, null, 2));
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
