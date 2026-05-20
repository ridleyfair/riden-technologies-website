"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-riden-dark" />

      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(800px,100vw)] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,90vw)] h-[300px] rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass border border-blue-500/20 text-xs sm:text-sm text-blue-300 mb-6 sm:mb-8"
        >
          <Sparkles size={14} />
          <span>Ready to Transform Your Business?</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-5 sm:mb-6 leading-tight"
        >
          Start Building Your{" "}
          <span className="gradient-text">Digital Empire</span> Today
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-slate-400 mb-8 sm:mb-10 max-w-2xl mx-auto"
        >
          Book a free strategy call with our team. We&apos;ll analyze your business,
          identify growth opportunities, and show you exactly how we can help.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link href="/contact" className="w-full sm:w-auto">
            <Button variant="gradient" size="xl" className="group w-full sm:w-auto px-6 sm:px-10">
              <Calendar size={18} />
              Book a Free Strategy Call
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/solutions" className="w-full sm:w-auto">
            <Button variant="outline" size="xl" className="w-full sm:w-auto px-6 sm:px-10">
              Explore Solutions
            </Button>
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="hidden"
        >
        </motion.div>
      </div>
    </section>
  );
}
