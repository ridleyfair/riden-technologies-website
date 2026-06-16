"use client";

// ─── Pricing ──────────────────────────────────────────────────────────────────
// One simple plan, presented as a premium card. Outcome-focused, no comparison
// table. Pulls from the single source of truth in src/lib/pricing.ts.

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { getTier } from "@/lib/pricing";

const plan = getTier("pro");

const outcomes = [
  "Look professional and win customers’ trust",
  "Get found on Google by nearby customers",
  "Turn website visitors into real enquiries",
  "Never worry about hosting, updates or tech",
];

function formatMonthly(n: number) {
  return Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
}

export default function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-700 ring-1 ring-blue-100">
            Simple Pricing
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]">
            One plan. <span className="gradient-text-brand">Everything included.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            No confusing tiers or hidden extras. One simple price covers design, build, hosting,
            SEO and ongoing maintenance.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-white p-1 shadow-float ring-1 ring-slate-200/70"
        >
          {/* gradient frame */}
          <div className="rounded-[1.85rem] bg-gradient-to-br from-blue-600 to-cyan-500 p-[1.5px]">
            <div className="grid gap-8 rounded-[1.75rem] bg-white p-8 sm:p-10 lg:grid-cols-[1fr_1.1fr]">
              {/* price block */}
              <div className="flex flex-col">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1 text-xs font-bold text-white">
                  <Sparkles className="h-3.5 w-3.5" /> {plan.label} plan
                </span>
                <div className="mt-6">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                      {formatMonthly(plan.monthlyFee)}
                    </span>
                    <span className="mb-1.5 text-base font-semibold text-slate-500">/month</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    + £{plan.setupFee} one-time build fee
                  </p>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-600">{plan.tagline}</p>

                <div className="mt-7 space-y-2.5">
                  {outcomes.map((o) => (
                    <div key={o} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-sm font-medium text-slate-700">{o}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
                >
                  Get My Website Preview
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-center text-xs text-slate-400">
                  14-day money-back guarantee · No long-term contract
                </p>
              </div>

              {/* whats included */}
              <div className="rounded-2xl bg-slate-50/70 p-6 ring-1 ring-slate-100">
                <div className="text-sm font-bold text-slate-900">What’s included</div>
                <ul className="mt-4 grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
