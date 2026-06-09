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
    badge: null,
    setupFee: 299,
    monthlyFee: 49,
    tagline: "Professional website. More calls. Less hassle.",
    bestFor: [
      "Sole traders",
      "Startups",
      "Small local businesses",
      "Businesses needing a professional online presence",
    ],
    features: [
      "Professionally designed website",
      "Mobile responsive design",
      "Dedicated service pages",
      "Contact forms",
      "Gallery",
      "Reviews section",
      "Basic local SEO",
      "Google indexing",
      "Hosting included",
      "SSL certificate",
      "Unlimited text & image updates",
      "Same-day website updates",
      "1 custom domain",
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
