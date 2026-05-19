"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Target, Users, Globe } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Results-First",
    description: "Every decision we make is driven by measurable outcomes for our clients.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "AI-Native",
    description: "We build with AI at the core, not as an afterthought or feature add-on.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Users,
    title: "Client-Obsessed",
    description: "Your success is our success. We go beyond delivery to ensure real impact.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Globe,
    title: "Globally Scalable",
    description: "We build systems designed to grow with your business across any market.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/20 text-sm text-blue-300 mb-8"
          >
            <Zap size={14} />
            <span>About Riden Technologies</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6"
          >
            We Build the Future of{" "}
            <span className="gradient-text">Business Technology</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto"
          >
            Riden Technologies was founded with a singular mission: make enterprise-grade AI
            technology accessible to every business, regardless of size or industry.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-riden-surface/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Our <span className="gradient-text">Mission</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                We started Riden Technologies because we saw a massive gap: large enterprises
                had access to world-class digital infrastructure, while small and medium businesses
                were left with clunky, expensive tools that never quite worked together.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                We&apos;ve built an integrated platform that gives any business — from solopreneurs
                to mid-market companies — the same AI-powered advantage that Fortune 500 companies
                enjoy. And we deliver it faster, more affordably, and with better support.
              </p>

              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: "500+", label: "Clients" },
                  { value: "$50M+", label: "Revenue Generated" },
                  { value: "98%", label: "Satisfaction" },
                ].map((stat, i) => (
                  <div key={i} className="text-center glass-card p-4 rounded-xl border border-riden-border">
                    <div className="text-2xl font-bold gradient-text-blue">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
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
                <div key={i} className="glass-card p-5 rounded-xl border border-riden-border">
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
