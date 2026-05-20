"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Building2, Hammer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    tagline: "Startups, local businesses & new ventures.",
    icon: Zap,
    buildPrice: "£150 – £250",
    buildSub: "one-time website build",
    maintenance: "£25",
    maintSub: "per month",
    badge: null,
    popular: false,
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
      "1-page professional website",
      "Mobile-responsive design",
      "Contact & enquiry form",
      "Basic on-page SEO setup",
      "CRM dashboard access",
      "Lead collection & tracking",
      "Monthly support & updates",
      "Hosting setup assistance",
    ],
  },
  {
    name: "Pro+",
    tagline: "Growing businesses that need automation.",
    icon: Crown,
    buildPrice: "From £500",
    buildSub: "one-time website build",
    maintenance: "£50",
    maintSub: "per month",
    badge: "Most Popular",
    popular: true,
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
      "5-page custom website",
      "Home, Solutions, Pricing, About & Contact",
      "Advanced responsive design",
      "Booking & calendar system",
      "CRM dashboard & lead management",
      "Automation workflows",
      "Analytics dashboard",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    tagline: "Larger organisations with complex requirements.",
    icon: Building2,
    buildPrice: "From £1,000",
    buildSub: "one-time website build",
    maintenance: "£100",
    maintSub: "per month",
    badge: null,
    popular: false,
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
      "10+ page fully custom website",
      "Custom page layouts & sections",
      "Advanced booking & scheduling system",
      "E-commerce or payment integration",
      "Full CRM dashboard & automation",
      "Custom API & third-party integrations",
      "Advanced analytics & reporting",
      "Dedicated account manager",
      "Strategy consultation sessions",
      "Priority support & SLA guarantee",
    ],
  },
];

const trustItems = [
  "SSL certificate included",
  "No long-term contracts",
  "UK-based support",
  "No hidden fees",
];

export default function PricingSection() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-riden-dark" />
      <div className="absolute inset-0 dot-pattern opacity-30" />

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
            <span>Transparent Pricing</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            One website.{" "}
            <span className="gradient-text">One clear price.</span>
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

          {/* Pricing model explainer */}
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
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-2xl pointer-events-none`} />

              {/* Popular badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-xs font-semibold text-white shadow-glow whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="relative flex flex-col flex-1 p-5 sm:p-6">

                {/* Plan identity */}
                <div className="flex items-center gap-3 mb-1.5">
                  <div className={`w-9 h-9 rounded-xl ${plan.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <plan.icon size={17} className={plan.iconColor} />
                  </div>
                  <span className="text-lg font-bold text-white">{plan.name}</span>
                </div>
                <p className="text-xs text-slate-500 mb-5 leading-snug">{plan.tagline}</p>

                {/* Build price — primary */}
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

                  {/* Maintenance — secondary */}
                  <div className="flex items-baseline gap-1 mt-4 pt-4 border-t border-riden-border/60">
                    <span className="text-xl font-semibold text-slate-300">
                      {plan.maintenance}
                    </span>
                    <span className="text-sm text-slate-500">{plan.maintSub}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <RefreshCw size={11} className="text-slate-600 flex-shrink-0" />
                    <span className="text-xs text-slate-500">ongoing maintenance</span>
                  </div>
                </div>

                {/* CTA */}
                <Link href={plan.ctaHref} className="block mb-5">
                  <Button variant={plan.ctaVariant} size="lg" className="w-full min-h-[48px]">
                    {plan.cta}
                  </Button>
                </Link>

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

        {/* Custom needs note */}
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
