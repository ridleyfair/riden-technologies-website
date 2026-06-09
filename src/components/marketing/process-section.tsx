"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Lightbulb, Code2, Rocket, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Discovery Call",
    description:
      "We take the time to understand your trade, your customers, and what makes your business tick — so every decision we make is built around you.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Lightbulb,
    step: "02",
    title: "Bespoke Blueprint",
    description:
      "Our team crafts a tailored plan for your website — from the layout and pages through to your CRM setup and any automation flows you need.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    icon: Code2,
    step: "03",
    title: "Build & Craft",
    description:
      "We design and build your website from scratch — no templates, no shortcuts. Your CRM is configured and everything is tested before it goes live.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Go Live",
    description:
      "Your new website goes live. We handle deployment, final checks, and make sure everything runs exactly as it should — typically within 2–5 business days.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: TrendingUp,
    step: "05",
    title: "Ongoing Support",
    description:
      "We don't disappear after launch. Ongoing maintenance, content updates, and support keep your website sharp and your business moving forward.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
];

export default function ProcessSection() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #0a0d1a, #03040a)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-sm text-emerald-300 mb-6"
          >
            <Rocket size={14} />
            <span>How We Work</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            From First Call to{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}>
              Fully Live
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            A straightforward five-step process that takes your business from a blank slate
            to a fully built, live website — in as little as two weeks.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-12 left-[calc(10%+24px)] right-[calc(10%+24px)] h-px hidden lg:block"
            style={{ background: "linear-gradient(to right, rgba(59,130,246,0.4), rgba(139,92,246,0.4), rgba(16,185,129,0.4))" }} />

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
                <div className={`relative w-12 h-12 rounded-full ${step.bg} border ${step.border} flex items-center justify-center mb-4 z-10`}>
                  <step.icon size={20} className={step.color} />
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-slate-400"
                    style={{ background: "#0a0d1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {i + 1}
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
