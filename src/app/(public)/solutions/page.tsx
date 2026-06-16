import type { Metadata } from "next";
import Services from "@/components/marketing/services";
import CTASection from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Web Design & Digital Services for Small Businesses",
  description:
    "Professional website design, CRM systems, booking tools, and local SEO for small businesses and tradespeople across the UK. Everything you need to grow online in one place.",
  alternates: { canonical: "https://ridentechnologies.com/solutions" },
  openGraph: {
    title: "Web Design & Digital Services for Small Businesses | Riden Technologies",
    description:
      "Professional websites, CRM systems, and local SEO for small businesses and tradespeople across the UK.",
    url: "https://ridentechnologies.com/solutions",
  },
};

export default function Solutions() {
  return (
    <div className="pt-20 bg-white">
      <div className="py-14 sm:py-20 text-center bg-gradient-to-b from-blue-50/60 to-white border-b border-slate-100 px-4 sm:px-6">
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Our <span className="gradient-text-brand">Services</span>
        </h1>
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto">
          Everything your business needs online. Built, managed, and supported by our team.
        </p>
      </div>
      <Services />
      <CTASection />
    </div>
  );
}
