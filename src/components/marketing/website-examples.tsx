"use client";

// ─── Website Examples — Stacked Card Carousel ────────────────────────────────
// Add entries to `portfolioItems` as new sites go live.
// Placeholder entries (comingSoon:true) show a brand-gradient card automatically.

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight, MapPin } from "lucide-react";

interface PortfolioItem {
  businessName: string;
  industry: string;
  location: string;
  url: string;
  image?: string;
  tags?: string[];
  comingSoon?: true;
}

// ─── Add new live sites here ──────────────────────────────────────────────────
const portfolioItems: PortfolioItem[] = [
  {
    businessName: "BEGU Carpentry Ltd",
    industry: "Carpentry & Joinery",
    location: "Chigwell / London",
    url: "https://begucarpentry.com",
    image: "/images/portfolio/begu.jpg",
    tags: ["Bespoke carpentry", "Quote focused"],
  },
  {
    businessName: "Hartley Home Renovations",
    industry: "Kitchens & Bathrooms",
    location: "Birmingham",
    url: "https://hartleyhomerenovations.uk",
    image: "/images/portfolio/hartley.jpg",
    tags: ["Kitchen renovations", "Bathroom fitting"],
  },
  {
    businessName: "Elmcroft Landscapes",
    industry: "Landscaping & Garden Design",
    location: "Surrey",
    url: "https://elmcroftlandscapes.uk",
    image: "/images/portfolio/elmcroft.jpg",
    tags: ["Garden design", "Outdoor transformations"],
  },
];

const CARD_W = 520;
const CARD_H = 400;
const CARD_RATIO = CARD_H / CARD_W;

function PortfolioCard({ item, isCenter }: { item: PortfolioItem; isCenter: boolean }) {
  if (item.comingSoon) {
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[1.75rem] select-none"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #0891b2 100%)" }}
      >
        {/* Subtle noise/texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "200px" }}
        />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/5 blur-xl" />
        <div className="relative text-center px-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-white" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Coming Soon</p>
          <p className="mt-2 text-xl font-bold text-white">New site launching soon</p>
          <p className="mt-2 text-sm text-white/60">Another client website on its way.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] bg-white select-none">
      {/* Screenshot */}
      <div className="relative flex-1 overflow-hidden bg-slate-100">
        {item.image && (
          <Image
            src={item.image}
            alt={`${item.businessName} website`}
            fill
            sizes="(max-width: 640px) calc(100vw - 32px), 520px"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
            priority
          />
        )}
        {/* Live badge */}
        <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow">
          Live site
        </span>
      </div>

      {/* Info strip */}
      <div className="flex flex-shrink-0 items-center justify-between bg-white px-6 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
            {item.industry}
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-900">{item.businessName}</p>
          {item.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" /> {item.location}
            </p>
          )}
        </div>
        {item.url && item.url !== "#" && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:-translate-y-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            View <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function WebsiteExamples() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cardW, setCardW] = useState(CARD_W);
  const count = portfolioItems.length;
  const isMobile = cardW < CARD_W;
  const cardH = Math.round(cardW * CARD_RATIO);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCardW(w < 640 ? Math.round(w * 0.78) : CARD_W);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const prev = useCallback(() => setActive((a) => (a - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((a) => (a + 1) % count), [count]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [paused, next]);

  // Returns { variant, clickable } for each card index
  const getPos = (i: number) => {
    const rel = ((i - active + count) % count);
    if (rel === 0) return "center";
    if (rel === 1) return "right";
    if (rel === count - 1) return "left";
    return "hidden";
  };

  const variants: Record<string, object> = {
    center: {
      x: 0, y: 0,
      scale: 1,
      rotateY: 0,
      opacity: 1,
      zIndex: 30,
      filter: "brightness(1)",
      boxShadow: "0 40px 100px -24px rgba(15,23,42,0.38), 0 0 0 1px rgba(15,23,42,0.06)",
    },
    left: {
      x: -cardW * 0.56, y: isMobile ? 16 : 28,
      scale: isMobile ? 0.88 : 0.83,
      rotateY: isMobile ? 10 : 18,
      opacity: 0.78,
      zIndex: 15,
      filter: "brightness(0.88)",
      boxShadow: "0 20px 50px -16px rgba(15,23,42,0.22)",
    },
    right: {
      x: cardW * 0.56, y: isMobile ? 16 : 28,
      scale: isMobile ? 0.88 : 0.83,
      rotateY: isMobile ? -10 : -18,
      opacity: 0.78,
      zIndex: 15,
      filter: "brightness(0.88)",
      boxShadow: "0 20px 50px -16px rgba(15,23,42,0.22)",
    },
    hidden: {
      x: 0, y: 0,
      scale: 0.7,
      rotateY: 0,
      opacity: 0,
      zIndex: 0,
      filter: "brightness(1)",
      boxShadow: "none",
    },
  };

  return (
    <section
      id="examples"
      className="relative overflow-hidden bg-[#f6faff] py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-700 ring-1 ring-blue-100">
            Our Work
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]">
            Real websites.{" "}
            <span className="gradient-text-brand">Real results.</span>
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Live client websites built and managed by Riden, designed to look
            professional and generate more enquiries.
          </p>
        </div>

        {/* Stacked card carousel */}
        <div
          className="relative mx-auto mt-16 flex items-center justify-center"
          style={{ height: cardH + 60, perspective: "1400px" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {portfolioItems.map((item, i) => {
            const pos = getPos(i);
            const isCenter = pos === "center";
            const isLeft = pos === "left";
            const isRight = pos === "right";

            return (
              <motion.div
                key={i}
                className="absolute cursor-pointer"
                style={{ width: cardW, height: cardH, transformStyle: "preserve-3d" }}
                animate={variants[pos]}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                onClick={() => {
                  if (isLeft) prev();
                  else if (isRight) next();
                }}
              >
                <PortfolioCard item={item} isCenter={isCenter} />
              </motion.div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="mt-10 flex items-center justify-center gap-5">
          <button
            onClick={prev}
            aria-label="Previous website"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 hover:shadow-lg"
          >
            <ChevronLeft className="h-5 w-5 text-slate-700" />
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {portfolioItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === active
                    ? "h-2.5 w-7 bg-blue-600"
                    : "h-2.5 w-2.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Next website"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 hover:shadow-lg"
          >
            <ChevronRight className="h-5 w-5 text-slate-700" />
          </button>
        </div>
      </div>
    </section>
  );
}
