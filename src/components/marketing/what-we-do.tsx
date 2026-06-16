"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Paintbrush,
  Wrench,
  Server,
  Search,
  ImagePlus,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

// ─── Reference light-mode section pattern for the redesigned public site ──────

const services = [
  {
    icon: Paintbrush,
    title: "Website Design",
    desc: "Clean, modern websites designed around your business, your customers and the work you want more of.",
    accent: "blue",
  },
  {
    icon: Wrench,
    title: "Website Maintenance",
    desc: "We keep everything running, updated and secure. New photos, prices or pages? Just send them over.",
    accent: "cyan",
  },
  {
    icon: Server,
    title: "Hosting & Domains",
    desc: "Fast, reliable hosting and your domain handled for you. No separate bills, no technical setup.",
    accent: "indigo",
  },
  {
    icon: Search,
    title: "Local SEO",
    desc: "Set up to be found on Google for the services you offer in the areas you actually work.",
    accent: "emerald",
  },
  {
    icon: ImagePlus,
    title: "Content Updates",
    desc: "Want to change wording, add a service or refresh your gallery? We make the changes, usually same day.",
    accent: "violet",
  },
  {
    icon: Sparkles,
    title: "Website Redesigns",
    desc: "Got an old or tired website? We rebuild it into something modern that wins more enquiries.",
    accent: "amber",
  },
];

const accentMap: Record<string, { chip: string; ring: string; icon: string }> = {
  blue: { chip: "from-blue-50 to-sky-50", ring: "ring-blue-100", icon: "text-blue-600" },
  cyan: { chip: "from-cyan-50 to-sky-50", ring: "ring-cyan-100", icon: "text-cyan-600" },
  indigo: { chip: "from-indigo-50 to-blue-50", ring: "ring-indigo-100", icon: "text-indigo-600" },
  emerald: { chip: "from-emerald-50 to-teal-50", ring: "ring-emerald-100", icon: "text-emerald-600" },
  violet: { chip: "from-violet-50 to-fuchsia-50", ring: "ring-violet-100", icon: "text-violet-600" },
  amber: { chip: "from-amber-50 to-orange-50", ring: "ring-amber-100", icon: "text-amber-600" },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function WhatWeDo() {
  return (
    <section id="services" className="relative py-20 sm:py-28 bg-white overflow-hidden">
      {/* soft brand wash */}
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.span
            {...fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            What We Do
          </motion.span>
          <motion.h2
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
          >
            Everything your website needs,{" "}
            <span className="gradient-text-brand">handled for you</span>
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            We design, build, host and look after your website from start to finish, so you
            can stay focused on running your business.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {services.map((s, i) => {
            const a = accentMap[s.accent];
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group relative rounded-2xl card-light p-6 sm:p-7"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${a.chip} ring-1 ${a.ring}`}
                >
                  <Icon className={`h-6 w-6 ${a.icon}`} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                <ArrowUpRight className="absolute top-6 right-6 h-5 w-5 text-slate-300 transition-all duration-300 group-hover:text-blue-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </motion.div>
            );
          })}
        </div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="mt-12 text-center">
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
