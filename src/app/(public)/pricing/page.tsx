import type { Metadata } from "next";
import PricingSection from "@/components/marketing/pricing-section";
import CTASection from "@/components/marketing/cta-section";
import FAQSection from "@/components/marketing/faq-section";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for every business stage.",
};

export default function Pricing() {
  return (
    <div className="pt-20">
      <div className="py-16 text-center bg-hero-gradient border-b border-riden-border">
        <h1 className="text-5xl font-bold text-white mb-4">
          Simple, <span className="gradient-text">Transparent Pricing</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          No hidden fees. Scale as you grow. Cancel anytime.
        </p>
      </div>
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
