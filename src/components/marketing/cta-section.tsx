"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#03040a]" />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,100vw)] h-[350px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,80vw)] h-[250px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.10) 0%, transparent 70%)", filter: "blur(30px)" }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-500 mb-4"
        >
          Ready to get started?
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-5 sm:mb-6 leading-tight tracking-tight"
        >
          Let&apos;s build something{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa, #38bdf8)" }}>
            your clients will love.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Book a free call with our team. We&apos;ll listen to your business, talk through
          what you need, and give you an honest recommendation — no pressure, no jargon.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12"
        >
          <Link href="/contact" className="w-full sm:w-auto">
            <Button size="xl" className="group w-full sm:w-auto px-10 gap-3"
              style={{ background: "linear-gradient(135deg, #3b82f6, #7c3aed)" }}>
              <PhoneCall size={17} />
              Book a Free Call
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button variant="outline" size="xl" className="w-full sm:w-auto px-10">
              See Pricing
            </Button>
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
        >
          {["No long-term contracts", "UK-based support", "No hidden fees", "Live in 7–14 days"].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
