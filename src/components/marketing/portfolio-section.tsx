"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight, MapPin, Layout, MonitorSmartphone, ArrowUpRight } from "lucide-react";
import { PORTFOLIO_ITEMS, type PortfolioItem } from "@/lib/portfolio";
import { ScaledFrame } from "@/components/marketing/visuals/device-mocks";

const accentMap: Record<
  PortfolioItem["accent"],
  { tile: string; chip: string; ring: string; text: string }
> = {
  blue: {
    tile: "from-blue-50 via-sky-50 to-white",
    chip: "from-blue-50 to-sky-50",
    ring: "ring-blue-100",
    text: "text-blue-600",
  },
  violet: {
    tile: "from-violet-50 via-fuchsia-50 to-white",
    chip: "from-violet-50 to-fuchsia-50",
    ring: "ring-violet-100",
    text: "text-violet-600",
  },
  cyan: {
    tile: "from-cyan-50 via-sky-50 to-white",
    chip: "from-cyan-50 to-sky-50",
    ring: "ring-cyan-100",
    text: "text-cyan-600",
  },
  emerald: {
    tile: "from-emerald-50 via-teal-50 to-white",
    chip: "from-emerald-50 to-teal-50",
    ring: "ring-emerald-100",
    text: "text-emerald-600",
  },
  amber: {
    tile: "from-amber-50 via-orange-50 to-white",
    chip: "from-amber-50 to-orange-50",
    ring: "ring-amber-100",
    text: "text-amber-600",
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

function PreviewTile({ item }: { item: PortfolioItem }) {
  const accent = accentMap[item.accent];

  // Live iframe preview for sites with a URL — scaled to fill the 16:10 card
  if (item.url) {
    return (
      <ScaledFrame width={1440} className="absolute inset-0">
        <iframe
          src={item.url}
          scrolling="no"
          tabIndex={-1}
          title={`${item.name} website preview`}
          style={{
            width: "1440px",
            height: "900px",
            border: "none",
            pointerEvents: "none",
            display: "block",
          }}
        />
      </ScaledFrame>
    );
  }

  if (item.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.image}
        alt={`${item.name} website screenshot`}
        className="w-full h-full object-cover object-top"
      />
    );
  }

  // Branded placeholder — a crisp light "browser window" mockup, never a broken image.
  return (
    <div className={`w-full h-full flex flex-col bg-gradient-to-br ${accent.tile}`}>
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white/70 border-b border-slate-200">
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        <span className="ml-2 text-[10px] text-slate-400 truncate">
          your-business.co.uk
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <MonitorSmartphone size={26} className={accent.text} />
        <span className="text-slate-900 font-bold text-lg leading-tight">{item.name}</span>
        <span className="text-[11px] text-slate-500">{item.industry}</span>
      </div>
    </div>
  );
}

function PortfolioCard({ item, index }: { item: PortfolioItem; index: number }) {
  const accent = accentMap[item.accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: (index % 3) * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-2xl card-light overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-200">
        <PreviewTile item={item} />
        {item.url && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-[10px] font-semibold text-white flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-slate-900 mb-2">{item.name}</h3>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-br ${accent.chip} ring-1 ${accent.ring} text-[11px] font-medium ${accent.text}`}
          >
            <Layout size={11} /> {item.industry}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin size={11} /> {item.location}
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-1">{item.blurb}</p>

        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-all hover:bg-slate-50 hover:ring-slate-400"
          >
            View Website <ExternalLink size={14} />
          </a>
        ) : (
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-all hover:bg-slate-50 hover:ring-slate-400"
          >
            Get a site like this <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default function PortfolioSection() {
  return (
    <section id="examples" className="relative py-20 sm:py-28 bg-white overflow-hidden scroll-mt-24">
      {/* soft brand wash */}
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.span
            {...fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            <Layout size={14} /> Our Work
          </motion.span>

          <motion.h2
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
          >
            Websites we&apos;ve{" "}
            <span className="gradient-text-brand">built</span>
          </motion.h2>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            Real websites for real local businesses. Here&apos;s a taste of the sites we
            design, build and manage for trades and service companies across the UK.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {PORTFOLIO_ITEMS.map((item, i) => (
            <PortfolioCard key={item.name} item={item} index={i} />
          ))}
        </div>

        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
          >
            Get My Website Preview
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
