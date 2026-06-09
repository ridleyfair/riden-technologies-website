"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wrench, Target, Users, Globe } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Results-First",
    description: "Every decision we make is driven by real, measurable outcomes for our clients.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Wrench,
    title: "Crafted with Care",
    description: "We build every website from scratch, bespoke to your business, not copied from a template.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Users,
    title: "Client-Obsessed",
    description: "Your success is our success. We go beyond delivery to make sure our work has real impact.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Globe,
    title: "Built to Grow",
    description: "Everything we build is designed to grow with your business, not lock you in.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-20 bg-[#03040a]">

      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[min(400px,60vw)] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)", filter: "blur(60px)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 text-sm text-blue-300 mb-6 sm:mb-8"
          >
            <Wrench size={14} />
            <span>About Riden Technologies</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight"
          >
            A Web Agency Built for{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}>
              Real Businesses
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Riden Technologies was founded with a simple idea: every business deserves a
            professional online presence. Not just the big ones with big budgets.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 sm:py-24" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">
                Our{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}>
                  Mission
                </span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                We started Riden Technologies because we saw a problem: trades businesses like
                plumbers, electricians, builders, and roofers were working hard every day but
                losing potential clients to competitors with better-looking websites.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                We fix that. We craft bespoke, professional websites tailored for your trade,
                include a free CRM to manage your leads and clients, and stay by your side with
                ongoing support. No jargon, no hidden fees, no fuss.
              </p>

              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                {[
                  { value: "500+", label: "Sites Built" },
                  { value: "UK", label: "Based & Supported" },
                  { value: "98%", label: "Satisfaction" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="text-2xl font-bold bg-clip-text text-transparent"
                      style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #38bdf8)" }}>
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
              {values.map((value, i) => (
                <div key={i} className="p-5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className={`w-10 h-10 rounded-xl ${value.bg} flex items-center justify-center mb-3`}>
                    <value.icon size={18} className={value.color} />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2">{value.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
