"use client";

// ─── Why Choose Riden ─────────────────────────────────────────────────────────
// Floating cards, staggered for depth. Six reasons to choose Riden.

import { motion } from "framer-motion";
import {
  Flag,
  ShieldCheck,
  Search,
  Zap,
  Smartphone,
  BadgePoundSterling,
} from "lucide-react";

const reasons = [
  {
    icon: Flag,
    title: "UK Support",
    desc: "A friendly UK team and one point of contact. No offshore call centres, no ticket queues.",
    tone: "from-blue-600 to-cyan-500",
  },
  {
    icon: ShieldCheck,
    title: "Ongoing Maintenance",
    desc: "Hosting, security, backups and updates handled for you, every single month.",
    tone: "from-cyan-500 to-teal-500",
  },
  {
    icon: Search,
    title: "SEO Focused",
    desc: "Built from day one to be found on Google for what you do, where you do it.",
    tone: "from-indigo-500 to-blue-500",
  },
  {
    icon: Zap,
    title: "Fast Turnaround",
    desc: "See a preview in days, not months. Changes are usually live the same day.",
    tone: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    desc: "Every site looks and works beautifully on phones, where most customers find you.",
    tone: "from-sky-500 to-blue-600",
  },
  {
    icon: BadgePoundSterling,
    title: "Transparent Pricing",
    desc: "One simple plan, clear monthly cost, no hidden fees and no long-term contracts.",
    tone: "from-emerald-500 to-teal-500",
  },
];

export default function WhyChooseRiden() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f6faff] to-white py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-700 ring-1 ring-blue-100">
            Why Choose Riden
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]">
            A web partner that{" "}
            <span className="gradient-text-brand">keeps working for you</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            We don’t just build a website and disappear. We look after it, improve it and keep it
            bringing in enquiries.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className={`glass-panel rounded-3xl p-6 sm:p-7 ${
                  i % 3 === 1 ? "lg:translate-y-6" : ""
                }`}
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${r.tone} text-white shadow-lg shadow-blue-600/20`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
