import type { Metadata } from "next";
import PricingSection from "@/components/marketing/pricing-section";
import CTASection from "@/components/marketing/cta-section";
import FAQSection from "@/components/marketing/faq-section";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Honest, transparent pricing for websites, CRM dashboards, and ongoing maintenance.",
};

export default function Pricing() {
  return (
    <div className="pt-20">
      <div className="py-12 sm:py-16 text-center bg-hero-gradient border-b border-riden-border px-4 sm:px-6">
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Honest,{" "}
          <span className="gradient-text">Transparent Pricing</span>
        </h1>
        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto">
          A one-time build fee to launch your website, plus a clear monthly rate
          to keep it running. No surprises, no hidden charges.
        </p>
      </div>
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
