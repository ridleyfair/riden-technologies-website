import type { Metadata } from "next";
import PricingSection from "@/components/marketing/pricing-section";
import CTASection from "@/components/marketing/cta-section";
import FAQSection from "@/components/marketing/faq-section";

export const metadata: Metadata = {
  title: "Website Design Pricing UK — From £299 | No Hidden Fees",
  description:
    "Transparent website design pricing for UK small businesses. Pro from £299 + £49/mo. Pro+ from £499 + £99/mo. Enterprise from £999 + £199/mo. 14-day money-back guarantee.",
  alternates: { canonical: "https://ridentechnologies.com/pricing" },
  openGraph: {
    title: "Website Design Pricing UK — From £299 | Riden Technologies",
    description:
      "Honest website design pricing for small businesses. No hidden fees, no long-term contracts. 14-day money-back guarantee.",
    url: "https://ridentechnologies.com/pricing",
  },
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
