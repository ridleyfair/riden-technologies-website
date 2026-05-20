"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Lightbulb, Code2, Rocket, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Strategy Call",
    description:
      "We dive deep into your business goals, target market, and current challenges to build a tailored growth roadmap.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Lightbulb,
    step: "02",
    title: "Custom Blueprint",
    description:
      "Our team designs a comprehensive digital strategy — from website architecture to CRM flows and automation sequences.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    icon: Code2,
    step: "03",
    title: "Build & Launch",
    description:
      "We build your AI-powered website, configure your CRM, and deploy your automation systems — typically within 7–14 days.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Go Live",
    description:
      "Your entire digital ecosystem goes live. We handle deployment, testing, and ensure everything runs flawlessly.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: TrendingUp,
    step: "05",
    title: "Scale & Optimize",
    description:
      "Continuous monitoring, AI-driven optimization, and ongoing improvements keep your systems performing at peak efficiency.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

export default function ProcessSection() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-riden-surface to-riden-dark" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/20 text-sm text-emerald-300 mb-6"
          >
            <Rocket size={14} />
            <span>Our Process</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            From Zero to{" "}
            <span className="gradient-text">Fully Operational</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Our proven 5-step process takes your business from strategy to full
            digital transformation in as little as two weeks.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-12 left-[calc(10%+24px)] right-[calc(10%+24px)] h-px bg-gradient-to-r from-blue-500/50 via-violet-500/50 to-emerald-500/50 hidden lg:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Icon Circle */}
                <div
                  className={`relative w-12 h-12 rounded-full ${step.bg} border ${step.border} flex items-center justify-center mb-4 z-10`}
                >
                  <step.icon size={20} className={step.color} />
                  {/* Step number */}
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-riden-surface border border-riden-border flex items-center justify-center text-xs font-bold text-slate-400">
                    {step.step.replace("0", "")}
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
