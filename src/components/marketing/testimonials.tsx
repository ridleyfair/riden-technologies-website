"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { TESTIMONIALS, type Testimonial } from "@/lib/testimonials";

const accentGradient: Record<Testimonial["accent"], string> = {
  blue: "from-blue-500 to-cyan-500",
  violet: "from-violet-500 to-purple-500",
  cyan: "from-cyan-500 to-blue-500",
  emerald: "from-emerald-500 to-teal-500",
  amber: "from-amber-500 to-orange-500",
};

const CARD_W = 520;
const CARD_H = 340;

function ReviewCard({ t }: { t: Testimonial }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] bg-white select-none p-8 sm:p-10">
      {/* Top: quote icon + stars */}
      <div className="flex items-start justify-between mb-5">
        <Quote size={28} className="text-blue-200 shrink-0" />
        <div className="flex items-center gap-1">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>

      {/* Quote text */}
      <p className="flex-1 text-slate-600 text-[0.95rem] leading-relaxed">
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Divider */}
      <div className="my-6 h-px bg-slate-100" />

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 shrink-0">
          {t.avatar ? (
            <Image
              src={t.avatar}
              alt={t.name}
              fill
              sizes="48px"
              className="rounded-full object-cover object-top"
            />
          ) : (
            <div
              className={`h-12 w-12 rounded-full bg-gradient-to-br ${accentGradient[t.accent]} flex items-center justify-center text-sm font-bold text-white`}
            >
              {t.initials}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t.business}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = TESTIMONIALS.length;

  const prev = useCallback(() => setActive((a) => (a - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((a) => (a + 1) % count), [count]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const getPos = (i: number) => {
    const rel = (i - active + count) % count;
    if (rel === 0) return "center";
    if (rel === 1) return "right";
    if (rel === count - 1) return "left";
    return "hidden";
  };

  const variants: Record<string, object> = {
    center: {
      x: 0, y: 0,
      scale: 1,
      rotateY: 0,
      opacity: 1,
      zIndex: 30,
      filter: "brightness(1)",
      boxShadow: "0 40px 100px -24px rgba(15,23,42,0.32), 0 0 0 1px rgba(15,23,42,0.05)",
    },
    left: {
      x: -CARD_W * 0.56, y: 28,
      scale: 0.83,
      rotateY: 18,
      opacity: 0.72,
      zIndex: 15,
      filter: "brightness(0.88)",
      boxShadow: "0 20px 50px -16px rgba(15,23,42,0.18)",
    },
    right: {
      x: CARD_W * 0.56, y: 28,
      scale: 0.83,
      rotateY: -18,
      opacity: 0.72,
      zIndex: 15,
      filter: "brightness(0.88)",
      boxShadow: "0 20px 50px -16px rgba(15,23,42,0.18)",
    },
    hidden: {
      x: 0, y: 0,
      scale: 0.7,
      rotateY: 0,
      opacity: 0,
      zIndex: 0,
      filter: "brightness(1)",
      boxShadow: "none",
    },
  };

  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            <Star size={13} className="fill-current text-amber-500" />
            What Our Clients Say
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
          >
            Loved by{" "}
            <span className="gradient-text-brand">50+ businesses</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            Real words from the trades and service businesses we&apos;ve helped grow across the UK.
          </motion.p>
        </div>

        {/* Stacked carousel */}
        <div
          className="relative mx-auto flex items-center justify-center"
          style={{ height: CARD_H + 60, perspective: "1400px" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {TESTIMONIALS.map((t, i) => {
            const pos = getPos(i);
            const isLeft = pos === "left";
            const isRight = pos === "right";

            return (
              <motion.div
                key={i}
                className="absolute cursor-pointer"
                style={{ width: CARD_W, height: CARD_H, transformStyle: "preserve-3d" }}
                animate={variants[pos]}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                onClick={() => {
                  if (isLeft) prev();
                  else if (isRight) next();
                }}
              >
                <ReviewCard t={t} />
              </motion.div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="mt-10 flex items-center justify-center gap-5">
          <button
            onClick={prev}
            aria-label="Previous review"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 hover:shadow-lg"
          >
            <ChevronLeft className="h-5 w-5 text-slate-700" />
          </button>

          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === active
                    ? "h-2.5 w-7 bg-blue-600"
                    : "h-2.5 w-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Next review"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 hover:shadow-lg"
          >
            <ChevronRight className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        {/* Global rating */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3 mt-10"
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-700">5.0</span>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-500">50+ clients across the UK</span>
        </motion.div>
      </div>
    </section>
  );
}
