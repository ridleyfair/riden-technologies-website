"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Layout } from "lucide-react";
import {
  FRAME_COUNT as DEFAULT_FRAME_COUNT,
  FRAME_WIDTH as DEFAULT_W,
  FRAME_HEIGHT as DEFAULT_H,
  FALLBACK_SRC as DEFAULT_FALLBACK,
  MOBILE_FRAME_STRIDE,
  frameSrc as defaultFrameSrc,
} from "@/lib/hero-sequence";

// ─── Types ────────────────────────────────────────────────────────────────────

type Cta = { label: string; href: string };
type Badge = { label: string; icon?: React.ElementType };

export interface ScrollImageSequenceHeroProps {
  eyebrow?: string;
  headline: React.ReactNode;
  subheadline: React.ReactNode;
  primaryCta: Cta;
  secondaryCta?: Cta;
  badges?: Badge[];
  /** Frame sequence config — defaults to the Riden hero sequence in /lib/hero-sequence. */
  frameCount?: number;
  frameSrc?: (i: number) => string;
  frameWidth?: number;
  frameHeight?: number;
  fallbackSrc?: string;
  /** Vertical scroll distance (px) allocated per frame. Higher = slower scrub. */
  pxPerFrame?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ScrollImageSequenceHero({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  badges = [],
  frameCount = DEFAULT_FRAME_COUNT,
  frameSrc = defaultFrameSrc,
  frameWidth = DEFAULT_W,
  frameHeight = DEFAULT_H,
  fallbackSrc = DEFAULT_FALLBACK,
  pxPerFrame = 16,
}: ScrollImageSequenceHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Frame cache (1-indexed). images[i] is set once that frame has decoded.
  const imagesRef = useRef<(HTMLImageElement | undefined)[]>([]);
  const requestedRef = useRef<boolean[]>([]);
  const lastDrawnRef = useRef<number>(-1);
  const targetRef = useRef<number>(1);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef<boolean>(false);
  const strideRef = useRef<number>(1);

  // `enhanced` gates the scroll-driven canvas. Off during SSR + first paint and
  // for reduced-motion users, so the page renders a stable static hero (no CLS,
  // no hydration mismatch). Switched on after mount when animation is allowed.
  const [enhanced, setEnhanced] = useState(false);
  // true once we've decided NOT to scroll-drive (reduced motion) → show finished-site poster
  const [staticFallback, setStaticFallback] = useState(false);
  const hasFrames = frameCount > 0;

  // ── Draw the nearest already-decoded frame to `target` ──────────────────────
  const draw = useCallback(
    (target: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const images = imagesRef.current;
      // find nearest loaded frame so we always show *something* crisp
      let pick = -1;
      for (let d = 0; d < frameCount; d++) {
        if (images[target + d]) { pick = target + d; break; }
        if (images[target - d]) { pick = target - d; break; }
      }
      if (pick < 0 || pick === lastDrawnRef.current) return;
      const img = images[pick];
      if (!img) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      lastDrawnRef.current = pick;
    },
    [frameCount]
  );

  // ── Request a single frame (deduped); redraw if it's the current target ─────
  const ensure = useCallback(
    (i: number) => {
      if (i < 1 || i > frameCount) return;
      const requested = requestedRef.current;
      if (requested[i]) return;
      requested[i] = true;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        imagesRef.current[i] = img;
        if (Math.abs(i - targetRef.current) <= strideRef.current) draw(targetRef.current);
      };
      img.src = frameSrc(i);
    },
    [frameCount, frameSrc, draw]
  );

  // ── Map scroll position of the section to a frame index ─────────────────────
  const computeTarget = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return 1;
    const rect = section.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
    return 1 + Math.round(progress * (frameCount - 1));
  }, [frameCount]);

  // ── Main effect: enable enhancement, preload, scroll loop ───────────────────
  useEffect(() => {
    if (!hasFrames) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStaticFallback(true); // show finished-site poster, no pin / no scrub
      return;
    }

    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    strideRef.current = isMobile ? MOBILE_FRAME_STRIDE : 1;
    setEnhanced(true);

    // Eager: first frame + poster, so the canvas paints immediately
    ensure(1);
    ensure(frameCount);

    // Lazy: preload the (strided) sequence after first paint, in small batches
    let cancelled = false;
    const stride = strideRef.current;
    const queue: number[] = [];
    for (let i = 1; i <= frameCount; i += stride) queue.push(i);
    if (queue[queue.length - 1] !== frameCount) queue.push(frameCount);

    const pump = () => {
      if (cancelled) return;
      // prioritise frames near the current target first
      queue.sort((a, b) => Math.abs(a - targetRef.current) - Math.abs(b - targetRef.current));
      let budget = 6; // concurrent-ish batch
      while (budget-- > 0 && queue.length) {
        const next = queue.shift()!;
        if (!requestedRef.current[next]) ensure(next);
      }
      if (queue.length) setTimeout(pump, 120);
    };
    const startPreload = () => setTimeout(pump, 200);
    if ("requestIdleCallback" in window) {
      (window as Window & typeof globalThis).requestIdleCallback(startPreload);
    } else {
      startPreload();
    }

    // rAF scrub loop, gated by IntersectionObserver for performance
    const tick = () => {
      if (!activeRef.current) { rafRef.current = null; return; }
      const t = computeTarget();
      if (t !== targetRef.current) {
        targetRef.current = t;
        // make sure a small window around the target is queued first
        for (let d = -2; d <= 2; d++) ensure(snap(t + d * strideRef.current, strideRef.current, frameCount));
      }
      draw(targetRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
        if (entry.isIntersecting) start();
      },
      { threshold: 0 }
    );
    if (sectionRef.current) io.observe(sectionRef.current);

    return () => {
      cancelled = true;
      io.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      activeRef.current = false;
    };
  }, [hasFrames, frameCount, ensure, draw, computeTarget]);

  // Scroll length appended below the 100vh hero to scrub through the frames.
  const scrollLen = enhanced ? frameCount * pxPerFrame : 0;

  return (
    <section
      ref={sectionRef}
      className="relative bg-white"
      style={{ height: enhanced ? `calc(100vh + ${scrollLen}px)` : undefined }}
      aria-label="Riden Technologies — professional websites for local businesses"
    >
      {/* soft background washes */}
      <div className="pointer-events-none absolute inset-0 grid-pattern-light opacity-60" />
      <div className="pointer-events-none absolute -top-32 -right-24 h-[32rem] w-[32rem] rounded-full bg-blue-100/50 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-24 h-96 w-96 rounded-full bg-cyan-100/40 blur-3xl" />

      <div
        className={
          enhanced
            ? "sticky top-0 h-screen flex items-center overflow-hidden"
            : "relative pt-32 pb-20 lg:pt-36 lg:pb-28"
        }
      >
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-10 items-center">
            {/* Left — copy */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {eyebrow && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold ring-1 ring-blue-100"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {eyebrow}
                </motion.div>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 font-bold tracking-tight text-slate-900"
                style={{ fontSize: "clamp(2.2rem, 5vw, 3.9rem)", lineHeight: 1.08 }}
              >
                {headline}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16 }}
                className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                {subheadline}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24 }}
                className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
              >
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  {primaryCta.label}
                  <ArrowRight size={17} />
                </Link>
                {secondaryCta && (
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm sm:text-base font-semibold text-slate-700 ring-1 ring-slate-300 transition-all hover:bg-slate-50 hover:ring-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  >
                    <Layout size={17} className="text-blue-600" />
                    {secondaryCta.label}
                  </Link>
                )}
              </motion.div>

              {badges.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.32 }}
                  className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto lg:mx-0"
                >
                  {badges.map((b) => (
                    <div
                      key={b.label}
                      className="flex items-center justify-center lg:justify-start gap-2 rounded-xl bg-white/70 ring-1 ring-slate-200 px-3 py-2.5"
                    >
                      {b.icon && <b.icon className="h-4 w-4 text-blue-600 shrink-0" />}
                      <span className="text-xs font-semibold text-slate-800 leading-tight">{b.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Right — scroll-driven visual (or static fallback) */}
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="order-1 lg:order-2 lg:pl-6"
            >
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-200/40 via-cyan-100/30 to-transparent blur-2xl" />
                <div
                  className="relative w-full overflow-hidden rounded-[1.5rem] ring-1 ring-slate-200 bg-slate-50 shadow-[0_40px_80px_-32px_rgba(15,23,42,0.35)]"
                  style={{ aspectRatio: `${frameWidth} / ${frameHeight}` }}
                >
                  {hasFrames ? (
                    <>
                      {/* poster: first frame as backdrop (always present → no blank flash, no CLS) */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={staticFallback ? fallbackSrc : frameSrc(1)}
                        alt="Preview of a professional website Riden Technologies designed for a local business"
                        width={frameWidth}
                        height={frameHeight}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                      />
                      {enhanced && (
                        <canvas
                          ref={canvasRef}
                          width={frameWidth}
                          height={frameHeight}
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-slate-400 text-sm">
                      Website preview
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* scroll hint — only while pinned */}
          {enhanced && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden sm:flex justify-center">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className="h-7 w-4 rounded-full ring-1 ring-slate-300 flex items-start justify-center p-1">
                  <span className="h-1.5 w-1 rounded-full bg-slate-400 animate-bounce" />
                </span>
                Scroll to explore
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Snap an index to the strided grid and clamp into [1, count]. */
function snap(i: number, stride: number, count: number) {
  const s = 1 + Math.round((i - 1) / stride) * stride;
  return clamp(s, 1, count);
}
