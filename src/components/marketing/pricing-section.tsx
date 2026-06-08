"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Building2, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICING_TIERS, type TierConfig } from "@/lib/pricing";

// ─── Visual config per tier ───────────────────────────────────────────────────

const tierMeta: Record<string, {
  icon: React.ElementType;
  gradient: string;
  border: string;
  glow: string;
  iconBg: string;
  iconColor: string;
  tickBg: string;
  tickColor: string;
  accentBar: string;
  ctaVariant: "outline" | "gradient";
  cta: string;
}> = {
  pro: {
    icon: Zap,
    gradient: "from-blue-500/[0.07] to-transparent",
    border: "border-riden-border hover:border-blue-500/30",
    glow: "",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    tickBg: "bg-blue-500/10",
    tickColor: "text-blue-400",
    accentBar: "bg-blue-500",
    ctaVariant: "outline",
    cta: "Get Started",
  },
  pro_plus: {
    icon: Crown,
    gradient: "from-violet-500/[0.13] to-blue-500/[0.06]",
    border: "border-violet-500/50",
    glow: "shadow-[0_0_70px_rgba(139,92,246,0.13)]",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    tickBg: "bg-violet-500/10",
    tickColor: "text-violet-400",
    accentBar: "bg-violet-500",
    ctaVariant: "gradient",
    cta: "Start Growing",
  },
  enterprise: {
    icon: Building2,
    gradient: "from-cyan-500/[0.07] to-transparent",
    border: "border-riden-border hover:border-cyan-500/30",
    glow: "",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    tickBg: "bg-cyan-500/10",
    tickColor: "text-cyan-400",
    accentBar: "bg-cyan-500",
    ctaVariant: "outline",
    cta: "Contact Sales",
  },
};

// ─── Comparison modal ─────────────────────────────────────────────────────────

function CompareModal({ onClose }: { onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-4xl max-h-[90vh] glass-card rounded-2xl border border-riden-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-riden-border flex-shrink-0">
          <h3 className="text-sm font-bold text-white">Plan Comparison</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 portal-scroll p-6">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-slate-400 font-medium pb-4 w-1/2">Feature</th>
                {PRICING_TIERS.map((t) => {
                  const meta = tierMeta[t.id];
                  return (
                    <th key={t.id} className={`text-center pb-4 ${meta.iconColor}`}>
                      {t.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-riden-border/50">
              {[
                ["Setup fee", "£299", "£499", "£999"],
                ["Monthly", "£50/mo", "£99/mo", "£199/mo"],
                ["Professional website", true, true, true],
                ["Mobile responsive", true, true, true],
                ["Contact forms", true, true, true],
                ["Gallery", true, true, true],
                ["Reviews section", true, true, true],
                ["Basic local SEO", true, true, true],
                ["Hosting + SSL", true, true, true],
                ["Unlimited updates", true, true, true],
                ["14-day guarantee", true, true, true],
                ["Dedicated service pages", false, true, true],
                ["Advanced local SEO", false, true, true],
                ["FAQ + review schema", false, true, true],
                ["Lead generation forms", false, true, true],
                ["Checkatrade integration", false, true, true],
                ["Priority support", false, true, true],
                ["Multi-location SEO", false, false, true],
                ["Area-specific landing pages", false, false, true],
                ["Email marketing automation", false, false, true],
                ["Analytics dashboard", false, false, true],
                ["Booking system", false, false, true],
                ["Same-day updates", false, false, true],
                ["Dedicated support", false, false, true],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-4 text-slate-300">{row[0]}</td>
                  {[row[1], row[2], row[3]].map((val, j) => (
                    <td key={j} className="py-2.5 text-center">
                      {typeof val === "boolean" ? (
                        val
                          ? <Check size={14} className={`mx-auto ${tierMeta[PRICING_TIERS[j].id].tickColor}`} />
                          : <span className="text-slate-700">—</span>
                      ) : (
                        <span className={`font-semibold ${tierMeta[PRICING_TIERS[j].id].iconColor}`}>{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ tier, index }: { tier: TierConfig; index: number }) {
  const meta = tierMeta[tier.id];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`relative glass-card rounded-2xl border transition-all duration-300 ${meta.border} ${meta.glow} flex flex-col`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} rounded-2xl pointer-events-none`} />

      {tier.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-xs font-semibold text-white shadow-glow whitespace-nowrap">
          ⭐ {tier.badge}
        </div>
      )}

      <div className="relative flex flex-col flex-1 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-1.5">
          <div className={`w-9 h-9 rounded-xl ${meta.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={17} className={meta.iconColor} />
          </div>
          <span className="text-lg font-bold text-white">{tier.label}</span>
        </div>
        <p className="text-xs text-slate-500 mb-5 leading-snug">{tier.tagline}</p>

        <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-riden-border/60">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white leading-none">£{tier.setupFee}</span>
            <span className="text-sm text-slate-500">setup</span>
          </div>
          <div className="mt-3 pt-3 border-t border-riden-border/60 flex items-baseline gap-1">
            <span className={`text-xl font-semibold ${meta.iconColor}`}>£{tier.monthlyFee}</span>
            <span className="text-sm text-slate-500">/month</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          <Link href="/contact" className="block">
            <Button variant={meta.ctaVariant} size="lg" className="w-full min-h-[48px]">
              {meta.cta}
            </Button>
          </Link>
        </div>

        <div className="border-t border-riden-border mb-4" />

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Best for</p>
        <ul className="space-y-1 mb-4">
          {tier.bestFor.map((item, i) => (
            <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
              <div className={`w-1 h-1 rounded-full flex-shrink-0 ${meta.accentBar}`} />
              {item}
            </li>
          ))}
        </ul>

        <div className="border-t border-riden-border mb-4" />

        <ul className="space-y-2.5 flex-1">
          {tier.features.map((feature, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <div className={`w-4 h-4 rounded-full ${meta.tickBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Check size={10} className={meta.tickColor} />
              </div>
              <span className="text-sm text-slate-300 leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ─── Trust strip ──────────────────────────────────────────────────────────────

const trustItems = [
  "SSL certificate included",
  "No long-term contracts",
  "UK-based support",
  "No hidden fees",
  "14-day money-back guarantee",
];

// ─── Main section ─────────────────────────────────────────────────────────────

export default function PricingSection() {
  const [showCompare, setShowCompare] = useState(false);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-riden-dark" />
      <div className="absolute inset-0 dot-pattern opacity-30" />

      <AnimatePresence>
        {showCompare && <CompareModal onClose={() => setShowCompare(false)} />}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 text-sm text-cyan-300 mb-6"
          >
            <Crown size={14} />
            <span>Transparent Pricing</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            More leads.{" "}
            <span className="gradient-text">More visibility.</span>
            <br className="hidden sm:block" /> Less hassle.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            A one-time setup fee gets your website live. A simple monthly fee keeps it
            growing, supported, and generating enquiries.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="inline-flex flex-wrap justify-center items-center gap-3 mt-7"
          >
            {[
              { label: "Pro", desc: "Professional website", color: "text-blue-400 border-blue-500/20" },
              { label: "Pro+", desc: "More enquiries + SEO growth", color: "text-violet-400 border-violet-500/20" },
              { label: "Enterprise", desc: "Full business growth system", color: "text-cyan-400 border-cyan-500/20" },
            ].map((pill) => (
              <div key={pill.label} className={`flex items-center gap-2 px-4 py-2 rounded-xl glass border text-sm ${pill.color}`}>
                <span className="font-semibold">{pill.label}</span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-300">{pill.desc}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {PRICING_TIERS.map((tier, i) => (
            <PlanCard key={tier.id} tier={tier} index={i} />
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => setShowCompare(true)}
            className="text-sm text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
          >
            Compare all plans
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 sm:mt-12 flex flex-wrap justify-center items-center gap-x-6 gap-y-3"
        >
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {item}
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-600 text-sm mt-5"
        >
          Not sure which plan fits?{" "}
          <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors">
            Talk to us — we&apos;ll recommend the right option.
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
