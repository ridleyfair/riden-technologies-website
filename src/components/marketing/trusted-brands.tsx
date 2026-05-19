"use client";

import React from "react";
import { motion } from "framer-motion";

const brands = [
  "Acme Corp",
  "TechVenture",
  "Nexus Group",
  "CloudScale",
  "InnovateCo",
  "DataBridge",
  "ApexMedia",
  "FutureLabs",
];

export default function TrustedBrands() {
  return (
    <section className="relative py-16 overflow-hidden border-y border-riden-border">
      <div className="absolute inset-0 bg-riden-surface/50" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-slate-500 uppercase tracking-widest mb-8"
        >
          Trusted by innovative businesses worldwide
        </motion.p>

        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-riden-surface/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-riden-surface/80 to-transparent z-10 pointer-events-none" />

          <div className="flex items-center gap-12 overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-12 flex-shrink-0"
            >
              {[...brands, ...brands].map((brand, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 px-6 py-3 rounded-xl bg-riden-muted border border-riden-border text-slate-400 text-sm font-medium whitespace-nowrap hover:text-white hover:border-white/20 transition-colors duration-200"
                >
                  {brand}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
