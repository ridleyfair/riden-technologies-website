"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Settings2,
  Target,
  Smartphone,
  Search,
  Gauge,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const points = [
  {
    icon: ShieldCheck,
    title: "No technical stress",
    desc: "No code, no jargon, no headaches. You run your business. We handle the website side completely.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Settings2,
    title: "We manage everything",
    desc: "Design, build, hosting, updates and support are all done for you. One simple plan, no extra suppliers.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Target,
    title: "Built around your business",
    desc: "Your website is designed for your trade, your customers and your area, not a generic template.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Smartphone,
    title: "Mobile friendly",
    desc: "Most local customers search on their phone. Your site looks sharp and loads fast on every device.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Search,
    title: "SEO ready",
    desc: "Set up to be found on Google for the services you offer in the places you work.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Gauge,
    title: "Fast, reliable hosting",
    desc: "Secure managed hosting with an SSL certificate included. Your site stays online and loads fast.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: RefreshCw,
    title: "Ongoing updates",
    desc: "New photos, prices or services? Send them over and we make the changes, usually the same day.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
];

export default function ValueProposition() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-riden-dark" />
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/20 text-sm text-blue-300 mb-6"
          >
            <Sparkles size={14} />
            <span>Why Riden</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            A professional website,{" "}
            <span className="gradient-text">without the hassle</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            We take care of the whole thing so you can focus on the work you do best.
            Here&apos;s what you get when you work with us.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {points.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="glass-card rounded-2xl p-5 sm:p-6 border border-riden-border hover:border-white/10 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl ${p.bg} flex items-center justify-center mb-4`}>
                <p.icon size={20} className={p.color} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
