import type { Metadata } from "next";
import UniversalBriefForm from "@/components/marketing/universal-brief-form";

export const metadata: Metadata = {
  title: "Get Your Website | Riden Technologies",
  description:
    "Tell us about your trade business in 5 minutes. We'll build a professional website and have it live within 24 hours.",
  alternates: { canonical: "https://ridentechnologies.com/start" },
  openGraph: {
    title: "Get Your Trade Website | Riden Technologies",
    description:
      "5-minute brief → professional website live in 24 hours. Built for plumbers, electricians, builders, landscapers and decorators.",
    url: "https://ridentechnologies.com/start",
  },
};

export default function StartPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            ⚡ Website live within 24 hours
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Get your trade website
          </h1>
          <p className="text-slate-400 text-base max-w-sm mx-auto">
            Fill in your brief below and we&apos;ll build a professional website
            tailored to your trade — ready to go live today.
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <UniversalBriefForm />
        </div>

        {/* Trust strip */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-500">
          <span>✓ No obligation</span>
          <span>✓ No upfront payment</span>
          <span>✓ Cancel any time</span>
        </div>
      </div>
    </main>
  );
}
