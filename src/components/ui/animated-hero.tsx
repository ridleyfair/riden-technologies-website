"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Layout,
  ShieldCheck,
  Search,
  TrendingUp,
  MapPin,
  Star,
} from "lucide-react";
import Link from "next/link";

// ─── Mini website thumbnails for the scrolling hero visual ────────────────────

type MiniSite = {
  label: string;
  accent: "blue" | "violet" | "cyan" | "emerald" | "amber";
};

const ACCENTS: Record<MiniSite["accent"], { bar: string; chip: string; block: string; text: string }> = {
  blue: { bar: "bg-blue-500", chip: "bg-blue-100", block: "bg-blue-100", text: "text-blue-600" },
  violet: { bar: "bg-violet-500", chip: "bg-violet-100", block: "bg-violet-100", text: "text-violet-600" },
  cyan: { bar: "bg-cyan-500", chip: "bg-cyan-100", block: "bg-cyan-100", text: "text-cyan-600" },
  emerald: { bar: "bg-emerald-500", chip: "bg-emerald-100", block: "bg-emerald-100", text: "text-emerald-600" },
  amber: { bar: "bg-amber-500", chip: "bg-amber-100", block: "bg-amber-100", text: "text-amber-600" },
};

const SITES: MiniSite[] = [
  { label: "Carpentry", accent: "amber" },
  { label: "Plumbing", accent: "blue" },
  { label: "Beauty Studio", accent: "violet" },
  { label: "Electrician", accent: "cyan" },
  { label: "Landscaping", accent: "emerald" },
];

function MiniSite({ site }: { site: MiniSite }) {
  const a = ACCENTS[site.accent];
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200/90 shadow-[0_6px_20px_-12px_rgba(15,23,42,0.18)] overflow-hidden">
      {/* mini browser bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-100">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className={`ml-2 text-[9px] font-medium ${a.text}`}>{site.label}</span>
      </div>
      {/* mini hero */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className={`h-2 w-12 rounded-full ${a.bar}`} />
          <div className="flex gap-1">
            <div className="h-1.5 w-5 rounded-full bg-slate-200" />
            <div className="h-1.5 w-5 rounded-full bg-slate-200" />
            <div className={`h-1.5 w-8 rounded-full ${a.chip}`} />
          </div>
        </div>
        <div className="h-1.5 w-3/4 rounded-full bg-slate-200 mb-1.5" />
        <div className="h-1.5 w-1/2 rounded-full bg-slate-200 mb-3" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className={`h-9 rounded-md ${a.block}`} />
          <div className="h-9 rounded-md bg-slate-100" />
          <div className={`h-9 rounded-md ${a.block}`} />
        </div>
      </div>
    </div>
  );
}

function FloatingCard({
  className,
  icon: Icon,
  iconClass,
  title,
  value,
  delay,
}: {
  className: string;
  icon: React.ElementType;
  iconClass: string;
  title: string;
  value: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={
        reduce
          ? { opacity: 1, scale: 1, y: 0 }
          : { opacity: 1, scale: 1, y: [0, -8, 0] }
      }
      transition={
        reduce
          ? { duration: 0.5, delay }
          : { opacity: { duration: 0.5, delay }, scale: { duration: 0.5, delay }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay } }
      }
      className={`absolute z-20 flex items-center gap-2.5 rounded-xl bg-white/95 backdrop-blur ring-1 ring-slate-200 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)] px-3.5 py-2.5 ${className}`}
    >
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <div className="text-[10px] font-medium text-slate-500">{title}</div>
        <div className="text-xs font-bold text-slate-900">{value}</div>
      </div>
    </motion.div>
  );
}

function HeroVisual() {
  const reduce = useReducedMotion();
  const loop = [...SITES, ...SITES];

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* glow backdrop */}
      <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-200/40 via-cyan-100/30 to-transparent blur-2xl" />

      {/* main browser frame */}
      <div className="relative rounded-[1.75rem] bg-white ring-1 ring-slate-200 shadow-[0_40px_80px_-32px_rgba(15,23,42,0.35)] overflow-hidden">
        {/* browser top bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="ml-3 flex-1 flex items-center gap-2 rounded-full bg-white ring-1 ring-slate-200 px-3 py-1">
            <MapPin className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] text-slate-400">yourbusiness.co.uk</span>
          </div>
        </div>

        {/* scrolling column of mini sites */}
        <div className="relative h-[420px] bg-gradient-to-b from-slate-50 to-white px-5">
          {/* fade masks */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent z-10" />

          <motion.div
            className="flex flex-col gap-4 pt-5"
            animate={reduce ? undefined : { y: ["0%", "-50%"] }}
            transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "linear" }}
          >
            {loop.map((site, i) => (
              <MiniSite key={i} site={site} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* floating proof cards */}
      <FloatingCard
        className="-left-4 sm:-left-8 top-20"
        icon={TrendingUp}
        iconClass="bg-emerald-100 text-emerald-600"
        title="New enquiries"
        value="More every week"
        delay={0.6}
      />
      <FloatingCard
        className="-right-3 sm:-right-6 top-40"
        icon={ShieldCheck}
        iconClass="bg-blue-100 text-blue-600"
        title="Hosting & updates"
        value="Handled for you"
        delay={0.9}
      />
      <FloatingCard
        className="-left-2 sm:-left-6 bottom-16"
        icon={Search}
        iconClass="bg-cyan-100 text-cyan-600"
        title="Local SEO"
        value="Found on Google"
        delay={1.2}
      />
    </div>
  );
}

// ─── Main hero ────────────────────────────────────────────────────────────────

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
});

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* soft background washes */}
      <div className="pointer-events-none absolute inset-0 grid-pattern-light opacity-60" />
      <div className="pointer-events-none absolute -top-32 -right-24 h-[32rem] w-[32rem] rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-24 h-96 w-96 rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20 lg:pt-36 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Left — copy */}
          <div className="text-center lg:text-left">
            <motion.div
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold ring-1 ring-blue-100"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              UK web design &amp; website maintenance agency
            </motion.div>

            <motion.h1
              {...fadeUp(0.08)}
              className="mt-6 font-bold tracking-tight text-slate-900"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.9rem)", lineHeight: 1.08 }}
            >
              Professional Websites{" "}
              <span className="gradient-text-brand">Built &amp; Managed</span> For Local
              Businesses
            </motion.h1>

            <motion.p
              {...fadeUp(0.16)}
              className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              We design, build, host and maintain websites for UK trades, beauty businesses and
              local service companies — helping you look professional online and{" "}
              <span className="font-semibold text-slate-900">win more enquiries</span>.
            </motion.p>

            <motion.div
              {...fadeUp(0.24)}
              className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
            >
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Get My Website Preview
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/#examples"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm sm:text-base font-semibold text-slate-700 ring-1 ring-slate-300 transition-all hover:bg-slate-50 hover:ring-slate-400"
              >
                <Layout size={17} className="text-blue-600" />
                View Website Examples
              </Link>
            </motion.div>

            {/* trust badges */}
            <motion.div
              {...fadeUp(0.32)}
              className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto lg:mx-0"
            >
              {[
                { icon: Star, label: "Designed for you", sub: "Not a template" },
                { icon: ShieldCheck, label: "Fully managed", sub: "Start to finish" },
                { icon: MapPin, label: "UK based", sub: "Real support" },
                { icon: TrendingUp, label: "Live in days", sub: "Not months" },
              ].map((b) => (
                <div
                  key={b.label}
                  className="flex flex-col items-center lg:items-start gap-1.5 rounded-xl bg-white/70 ring-1 ring-slate-200 px-3 py-3"
                >
                  <b.icon className="h-4 w-4 text-blue-600" />
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{b.label}</div>
                  <div className="text-[11px] text-slate-500 leading-tight">{b.sub}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — animated visual */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:pl-6"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export { Hero };
