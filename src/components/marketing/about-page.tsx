"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wrench, Target, Users, Globe } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Results-First",
    description: "Every decision we make is driven by real, measurable outcomes for our clients.",
    accent: "blue",
  },
  {
    icon: Wrench,
    title: "Crafted with Care",
    description: "We build every website from scratch, bespoke to your business, not copied from a template.",
    accent: "violet",
  },
  {
    icon: Users,
    title: "Client-Obsessed",
    description: "Your success is our success. We go beyond delivery to make sure our work has real impact.",
    accent: "cyan",
  },
  {
    icon: Globe,
    title: "Built to Grow",
    description: "Everything we build is designed to grow with your business, not lock you in.",
    accent: "emerald",
  },
];

const accentMap: Record<string, { chip: string; ring: string; icon: string }> = {
  blue: { chip: "from-blue-50 to-sky-50", ring: "ring-blue-100", icon: "text-blue-600" },
  violet: { chip: "from-violet-50 to-fuchsia-50", ring: "ring-violet-100", icon: "text-violet-600" },
  cyan: { chip: "from-cyan-50 to-sky-50", ring: "ring-cyan-100", icon: "text-cyan-600" },
  emerald: { chip: "from-emerald-50 to-teal-50", ring: "ring-emerald-100", icon: "text-emerald-600" },
};

const stats = [
  { value: "Bespoke", label: "Built for you" },
  { value: "UK", label: "Based & Supported" },
  { value: "Done", label: "For you, start to finish" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function AboutPage() {
  return (
    <div className="pt-20 bg-white">

      {/* Hero */}
      <section className="relative py-16 sm:py-24 bg-white overflow-hidden">
        {/* soft brand wash */}
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100 mb-6 sm:mb-8"
          >
            <Wrench size={14} />
            <span>About Riden Technologies</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight"
          >
            A Web Agency Built for{" "}
            <span className="gradient-text-brand">Real Businesses</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
          >
            Riden Technologies was founded with a simple idea: every business deserves a
            professional online presence. Not just the big ones with big budgets.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                Our <span className="gradient-text-brand">Mission</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                We started Riden Technologies because we saw a problem: trades businesses like
                plumbers, electricians, builders, and roofers were working hard every day but
                losing potential clients to competitors with better-looking websites.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                We fix that. We craft bespoke, professional websites tailored for your trade,
                then stay by your side with ongoing support and maintenance, keeping everything
                updated, fast and working hard for you. No jargon, no hidden fees, no fuss.
              </p>

              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="text-center p-4 rounded-xl card-light"
                  >
                    <div className="text-2xl font-bold gradient-text-brand">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {values.map((value, i) => {
                const a = accentMap[value.accent];
                const Icon = value.icon;
                return (
                  <div key={i} className="p-5 rounded-xl card-light">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${a.chip} ring-1 ${a.ring} mb-3`}
                    >
                      <Icon size={18} className={a.icon} />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">{value.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{value.description}</p>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
