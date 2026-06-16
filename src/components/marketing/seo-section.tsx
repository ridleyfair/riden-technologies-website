"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, FileStack, Globe2, Tags, Code2, ImageDown, Target, ArrowRight, TrendingUp } from "lucide-react";

const points = [
  { icon: MapPin, title: "Local SEO setup", desc: "Optimised to show up for the services you offer in the towns and areas you cover." },
  { icon: FileStack, title: "Service pages", desc: "Dedicated pages for each service so the right customers find exactly what they need." },
  { icon: Globe2, title: "Google indexing", desc: "Submitted to Google so your website actually appears in search results." },
  { icon: Tags, title: "Page titles & descriptions", desc: "Clear, keyword-aware titles and descriptions written for every page." },
  { icon: Code2, title: "Structured data", desc: "Behind-the-scenes markup that helps Google understand and feature your business." },
  { icon: ImageDown, title: "Image optimisation", desc: "Fast-loading, properly labelled images so your site is quick and search-friendly." },
  { icon: Target, title: "Area targeting", desc: "Built to win enquiries from nearby customers searching in your service areas." },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function SeoSection() {
  return (
    <section id="seo" className="relative py-20 sm:py-28 bg-white overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.span
            {...fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            Get Found On Google
          </motion.span>
          <motion.h2
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
          >
            SEO that brings you{" "}
            <span className="gradient-text-brand">local enquiries</span>
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            A beautiful website only works if customers can find it. Every site we build is set
            up to be found by the people searching for your services nearby. No jargon required.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {points.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 4) * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl card-light p-5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 ring-1 ring-cyan-100">
                  <Icon className="h-5 w-5 text-cyan-600" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </motion.div>
            );
          })}

          {/* result tile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-5 shadow-lg shadow-blue-600/20 flex flex-col justify-center"
          >
            <TrendingUp className="h-6 w-6 text-white" />
            <h3 className="mt-3 text-base font-semibold text-white">More visibility, more enquiries</h3>
            <p className="mt-1.5 text-sm text-blue-50/90 leading-relaxed">
              The goal is simple: be the business local customers find and call first.
            </p>
          </motion.div>
        </div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-all hover:bg-slate-50 hover:ring-slate-400"
          >
            Ask us how SEO works for your trade
            <ArrowRight className="h-4 w-4 text-blue-600" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
