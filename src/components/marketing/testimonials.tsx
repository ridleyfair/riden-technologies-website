"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Quote, MessageSquareQuote } from "lucide-react";
import { TESTIMONIALS, HAS_REAL_TESTIMONIALS, type Testimonial } from "@/lib/testimonials";

const accentMap: Record<Testimonial["accent"], string> = {
  blue: "from-blue-500 to-cyan-500",
  violet: "from-violet-500 to-purple-500",
  cyan: "from-cyan-500 to-blue-500",
  emerald: "from-emerald-500 to-teal-500",
  amber: "from-amber-500 to-orange-500",
};

function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: (index % 3) * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl p-6 sm:p-7 ${
        t.isPlaceholder
          ? "bg-slate-50 border border-dashed border-slate-300"
          : "card-light"
      }`}
    >
      {t.isPlaceholder && (
        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Sample
        </span>
      )}

      <Quote
        size={24}
        className={`mb-4 ${t.isPlaceholder ? "text-slate-300" : "text-blue-200"}`}
      />
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: t.rating }).map((_, j) => (
          <Star
            key={j}
            size={14}
            className={`fill-current ${t.isPlaceholder ? "text-slate-300" : "text-amber-400"}`}
          />
        ))}
      </div>
      <p
        className={`text-sm leading-relaxed mb-6 ${
          t.isPlaceholder ? "text-slate-500" : "text-slate-600"
        }`}
      >
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            t.isPlaceholder
              ? "bg-slate-200 text-slate-400"
              : `bg-gradient-to-br ${accentMap[t.accent]} text-white`
          }`}
        >
          {t.initials}
        </div>
        <div>
          <div
            className={`text-sm font-semibold ${
              t.isPlaceholder ? "text-slate-500" : "text-slate-900"
            }`}
          >
            {t.name}
          </div>
          <div className="text-xs text-slate-500">{t.business}</div>
        </div>
      </div>
    </motion.div>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function Testimonials() {
  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* soft brand wash */}
      <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.span
            {...fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            <Star size={13} className="fill-current text-amber-500" />
            What Our Clients Say
          </motion.span>

          <motion.h2
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
          >
            Loved by{" "}
            <span className="gradient-text-brand">local businesses</span>
          </motion.h2>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            {HAS_REAL_TESTIMONIALS
              ? "Real words from the trades and service businesses we've helped grow."
              : "We're just getting started. These are sample cards, ready to fill with real reviews from our clients."}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} t={t} index={i} />
          ))}
        </div>

        {!HAS_REAL_TESTIMONIALS && (
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-10 text-sm text-slate-500"
          >
            <MessageSquareQuote size={15} />
            <span>
              Worked with us?{" "}
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors"
              >
                We&apos;d love your review.
              </Link>
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
