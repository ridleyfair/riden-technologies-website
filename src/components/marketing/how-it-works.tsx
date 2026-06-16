"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Wand2, Eye, Rocket, Route, ArrowUpRight } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Tell us about your business",
    description:
      "Share what you do, where you work and the customers you want more of. A quick chat or short form is all it takes.",
    accent: "blue",
  },
  {
    icon: Wand2,
    title: "We build your website preview",
    description:
      "Our team designs and builds a professional website around your business, then shows you a live preview.",
    accent: "violet",
  },
  {
    icon: Eye,
    title: "You review and request changes",
    description:
      "Have a look and tell us what you'd like tweaked: wording, photos, colours, layout. We refine it until you're happy.",
    accent: "cyan",
  },
  {
    icon: Rocket,
    title: "We publish it live and manage everything",
    description:
      "We launch your site, connect your domain and handle hosting, updates and support, so it keeps working for you.",
    accent: "emerald",
  },
];

const accentMap: Record<string, { chip: string; ring: string; icon: string; num: string }> = {
  blue: { chip: "from-blue-50 to-sky-50", ring: "ring-blue-100", icon: "text-blue-600", num: "bg-blue-600" },
  violet: { chip: "from-violet-50 to-fuchsia-50", ring: "ring-violet-100", icon: "text-violet-600", num: "bg-violet-600" },
  cyan: { chip: "from-cyan-50 to-sky-50", ring: "ring-cyan-100", icon: "text-cyan-600", num: "bg-cyan-600" },
  emerald: { chip: "from-emerald-50 to-teal-50", ring: "ring-emerald-100", icon: "text-emerald-600", num: "bg-emerald-600" },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* soft brand wash */}
      <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.span
            {...fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            <Route size={14} /> How It Works
          </motion.span>

          <motion.h2
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
          >
            Live in four{" "}
            <span className="gradient-text-brand">simple steps</span>
          </motion.h2>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            No tech know-how needed. We do the heavy lifting. Just tell us about
            your business and approve the result.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-6 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, rgba(37,99,235,0.35), rgba(124,58,237,0.35), rgba(8,145,178,0.35), rgba(5,150,105,0.35))",
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((step, i) => {
              const a = accentMap[step.accent];
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: (i % 4) * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div
                    className={`relative inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${a.chip} ring-1 ${a.ring} mb-5 z-10`}
                  >
                    <Icon className={`h-6 w-6 ${a.icon}`} />
                    <span
                      className={`absolute -top-2 -right-2 h-5 w-5 rounded-full ${a.num} flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-white`}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="mt-14 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
          >
            Get My Website Preview
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
