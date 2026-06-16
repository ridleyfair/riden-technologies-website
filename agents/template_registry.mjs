#!/usr/bin/env node

export const TEMPLATE_REGISTRY = {
  'modern-minimal': {
    templateId: 'modern-minimal',
    name: 'Modern Minimal',
    sourceRepoPath: '/home/skids/riden-website-gen/apps/template-engine/src/templates/modern-minimal',
    tier: 'pro',
    supportedNiches: ['professional', 'consultant', 'corporate', 'local-service', 'general', 'all'],
    conversionStyle: 'clean, premium, trust-led, whitespace-heavy',
    bestFor: 'Professional/general businesses that need a polished, credible first impression.',
    galleryStrategy: 'Use a small curated gallery or proof section only where images add credibility.',
    ctaStrategy: 'Primary CTA should be request quote/contact, with a calm secondary CTA for services.',
    active: true,
  },
  'tradie-bold': {
    templateId: 'tradie-bold',
    name: 'Tradie Bold',
    sourceRepoPath: '/home/skids/riden-website-gen/apps/template-engine/src/templates/tradie-bold',
    tier: 'pro',
    supportedNiches: ['trades', 'plumber', 'electrician', 'roofer', 'builder', 'carpenter', 'painter', 'automotive'],
    conversionStyle: 'bold, direct, mobile-first, high-CTA, job-enquiry focused',
    bestFor: 'Local trades and emergency service businesses where phone calls and fast quote requests matter.',
    galleryStrategy: 'Use before/after photos, vans, tools, team shots, completed jobs, and service-area proof.',
    ctaStrategy: 'Primary CTA should be call now/request quote, repeated after hero, services, gallery, FAQ, and footer.',
    active: true,
  },
  'beauty-pro-booking': {
    templateId: 'beauty-pro-booking',
    name: 'Beauty Pro+ Booking',
    sourceRepoPath: '/home/skids/riden-website-gen/apps/template-engine/src/templates/beauty-pro-booking',
    tier: 'pro_plus',
    supportedNiches: ['beauty', 'salon', 'spa', 'aesthetics', 'nails', 'lashes', 'hair', 'barber', 'hospitality'],
    conversionStyle: 'premium visual, booking-led, gallery-heavy, service/pricing focused',
    bestFor: 'Beauty and booking-led businesses that need treatments, pricing, galleries, and booking CTAs.',
    galleryStrategy: 'Prioritise polished treatment photos, before/after results, studio ambience, team, and Instagram-style proof.',
    ctaStrategy: 'Primary CTA should be book now, supported by treatment/pricing cards and gallery proof.',
    active: true,
  },
};

export function getTemplateById(templateId) {
  const template = TEMPLATE_REGISTRY[templateId];
  if (!template) throw new Error(`Unknown templateId: ${templateId}`);
  return template;
}

function parseJson(value) {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

function leadText(lead = {}) {
  const data = parseJson(lead.scraperDataJson);
  return [
    lead.service,
    lead.notes,
    lead.company,
    lead.name,
    data.category,
    data.enrichment?.profile?.niche,
    data.enrichment?.profile?.recommendedTemplate,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function inferNiche(lead = {}) {
  const text = leadText(lead);
  if (/plumb|boiler|drain|leak|heating/.test(text)) return 'plumber';
  if (/electric|rewire|fuse|ev charger/.test(text)) return 'electrician';
  if (/roof|gutter|fascia/.test(text)) return 'roofer';
  if (/builder|construction|carpenter|joiner|painter|decorator|automotive|mechanic|garage/.test(text)) return 'trades';
  if (/beauty|salon|spa|nail|lash|brow|aesthetic|hair|barber|makeup/.test(text)) return 'beauty';
  if (/restaurant|cafe|pub|bar|hotel|takeaway|bistro|food/.test(text)) return 'hospitality';
  if (/consultant|accountant|solicitor|lawyer|architect|professional|corporate|business/.test(text)) return 'professional';
  return 'local-service';
}

export function selectTemplateForLead(lead = {}) {
  const niche = inferNiche(lead);
  if (['plumber', 'electrician', 'roofer', 'trades'].includes(niche)) {
    return {
      templateId: 'tradie-bold',
      template: TEMPLATE_REGISTRY['tradie-bold'],
      niche,
      reason: 'Trade/local service business detected; tradie-bold is the strongest existing template for direct calls, quote CTAs, reviews, FAQ, and before/after gallery proof.',
    };
  }
  if (['beauty', 'hospitality'].includes(niche)) {
    return {
      templateId: 'beauty-pro-booking',
      template: TEMPLATE_REGISTRY['beauty-pro-booking'],
      niche,
      reason: 'Beauty/booking-led business detected; beauty-pro-booking supports premium visuals, service/pricing blocks, galleries, and booking CTAs.',
    };
  }
  return {
    templateId: 'modern-minimal',
    template: TEMPLATE_REGISTRY['modern-minimal'],
    niche,
    reason: 'Professional/general business detected; modern-minimal provides a clean, credible, trust-led layout.',
  };
}

export function buildVariantPlanForLead(lead = {}) {
  const selected = selectTemplateForLead(lead);
  const fallback = selected.templateId === 'modern-minimal' ? 'tradie-bold' : 'modern-minimal';
  return {
    businessNiche: selected.niche,
    primaryTemplateId: selected.templateId,
    strategy: 'Use existing templates first; later add AI-from-scratch generation for three tailored conversion variants per business after user approval.',
    variants: [
      {
        variant: 'A',
        templateId: selected.templateId,
        templateName: selected.template.name,
        status: 'active_existing_template',
        angle: selected.niche === 'plumber' ? 'Emergency/local trade conversion angle' : 'Best-fit existing template angle',
      },
      {
        variant: 'B',
        templateId: fallback,
        templateName: TEMPLATE_REGISTRY[fallback].name,
        status: 'active_existing_template',
        angle: fallback === 'modern-minimal' ? 'Premium/trust-led alternate angle' : 'Bold/direct alternate conversion angle',
      },
      {
        variant: 'C',
        templateId: 'ai-generated-custom',
        templateName: 'AI-generated custom niche template',
        status: 'future_requires_approval',
        angle: 'Future scratch-built specialist agent version; not generated until approved and connector is built.',
      },
    ],
  };
}
