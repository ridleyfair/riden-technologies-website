"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    price: { monthly: 297, annual: 247 },
    description: "Perfect for small businesses ready to scale their digital presence.",
    badge: null,
    gradient: "from-blue-500/10 to-transparent",
    border: "border-riden-border hover:border-blue-500/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    cta: "Get Started",
    ctaVariant: "outline" as const,
    features: [
      "1 AI-generated website",
      "Up to 50 leads/month",
      "Basic CRM dashboard",
      "Email automation (3 workflows)",
      "Monthly analytics report",
      "Standard support",
      "SSL + hosting included",
    ],
  },
  {
    name: "Growth",
    icon: Crown,
    price: { monthly: 697, annual: 597 },
    description: "For growing businesses that need powerful automation and CRM tools.",
    badge: "Most Popular",
    gradient: "from-violet-500/20 to-blue-500/10",
    border: "border-violet-500/40",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    cta: "Start Growing",
    ctaVariant: "gradient" as const,
    features: [
      "3 AI-generated websites",
      "Unlimited leads",
      "Full CRM platform",
      "Unlimited automations",
      "Advanced analytics + AI insights",
      "Booking & calendar system",
      "Invoice & payment processing",
      "Priority support",
      "White-label ready",
    ],
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: { monthly: 1497, annual: 1247 },
    description: "Complete enterprise solution for scaling organizations with complex needs.",
    badge: "Best Value",
    gradient: "from-cyan-500/10 to-transparent",
    border: "border-riden-border hover:border-cyan-500/30",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    features: [
      "Unlimited websites",
      "Unlimited leads & clients",
      "Full CRM + team management",
      "Custom automation builder",
      "Enterprise analytics suite",
      "Multi-user + role management",
      "Custom integrations + API",
      "Dedicated account manager",
      "SLA guarantee",
      "Custom AI model training",
    ],
  },
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-riden-dark" />
      <div className="absolute inset-0 dot-pattern opacity-30" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
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
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Simple, <span className="gradient-text">Predictable Pricing</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-8"
          >
            No hidden fees. No surprise charges. Pick the plan that fits your
            business and scale when you&apos;re ready.
          </motion.p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-3 p-1 rounded-xl bg-riden-muted border border-riden-border"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isAnnual
                  ? "bg-riden-surface text-white shadow-card"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isAnnual
                  ? "bg-riden-surface text-white shadow-card"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Annual
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                Save 17%
              </span>
            </button>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`relative glass-card rounded-2xl p-6 border transition-all duration-300 ${plan.border}`}
            >
              {/* Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-2xl pointer-events-none`} />

              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-xs font-semibold text-white shadow-glow">
                  {plan.badge}
                </div>
              )}

              <div className="relative">
                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${plan.iconBg} flex items-center justify-center`}>
                    <plan.icon size={18} className={plan.iconColor} />
                  </div>
                  <span className="text-lg font-bold text-white">{plan.name}</span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  {isAnnual && (
                    <div className="text-xs text-emerald-400 mt-1">
                      Save ${(plan.price.monthly - plan.price.annual) * 12}/year
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-400 mb-6">{plan.description}</p>

                {/* CTA */}
                <Link href="/contact" className="block mb-6">
                  <Button variant={plan.ctaVariant} size="lg" className="w-full">
                    {plan.cta}
                  </Button>
                </Link>

                {/* Divider */}
                <div className="border-t border-riden-border mb-6" />

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={12} className="text-blue-400" />
                      </div>
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-slate-500 text-sm">
            All plans include a 14-day free trial. No credit card required.{" "}
            <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
              Contact us for custom plans.
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
