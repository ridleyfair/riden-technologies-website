export type PricingTier = "pro" | "pro_plus" | "enterprise";

export interface TierConfig {
  id: PricingTier;
  label: string;
  badge: string | null;
  setupFee: number;
  monthlyFee: number;
  tagline: string;
  bestFor: string[];
  features: string[];
}

export const PRICING_TIERS: TierConfig[] = [
  {
    id: "pro",
    label: "Pro",
    badge: "Everything included",
    setupFee: 199,
    monthlyFee: 29.99,
    tagline: "One simple plan. Your website designed, built, hosted and maintained.",
    bestFor: [
      "Sole traders",
      "Trades & local services",
      "Small businesses",
      "Anyone who wants a professional site without the hassle",
    ],
    features: [
      "Professionally designed website",
      "Mobile responsive on every device",
      "Dedicated service pages",
      "Enquiry & contact forms",
      "Photo gallery & reviews section",
      "Local SEO & Google indexing",
      "Fast hosting included",
      "SSL certificate & daily backups",
      "Unlimited text & image updates",
      "Same-day website updates",
      "1 custom domain connected",
      "Friendly UK support",
      "No long-term contract",
      "14-day money-back guarantee",
    ],
  },
  {
    id: "pro_plus",
    label: "Pro+",
    badge: "Most Popular",
    setupFee: 499,
    monthlyFee: 99,
    tagline: "More enquiries. Stronger Google rankings. Faster growth.",
    bestFor: [
      "Growing businesses",
      "Businesses wanting more enquiries",
      "Businesses wanting stronger Google rankings",
    ],
    features: [
      "Everything in Pro",
      "Advanced local SEO",
      "Internal linking strategy",
      "Enhanced Google Business optimisation",
      "CRM integration",
      "Booking system",
      "Enhanced trust sections",
      "Additional SEO content generation",
      "Service-specific ranking pages",
      "Priority support",
      "14-day money-back guarantee",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    badge: null,
    setupFee: 999,
    monthlyFee: 199,
    tagline: "Full business growth system. Dominate local search.",
    bestFor: [
      "Multi-location businesses",
      "Large trades businesses",
      "Companies wanting to dominate local search",
    ],
    features: [
      "Everything in Pro+",
      "Multi-location SEO pages",
      "Area-specific landing pages",
      "Lead nurturing automation",
      "Analytics dashboard",
      "Full CRM integration",
      "Advanced conversion optimisation",
      "Seasonal campaigns",
      "Dedicated support",
      "Custom landing pages",
      "Performance monitoring",
      "Priority implementation queue",
      "14-day money-back guarantee",
    ],
  },
];

export function getTier(id: PricingTier): TierConfig {
  return PRICING_TIERS.find((t) => t.id === id) ?? PRICING_TIERS[0];
}

export function formatSetupFee(tier: PricingTier): string {
  return `£${getTier(tier).setupFee}`;
}

export function formatMonthlyFee(tier: PricingTier): string {
  return `£${getTier(tier).monthlyFee}/month`;
}
