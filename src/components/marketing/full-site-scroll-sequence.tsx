"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const VIDEO_SRC = "/videos/full-site-scroll-sequence-source.mp4";
const POSTER_SRC = "/videos/full-site-scroll-sequence-poster.jpg";
const VIDEO_DURATION = 6.041667;

const screenCopy = [
  {
    eyebrow: "Riden Technologies",
    title: "Websites built to turn local searches into real enquiries.",
    body: "A cinematic, managed website service for UK trades, beauty, wellness and local service businesses.",
    code: "01 / STRATEGY",
    metrics: ["Design", "Hosting", "Updates", "SEO"],
  },
  {
    eyebrow: "Design + Build",
    title: "Your business, shaped into a premium online presence.",
    body: "We turn services, reviews, photos and offers into a site that feels polished on every screen.",
    code: "02 / BUILD",
    metrics: ["Mobile", "Copy", "Pages", "Trust"],
  },
  {
    eyebrow: "Examples that Sell",
    title: "Show the work. Build trust. Make enquiry feel obvious.",
    body: "Galleries, testimonials, service areas and quote prompts are choreographed around how local buyers choose.",
    code: "03 / PROOF",
    metrics: ["Work", "Reviews", "Areas", "CTA"],
  },
  {
    eyebrow: "Fully Managed",
    title: "No logins, plugins, hosting headaches or tech stress.",
    body: "Send us the change. We keep the website fresh, fast and maintained for you.",
    code: "04 / CARE",
    metrics: ["Hosting", "Security", "Edits", "Support"],
  },
  {
    eyebrow: "Local SEO",
    title: "Built to help nearby customers find and trust you.",
    body: "Service and location pages are structured to turn Google searches into real conversations.",
    code: "05 / GROWTH",
    metrics: ["Services", "Locations", "Search", "Leads"],
  },
  {
    eyebrow: "Simple Pricing",
    title: "Launch without managing the technical side.",
    body: "A clear setup plus monthly management so your website keeps working while you run the business.",
    code: "06 / PLAN",
    metrics: ["£499 setup", "Managed", "Updates", "Support"],
  },
  {
    eyebrow: "Ready when you are",
    title: "Let’s build the version customers should see first.",
    body: "Tell us about the business and we’ll prepare a tailored website preview.",
    code: "07 / START",
    metrics: ["Preview", "Approve", "Launch", "Grow"],
    final: true,
  },
] as const;

export default function FullSiteScrollSequence() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduce);
    if (reduce) return;

    const update = () => {
      rafRef.current = null;
      const section = sectionRef.current;
      const video = videoRef.current;
      if (!section || !video) return;

      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const nextProgress = clamp(-rect.top / scrollable, 0, 1);
      const chapter = Math.min(screenCopy.length - 1, Math.floor(nextProgress * screenCopy.length));
      setProgress(nextProgress);
      setActiveChapter(chapter);

      const targetTime = nextProgress * VIDEO_DURATION;
      if (Number.isFinite(targetTime) && Math.abs((video.currentTime || 0) - targetTime) > 0.035) {
        try {
          video.currentTime = targetTime;
        } catch {
          // Browser may reject seeks until metadata is ready; next tick retries.
        }
      }
    };

    const requestUpdate = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(update);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#f8fbff] text-slate-950"
      style={{ height: reducedMotion ? "auto" : `${screenCopy.length * 118}vh` }}
      aria-label="Riden Technologies cinematic website journey"
    >
      {!reducedMotion && <SequenceAnchors />}

      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]" />
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-92 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,transparent_34%,rgba(255,255,255,0.52)_63%,rgba(255,255,255,0.9)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/28 to-white/82" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white via-white/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/80 to-transparent" />

        <InterfaceOverlays activeChapter={activeChapter} progress={progress} />

        <div className="relative z-10 h-full px-5 pt-24 sm:px-8 lg:px-12" data-embedded-sequence-copy>
          <div className="absolute left-[4vw] top-[19vh] max-w-xs mix-blend-multiply">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/25 px-3 py-1 text-xs font-semibold text-blue-700 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Site-wide scroll animation
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              Content placed inside the animated website scene
            </p>
          </div>

          <div className="pointer-events-auto absolute bottom-[12vh] left-[4vw] flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(37,99,235,0.25)] transition hover:-translate-y-0.5">
              Get My Website Preview <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#sequence-chapters" className="inline-flex items-center justify-center rounded-full border border-slate-300/80 bg-white/20 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur-sm transition hover:bg-white/50">
              Explore the sequence
            </Link>
          </div>

          <div id="sequence-chapters" className="pointer-events-none absolute left-[42vw] top-[14vh] h-[42vh] w-[30vw] min-w-[25rem] max-w-[38rem] mix-blend-multiply max-lg:left-[8vw] max-lg:top-[42vh] max-lg:w-[84vw] max-lg:min-w-0">
            {screenCopy.map((chapter, index) => (
              <article
                key={chapter.eyebrow}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  index === activeChapter || reducedMotion
                    ? "translate-y-0 scale-100 opacity-100 blur-0"
                    : index < activeChapter
                      ? "-translate-y-6 scale-[0.98] opacity-0 blur-sm"
                      : "translate-y-6 scale-[1.02] opacity-0 blur-sm"
                }`}
              >
                <div className="text-[0.68rem] font-bold uppercase tracking-[0.42em] text-blue-600">{chapter.code}</div>
                <div className="mt-3 text-[0.72rem] font-bold uppercase tracking-[0.28em] text-slate-500">{chapter.eyebrow}</div>
                <h1 className="mt-3 max-w-[13ch] text-[clamp(2.1rem,4vw,5.4rem)] font-bold leading-[0.9] tracking-[-0.055em] text-slate-950">
                  {chapter.title}
                </h1>
                <p className="mt-5 max-w-md text-[clamp(0.95rem,1.2vw,1.22rem)] leading-7 text-slate-600">{chapter.body}</p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                  {chapter.metrics.map((metric) => (
                    <span key={metric} className="relative pl-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 before:absolute before:left-0 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-blue-500">
                      {metric}
                    </span>
                  ))}
                </div>
                {"final" in chapter && chapter.final && (
                  <div className="pointer-events-auto mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
                      Start My Preview <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/pricing" className="inline-flex items-center justify-center rounded-full text-sm font-semibold text-blue-700">
                      Compare plans →
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full bg-white/25 px-4 py-2 text-xs font-semibold text-slate-500 backdrop-blur-sm sm:flex">
            <span className="h-7 w-4 rounded-full border border-slate-300 p-1"><span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" /></span>
            Scroll to move through the website animation
          </div>
        </div>
      </div>

      {reducedMotion && <ReducedMotionFallback />}
    </section>
  );
}

function SequenceAnchors() {
  return (
    <>
      <div id="examples" className="absolute top-[28%] h-px w-px scroll-mt-24" />
      <div id="services" className="absolute top-[42%] h-px w-px scroll-mt-24" />
      <div id="maintenance" className="absolute top-[52%] h-px w-px scroll-mt-24" />
      <div id="seo" className="absolute top-[62%] h-px w-px scroll-mt-24" />
      <div id="pricing" className="absolute top-[76%] h-px w-px scroll-mt-24" />
      <div id="faq" className="absolute top-[88%] h-px w-px scroll-mt-24" />
    </>
  );
}

function InterfaceOverlays({ activeChapter, progress }: { activeChapter: number; progress: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <div className="absolute left-[34vw] top-[11vh] h-[54vh] w-[40vw] rounded-[2rem] border border-blue-200/35 opacity-70 max-lg:left-[5vw] max-lg:top-[41vh] max-lg:w-[90vw]" />
      <div className="absolute left-[37vw] top-[17vh] h-px w-[47vw] origin-left bg-gradient-to-r from-blue-500/45 via-cyan-400/20 to-transparent max-lg:left-[7vw] max-lg:top-[48vh]" style={{ transform: `scaleX(${0.18 + progress * 0.82})` }} />
      <div className="absolute left-[39vw] top-[25vh] h-[18vh] w-px bg-gradient-to-b from-blue-500/45 to-transparent max-lg:left-[11vw] max-lg:top-[55vh]" />
      <div className="absolute left-[77vw] top-[24vh] h-[18vh] w-px bg-gradient-to-b from-cyan-500/35 to-transparent max-lg:left-[86vw] max-lg:top-[55vh]" />
      <div className="absolute left-[78vw] top-[43vh] h-px w-[10vw] bg-gradient-to-r from-cyan-500/35 to-transparent max-lg:hidden" />

      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute h-2.5 w-2.5 rounded-full bg-blue-500/70 shadow-[0_0_28px_rgba(37,99,235,0.55)]"
          style={{
            left: `${43 + i * 10 + Math.sin(progress * Math.PI * 2 + i) * 2}vw`,
            top: `${18 + ((activeChapter + i) % 4) * 8}vh`,
            animation: `pulse ${1.6 + i * 0.25}s ease-in-out infinite`,
          }}
        />
      ))}

      <div className="absolute left-[17vw] top-[66vh] h-28 w-28 rounded-full border border-blue-300/35 max-lg:hidden" style={{ transform: `rotate(${progress * 180}deg)` }}>
        <div className="absolute -right-1 top-1/2 h-2 w-2 rounded-full bg-blue-500" />
      </div>
      <div className="absolute right-[8vw] top-[62vh] text-[0.62rem] font-bold uppercase tracking-[0.32em] text-slate-400 max-lg:hidden">
        SCENE {String(activeChapter + 1).padStart(2, "0")}
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}

function ReducedMotionFallback() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 text-slate-900">
      <div className="grid gap-8 md:grid-cols-2">
        {screenCopy.slice(1).map((chapter) => (
          <section key={chapter.eyebrow} className="border-t border-slate-200 pt-6">
            <div className="text-xs font-bold uppercase tracking-[0.26em] text-blue-600">{chapter.eyebrow}</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{chapter.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{chapter.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
