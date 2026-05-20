import type { Metadata } from "next";
import Services from "@/components/marketing/services";
import CTASection from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "Solutions",
  description: "Websites, CRM dashboards, automation, booking systems, analytics, and ongoing support — everything your business needs to grow online.",
};

export default function Solutions() {
  return (
    <div className="pt-20">
      <div className="py-12 sm:py-16 text-center bg-hero-gradient border-b border-riden-border px-4 sm:px-6">
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Our <span className="gradient-text">Solutions</span>
        </h1>
        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto">
          Everything your business needs online — built, managed, and supported by our team.
        </p>
      </div>
      <Services />
      <CTASection />
    </div>
  );
}
