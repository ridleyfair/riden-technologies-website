"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["stand out.", "win clients.", "grow faster.", "look premium.", "convert more."],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

      {/* ── Background video ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="/videos/hf_20260608_210731_238b7e75-725e-4314-9f33-bf6e2ad30976.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(3,4,10,0.65) 0%, rgba(3,4,10,0.5) 50%, rgba(3,4,10,0.85) 100%)", zIndex: 1 }} />

      {/* Subtle vignette around edges */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(3,4,10,0.6) 100%)", zIndex: 1 }} />

      {/* ── Content ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-20" style={{ zIndex: 2 }}>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs sm:text-sm text-slate-300 mb-8 backdrop-blur-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Premium Web Agency — UK Based
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-bold text-white tracking-tight mb-4"
          style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)", lineHeight: 1.08 }}
        >
          Websites that help your business
          <br />
          <span className="relative block w-full text-center"
            style={{ height: "1.15em", overflowY: "clip" }}>
            {titles.map((title, index) => (
              <motion.span
                key={index}
                className="absolute w-full text-center font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #38bdf8 100%)",
                  left: 0,
                  top: 0,
                }}
                initial={{ opacity: 0, y: -60 }}
                transition={{ type: "spring", stiffness: 60, damping: 14 }}
                animate={
                  titleNumber === index
                    ? { y: 0, opacity: 1 }
                    : { y: titleNumber > index ? -60 : 60, opacity: 0 }
                }
              >
                {title}
              </motion.span>
            ))}
            <span className="invisible font-bold">look premium.</span>
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed mb-10"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
        >
          We design and build bespoke websites, automation systems, and CRM
          platforms for businesses that want to stand out and{" "}
          <span className="text-white font-semibold">grow faster</span>.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-16"
        >
          <Link href="/contact">
            <Button size="xl" className="gap-3 px-10 backdrop-blur-sm"
              style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)", boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>
              <PhoneCall size={17} />
              Book a Free Call
              <MoveRight size={17} />
            </Button>
          </Link>
          <Link href="/solutions">
            <Button variant="outline" size="xl" className="px-10 backdrop-blur-sm border-white/20 text-white hover:bg-white/10">
              See Our Work
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden w-full max-w-2xl"
          style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {[
            { value: "7–14", label: "Day Build Time" },
            { value: "£0", label: "Hidden Fees" },
            { value: "UK", label: "Based & Supported" },
            { value: "Free", label: "CRM Included" },
          ].map((stat, i) => (
            <div key={i} className="py-5 px-4 text-center" style={{ background: "rgba(3,4,10,0.4)" }}>
              <div className="text-xl sm:text-2xl font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to top, #03040a, transparent)", zIndex: 2 }} />
    </section>
  );
}

export { Hero };
