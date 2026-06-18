"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

interface Section {
  title: string;
  content: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  effectiveDate: string;
  sections: Section[];
}

export default function LegalLayout({ title, subtitle, lastUpdated, effectiveDate, sections }: LegalPageProps) {
  return (
    <div className="pt-20 min-h-screen">
      {/* Hero */}
      <section className="relative py-14 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">{title}</h1>
            <p className="text-slate-400 text-base sm:text-lg mb-6 max-w-2xl">{subtitle}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Last updated: {lastUpdated}
              </span>
              <span className="text-slate-600">•</span>
              <span>Effective: {effectiveDate}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-riden-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 glass-card rounded-xl border border-riden-border p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Contents</p>
                <nav className="space-y-1">
                  {sections.map((s, i) => (
                    <a
                      key={i}
                      href={`#section-${i}`}
                      className="block text-sm text-slate-400 hover:text-white py-1 transition-colors leading-snug"
                    >
                      <span className="text-slate-600 mr-2">{i + 1}.</span>
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </motion.aside>

            {/* Document */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-3 space-y-10"
            >
              {sections.map((s, i) => (
                <div key={i} id={`section-${i}`} className="scroll-mt-28">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    {s.title}
                  </h2>
                  <div className="text-slate-400 text-sm leading-7 space-y-3 pl-10">
                    {s.content}
                  </div>
                </div>
              ))}

              {/* Footer note */}
              <div className="pt-8 border-t border-riden-border">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Riden Technologies · London, UK · enquiries@ridentechnologies.com
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs">
                  {[
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms of Service", href: "/terms" },
                    { label: "Cookie Policy", href: "/cookies" },
                    { label: "Acceptable Use", href: "/acceptable-use" },
                    { label: "Refund Policy", href: "/refund-policy" },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="text-slate-500 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
