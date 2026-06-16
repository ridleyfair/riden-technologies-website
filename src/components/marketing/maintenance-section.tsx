"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ImagePlus,
  FileText,
  Server,
  Globe,
  Wrench,
  Lock,
  Headphones,
  Check,
  ArrowRight,
} from "lucide-react";

const items = [
  { icon: ImagePlus, title: "New photos added", desc: "Send us your latest work and we'll add it to your gallery." },
  { icon: FileText, title: "Content updates", desc: "New services, prices or wording changed for you, usually same day." },
  { icon: Server, title: "Hosting handled", desc: "Fast, secure hosting included. Nothing to set up or pay separately." },
  { icon: Globe, title: "Domain managed", desc: "We connect and look after your domain and email forwarding." },
  { icon: Wrench, title: "Technical fixes", desc: "Anything that breaks, we fix it. You'll often never even notice." },
  { icon: Lock, title: "Security & backups", desc: "SSL, updates and backups kept current so your site stays safe." },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function MaintenanceSection() {
  return (
    <section id="maintenance" className="relative py-20 sm:py-28 bg-slate-50 overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <motion.span
              {...fadeUp}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
            >
              Fully Managed
            </motion.span>
            <motion.h2
              {...fadeUp}
              transition={{ delay: 0.05 }}
              className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
            >
              You never have to{" "}
              <span className="gradient-text-brand">manage it yourself</span>
            </motion.h2>
            <motion.p
              {...fadeUp}
              transition={{ delay: 0.1 }}
              className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
            >
              No logins, no software, no technical headaches. Your website is completely looked
              after by our UK team. Just run your business and send us changes whenever you
              need them.
            </motion.p>

            <motion.ul {...fadeUp} transition={{ delay: 0.15 }} className="mt-7 space-y-3">
              {["Ongoing support whenever you need it", "Changes made for you, usually the same day", "One simple monthly plan, no surprise bills"].map(
                (point) => (
                  <li key={point} className="flex items-center gap-3 text-sm sm:text-base text-slate-700">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </span>
                    {point}
                  </li>
                )
              )}
            </motion.ul>

            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Get My Website Preview
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>

          {/* Right — cards grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: (i % 2) * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl card-light p-5"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 ring-1 ring-blue-100">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.16, duration: 0.5 }}
              className="sm:col-span-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5 flex items-center gap-3 shadow-lg shadow-blue-600/20"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Headphones className="h-5 w-5 text-white" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">Ongoing support, included</h3>
                <p className="text-sm text-blue-50/90 leading-relaxed">
                  A real UK team on hand whenever you need a hand or a change.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
