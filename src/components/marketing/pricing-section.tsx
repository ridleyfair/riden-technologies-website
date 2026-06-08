"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Zap, Crown, Building2, Hammer, RefreshCw,
  X, Eye, Monitor, Layers, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Plan data ────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Pro",
    tagline: "Perfect for trades, local businesses & startups.",
    icon: Zap,
    buildPrice: "£299",
    buildSub: "one-time website build",
    maintenance: "£50",
    maintSub: "per month",
    badge: null,
    gradient: "from-blue-500/[0.07] to-transparent",
    border: "border-riden-border hover:border-blue-500/30",
    glow: "",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    tickBg: "bg-blue-500/10",
    tickColor: "text-blue-400",
    cta: "Get Started",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    features: [
      "5-page bespoke website",
      "Home, Services, About, Gallery & Contact",
      "Mobile-responsive, fast-loading design",
      "Contact & enquiry form",
      "On-page SEO foundation",
      "CRM dashboard access",
      "Lead collection & tracking",
      "Monthly support & updates",
      "Managed hosting included",
    ],
  },
  {
    name: "Pro+",
    tagline: "Growing businesses that want automation & bookings.",
    icon: Crown,
    buildPrice: "£499",
    buildSub: "one-time website build",
    maintenance: "£99",
    maintSub: "per month",
    badge: "Most Popular",
    gradient: "from-violet-500/[0.13] to-blue-500/[0.06]",
    border: "border-violet-500/50",
    glow: "shadow-[0_0_70px_rgba(139,92,246,0.13)]",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    tickBg: "bg-violet-500/10",
    tickColor: "text-violet-400",
    cta: "Start Growing",
    ctaHref: "/contact",
    ctaVariant: "gradient" as const,
    features: [
      "Everything in Pro, plus:",
      "Online booking & calendar system",
      "Automation workflows & follow-ups",
      "Analytics & conversion dashboard",
      "Testimonials & review integration",
      "Priority support",
      "Quarterly strategy review",
    ],
  },
  {
    name: "Enterprise",
    tagline: "Larger organisations with complex requirements.",
    icon: Building2,
    buildPrice: "£999",
    buildSub: "one-time website build",
    maintenance: "£199",
    maintSub: "per month",
    badge: null,
    gradient: "from-cyan-500/[0.07] to-transparent",
    border: "border-riden-border hover:border-cyan-500/30",
    glow: "",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    tickBg: "bg-cyan-500/10",
    tickColor: "text-cyan-400",
    cta: "Contact Sales",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    features: [
      "Everything in Pro+, plus:",
      "10+ page fully custom website",
      "E-commerce or payment integration",
      "Custom API & third-party integrations",
      "Advanced analytics & reporting",
      "Dedicated account manager",
      "Strategy consultation sessions",
      "Priority support & SLA guarantee",
    ],
  },
];

// ─── Preview content ──────────────────────────────────────────────────────────

type WireSection = { label: string; height: string; bg: string };
type PreviewPage = { name: string };

type PlanPreview = {
  headline: string;
  description: string;
  accentColor: string;
  accentBorder: string;
  accentBar: string;
  pages: PreviewPage[];
  wire: WireSection[];
  stylePoints: string[];
  goodFor: string;
};

const previews: Record<string, PlanPreview> = {
  Pro: {
    headline: "5-page bespoke website built for your trade",
    description:
      "A complete professional website covering everything a client needs to trust you and get in touch — delivered in 7–14 days, crafted to your brand.",
    accentColor: "text-blue-400",
    accentBorder: "border-blue-500/30",
    accentBar: "bg-blue-500",
    pages: [
      { name: "Home" },
      { name: "Services" },
      { name: "About" },
      { name: "Gallery" },
      { name: "Contact" },
    ],
    wire: [
      { label: "Navigation & Logo", height: "h-5", bg: "bg-slate-700/80" },
      { label: "Hero — Headline & CTA", height: "h-14", bg: "bg-blue-500/20" },
      { label: "Services Overview", height: "h-11", bg: "bg-slate-700/50" },
      { label: "Gallery / Portfolio", height: "h-10", bg: "bg-slate-700/50" },
      { label: "About & Trust Section", height: "h-9", bg: "bg-slate-700/50" },
      { label: "Contact Form", height: "h-12", bg: "bg-slate-700/50" },
      { label: "Footer", height: "h-5", bg: "bg-slate-800/80" },
    ],
    stylePoints: [
      "Fully branded, bespoke design",
      "Mobile-first, fast-loading",
      "Conversion-optimised call to actions",
      "SEO foundations built in",
      "Brand colours & logo applied",
    ],
    goodFor:
      "Plumbers, electricians, builders, roofers, cleaners, landscapers, salons, local restaurants",
  },

  "Pro+": {
    headline: "5-page custom website + booking system",
    description:
      "A complete multi-page website that positions your business professionally, with a built-in booking calendar to turn visitors into paying clients.",
    accentColor: "text-violet-400",
    accentBorder: "border-violet-500/30",
    accentBar: "bg-violet-500",
    pages: [
      { name: "Home" },
      { name: "Solutions" },
      { name: "Pricing" },
      { name: "About" },
      { name: "Contact" },
    ],
    wire: [
      { label: "Navigation — all 5 pages", height: "h-5", bg: "bg-slate-700/80" },
      { label: "Hero with animated headline", height: "h-14", bg: "bg-violet-500/25" },
      { label: "Services / Solutions", height: "h-11", bg: "bg-slate-700/50" },
      { label: "Booking Calendar Widget", height: "h-13", bg: "bg-violet-500/15" },
      { label: "Testimonials & Social Proof", height: "h-10", bg: "bg-slate-700/50" },
      { label: "CTA Banner", height: "h-7", bg: "bg-blue-500/15" },
      { label: "Footer with links", height: "h-6", bg: "bg-slate-800/80" },
    ],
    stylePoints: [
      "Fully branded, custom design",
      "Multi-page navigation structure",
      "Integrated live booking calendar",
      "Lead capture on every page",
      "Analytics & conversion tracking",
    ],
    goodFor:
      "Clinics, law firms, agencies, consultants, gyms, tutors, coaches, growing SMEs",
  },

  Enterprise: {
    headline: "10+ page fully custom website",
    description:
      "A bespoke digital platform built around your exact business requirements — complete with e-commerce, advanced booking, API integrations, and a client portal.",
    accentColor: "text-cyan-400",
    accentBorder: "border-cyan-500/30",
    accentBar: "bg-cyan-500",
    pages: [
      { name: "Home" },
      { name: "Services" },
      { name: "Case Studies" },
      { name: "About / Team" },
      { name: "Blog / News" },
      { name: "Careers" },
      { name: "Contact" },
      { name: "+ custom pages" },
    ],
    wire: [
      { label: "Advanced nav with dropdowns", height: "h-6", bg: "bg-slate-700/80" },
      { label: "Custom hero — video / animation", height: "h-16", bg: "bg-cyan-500/20" },
      { label: "Services / Product showcase", height: "h-12", bg: "bg-slate-700/50" },
      { label: "E-commerce / Payment flow", height: "h-11", bg: "bg-cyan-500/15" },
      { label: "Advanced booking & scheduling", height: "h-10", bg: "bg-slate-700/50" },
      { label: "Client portal / dashboard", height: "h-10", bg: "bg-cyan-500/15" },
      { label: "Custom integrations & APIs", height: "h-8", bg: "bg-slate-700/50" },
      { label: "Footer — full link architecture", height: "h-7", bg: "bg-slate-800/80" },
    ],
    stylePoints: [
      "Fully bespoke layouts & branding",
      "Custom animations & interactions",
      "E-commerce or payment integration",
      "Client portal access",
      "Advanced SEO & page architecture",
    ],
    goodFor:
      "Large companies, e-commerce brands, healthcare, SaaS businesses, property firms, hospitality",
  },
};

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({
  planName,
  onClose,
}: {
  planName: string;
  onClose: () => void;
}) {
  const preview = previews[planName];
  const plan = plans.find((p) => p.name === planName)!;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-3xl max-h-[90vh] glass-card rounded-2xl border border-riden-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-riden-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${plan.iconBg} flex items-center justify-center`}>
              <plan.icon size={15} className={plan.iconColor} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{planName} Plan — Website Preview</h3>
              <p className="text-xs text-slate-500">{preview.headline}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 portal-scroll">
          <div className="grid sm:grid-cols-2 gap-0 sm:divide-x sm:divide-riden-border">

            {/* Left — wireframe */}
            <div className="p-5 sm:p-6 border-b sm:border-b-0 border-riden-border">
              <div className="flex items-center gap-2 mb-4">
                <Monitor size={13} className="text-slate-500" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Page Layout</span>
              </div>

              {/* Browser chrome */}
              <div className="rounded-xl border border-riden-border overflow-hidden bg-riden-surface">
                {/* Chrome bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-riden-muted border-b border-riden-border">
                  <div className="w-2 h-2 rounded-full bg-red-500/60" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                  <div className="flex-1 mx-2 h-4 rounded bg-riden-border/60 flex items-center px-2">
                    <span className="text-[9px] text-slate-600">yourbusiness.com</span>
                  </div>
                </div>

                {/* Page tabs (multi-page plans) */}
                {preview.pages.length > 1 && (
                  <div className="flex items-center gap-1 px-2 py-1.5 bg-riden-muted/50 border-b border-riden-border overflow-x-auto">
                    {preview.pages.map((page, i) => (
                      <span
                        key={i}
                        className={`text-[9px] px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${
                          i === 0
                            ? `${plan.tickBg} ${plan.tickColor} font-medium`
                            : "text-slate-600"
                        }`}
                      >
                        {page.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Wireframe sections */}
                <div className="p-2 space-y-1">
                  {preview.wire.map((section, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`${section.height} ${section.bg} rounded flex items-center px-2`}
                    >
                      <span className="text-[9px] text-slate-400/80 truncate">{section.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — details */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Description */}
              <div>
                <p className="text-sm text-slate-300 leading-relaxed">{preview.description}</p>
              </div>

              {/* Pages included */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={13} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pages Included</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preview.pages.map((page, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-lg border ${preview.accentBorder} ${preview.accentColor} bg-white/[0.03]`}
                    >
                      {page.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Design style */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={13} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Design Style</span>
                </div>
                <ul className="space-y-2">
                  {preview.stylePoints.map((point, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${preview.accentBar}`} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Good for */}
              <div className="rounded-xl bg-riden-muted/60 border border-riden-border p-3.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Great for</p>
                <p className="text-sm text-slate-300 leading-relaxed">{preview.goodFor}</p>
              </div>

              {/* CTA */}
              <Link href="/contact" onClick={onClose} className="block">
                <Button variant={plan.ctaVariant} size="lg" className="w-full min-h-[48px]">
                  {plan.cta}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Trust strip ──────────────────────────────────────────────────────────────

const trustItems = [
  "SSL certificate included",
  "No long-term contracts",
  "UK-based support",
  "No hidden fees",
];

// ─── Main section ─────────────────────────────────────────────────────────────

export default function PricingSection() {
  const [previewPlan, setPreviewPlan] = useState<string | null>(null);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-riden-dark" />
      <div className="absolute inset-0 dot-pattern opacity-30" />

      {/* Preview modal */}
      <AnimatePresence>
        {previewPlan && (
          <PreviewModal planName={previewPlan} onClose={() => setPreviewPlan(null)} />
        )}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 text-sm text-cyan-300 mb-6"
          >
            <Crown size={14} />
            <span>Simple, Transparent Pricing</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Bespoke websites.{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}>One clear price.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            A one-time build fee gets your website live. A simple monthly rate
            keeps it supported, maintained, and growing.
          </motion.p>

          {/* Model explainer pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="inline-flex flex-wrap justify-center items-center gap-3 mt-7"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-riden-border text-sm">
              <Hammer size={14} className="text-blue-400 flex-shrink-0" />
              <span className="text-slate-300 font-medium">Build fee</span>
              <span className="text-slate-500">— one-time</span>
            </div>
            <span className="text-slate-600 font-bold text-lg">+</span>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-riden-border text-sm">
              <RefreshCw size={13} className="text-violet-400 flex-shrink-0" />
              <span className="text-slate-300 font-medium">Maintenance</span>
              <span className="text-slate-500">— monthly</span>
            </div>
          </motion.div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative glass-card rounded-2xl border transition-all duration-300 ${plan.border} ${plan.glow} flex flex-col`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-2xl pointer-events-none`} />

              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-xs font-semibold text-white shadow-glow whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="relative flex flex-col flex-1 p-5 sm:p-6">

                {/* Identity */}
                <div className="flex items-center gap-3 mb-1.5">
                  <div className={`w-9 h-9 rounded-xl ${plan.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <plan.icon size={17} className={plan.iconColor} />
                  </div>
                  <span className="text-lg font-bold text-white">{plan.name}</span>
                </div>
                <p className="text-xs text-slate-500 mb-5 leading-snug">{plan.tagline}</p>

                {/* Pricing */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl sm:text-[2.2rem] font-bold text-white leading-none">
                      {plan.buildPrice}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Hammer size={11} className="text-slate-600 flex-shrink-0" />
                    <span className="text-xs text-slate-500">{plan.buildSub}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-4 pt-4 border-t border-riden-border/60">
                    <span className="text-xl font-semibold text-slate-300">{plan.maintenance}</span>
                    <span className="text-sm text-slate-500">{plan.maintSub}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <RefreshCw size={11} className="text-slate-600 flex-shrink-0" />
                    <span className="text-xs text-slate-500">ongoing maintenance</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-2.5 mb-5">
                  <Link href={plan.ctaHref} className="block">
                    <Button variant={plan.ctaVariant} size="lg" className="w-full min-h-[48px]">
                      {plan.cta}
                    </Button>
                  </Link>
                  <button
                    onClick={() => setPreviewPlan(plan.name)}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-riden-border text-xs font-medium text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.03] transition-all duration-200"
                  >
                    <Eye size={13} />
                    Preview website
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-riden-border mb-5" />

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded-full ${plan.tickBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check size={10} className={plan.tickColor} />
                      </div>
                      <span className="text-sm text-slate-300 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust strip */}
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
