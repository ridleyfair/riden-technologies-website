"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wrench,
  Zap,
  HardHat,
  Hammer,
  Home,
  Trees,
  Sparkles,
  Dumbbell,
  Store,
  ArrowUpRight,
} from "lucide-react";

const industries = [
  { icon: Wrench, label: "Plumbers" },
  { icon: Zap, label: "Electricians" },
  { icon: HardHat, label: "Builders" },
  { icon: Hammer, label: "Carpenters" },
  { icon: Home, label: "Roofers" },
  { icon: Trees, label: "Landscapers" },
  { icon: Sparkles, label: "Beauty Therapists" },
  { icon: Dumbbell, label: "Fitness Coaches" },
  { icon: Store, label: "Local Services" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function IndustriesSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-white overflow-hidden">
      {/* soft brand wash */}
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.span
            {...fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            Industries We Help
          </motion.span>
          <motion.h2
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
          >
            Built for{" "}
            <span className="gradient-text-brand">trades &amp; local services</span>
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            Whatever your trade, we build websites that help local customers find you and
            get in touch.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5">
          {industries.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <motion.div
                key={ind.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 3) * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-2xl card-light px-4 py-5 sm:px-5 flex items-center gap-3"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-100 flex-shrink-0">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm sm:text-base font-medium text-slate-900">{ind.label}</span>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          {...fadeUp}
          transition={{ delay: 0.2 }}
          className="text-center text-slate-500 text-sm mt-10"
        >
          Don&apos;t see your trade?{" "}
          <Link href="/contact" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors">
            We build for all local businesses. Just ask.
          </Link>
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.25 }}
          className="flex justify-center mt-8"
        >
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
