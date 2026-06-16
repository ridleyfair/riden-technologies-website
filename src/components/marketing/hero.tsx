"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Paintbrush, Search, Server, Wrench, Star } from "lucide-react";

import { AiBackdrop } from "@/components/marketing/visuals/ai-backdrop";
import { BrowserMock, MiniSite, type SiteTheme } from "@/components/marketing/visuals/device-mocks";
import { EnquiryCard, SeoCard, MaintenanceCard } from "@/components/marketing/visuals/floating-cards";

const SHOWCASE_THEME: SiteTheme = {
  name: "Harper Plumbing",
  tagline: "Local plumbing & heating you can rely on.",
  accent: "#2563eb",
  accent2: "#06b6d4",
  services: ["Boilers & Heating", "Bathrooms", "Emergency Call-Out"],
  cta: "Get a Quote",
};

const trustBadges = [
  { icon: Paintbrush, label: "Website Design" },
  { icon: Search, label: "SEO Ready" },
  { icon: Server, label: "Hosting Included" },
  { icon: Wrench, label: "Maintenance Included" },
];

const float = (delay: number, distance = 14) => ({
  animate: { y: [0, -distance, 0] },
  transition: { duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay },
});

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-16 sm:pt-36 sm:pb-24">
      <AiBackdrop name="aurora" opacity={0.45} className="-z-0" />
      <div className="pointer-events-none absolute inset-0 grid-pattern-light opacity-[0.5]" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* ── Left: copy ─────────────────────────────────────────────── */}
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-700 ring-1 ring-blue-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            UK web design &amp; website maintenance agency
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            Professional Websites{" "}
            <span className="gradient-text-brand">Built &amp; Managed</span> For Local Businesses
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            We design, build, host and maintain websites that help businesses look professional
            online and generate more enquiries.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
            >
              Get My Website Preview
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#examples"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:ring-slate-300"
            >
              View Examples
            </Link>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="mt-8 flex items-center gap-4"
          >
            <div className="flex -space-x-2.5">
              {[
                { initials: "MC", from: "from-blue-500", to: "to-cyan-500" },
                { initials: "DT", from: "from-amber-400", to: "to-orange-500" },
                { initials: "SB", from: "from-violet-500", to: "to-purple-500" },
                { initials: "JR", from: "from-emerald-500", to: "to-teal-500" },
              ].map(({ initials, from, to }) => (
                <div
                  key={initials}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${from} ${to} text-[9px] font-bold text-white`}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                Trusted by <span className="font-semibold text-slate-900">50+ UK businesses</span>
              </p>
            </div>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-9 grid max-w-lg grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 sm:gap-x-4"
          >
            {trustBadges.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 sm:flex-col sm:gap-1.5 sm:text-center"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* ── Right: coded website showcase ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
          aria-label="Example of a website Riden Technologies builds for a local business"
        >
          {/* glow */}
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-blue-200/40 via-cyan-100/30 to-transparent blur-2xl" />

          <motion.div {...float(0.2, 12)} className="will-change-transform">
            <BrowserMock url="www.harperplumbing.co.uk">
              <MiniSite theme={SHOWCASE_THEME} />
            </BrowserMock>
          </motion.div>

          {/* floating proof cards */}
          <motion.div {...float(0.6, 16)} className="absolute -left-4 top-16 w-44 sm:-left-10">
            <EnquiryCard />
          </motion.div>
          <motion.div {...float(1.1, 18)} className="absolute -right-3 top-1/2 w-48 sm:-right-12">
            <SeoCard />
          </motion.div>
          <motion.div {...float(0.4, 14)} className="absolute -bottom-5 left-1/2 w-48 -translate-x-1/2">
            <MaintenanceCard />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
