import type { Metadata } from "next";
import PricingSection from "@/components/marketing/pricing-section";
import CTASection from "@/components/marketing/cta-section";
import FAQSection from "@/components/marketing/faq-section";

export const metadata: Metadata = {
  title: "Website Design Pricing UK | £199 Build + £29.99/mo | No Hidden Fees",
  description:
    "Simple, transparent website design pricing for UK small businesses. One plan: £199 one-time build fee plus £29.99/month covering design, hosting, SEO, updates and UK support. 14-day money-back guarantee.",
  alternates: { canonical: "https://ridentechnologies.com/pricing" },
  openGraph: {
    title: "Website Design Pricing UK | £199 + £29.99/mo | Riden Technologies",
    description:
      "One simple plan: £199 build + £29.99/month. No hidden fees, no long-term contracts. 14-day money-back guarantee.",
    url: "https://ridentechnologies.com/pricing",
  },
};

export default function Pricing() {
  return (
    <div className="pt-20 bg-white">
      <div className="py-14 sm:py-20 text-center bg-gradient-to-b from-blue-50/60 to-white border-b border-slate-100 px-4 sm:px-6">
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Honest,{" "}
          <span className="gradient-text-brand">Transparent Pricing</span>
        </h1>
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto">
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
