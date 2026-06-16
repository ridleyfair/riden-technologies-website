"use client";

// ─── Coded device mockups (no images, no AI) ─────────────────────────────────
// Crisp SVG/CSS representations of websites on desktop / tablet / phone, plus a
// parametrised MiniSite that renders a believable trade website inside any frame.
// Real text + exact Riden-style branding, so nothing ever reads as "AI-built".

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─── ScaledFrame ──────────────────────────────────────────────────────────────
// Renders its children at a fixed design `width` (px) and uniformly scales them
// to fill the parent's width. This is how a real device-preview works: the site
// is laid out at a comfortable width and shrunk to fit, so it never "squishes"
// when dropped into a small phone/tablet/browser frame.
export function ScaledFrame({
  width,
  children,
  className,
}: {
  width: number;
  children: React.ReactNode;
  className?: string;
}) {
  const outer = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const update = () => {
      const w = o.clientWidth;
      if (!w) return;
      const s = w / width;
      setScale(s);
      setHeight(i.offsetHeight * s); // offsetHeight is unscaled; scale to match
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className={cn("relative w-full overflow-hidden", className)} style={{ height }}>
      <div
        ref={inner}
        className="absolute left-0 top-0 origin-top-left"
        style={{ width, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export interface SiteTheme {
  /** Business name shown in the mock header. */
  name: string;
  /** Short hero tagline. */
  tagline: string;
  /** Primary brand colour (hex). */
  accent: string;
  /** Secondary brand colour (hex) for gradients. */
  accent2: string;
  /** 3 short service labels. */
  services: [string, string, string];
  /** Hero CTA label. */
  cta?: string;
}

export const DEFAULT_THEME: SiteTheme = {
  name: "Your Business",
  tagline: "Trusted local experts, ready when you need us.",
  accent: "#2563eb",
  accent2: "#06b6d4",
  services: ["Our Services", "Why Choose Us", "Get a Quote"],
  cta: "Get a Quote",
};

/* ── Browser chrome ─────────────────────────────────────────────────────── */

export function BrowserMock({
  url = "www.yourbusiness.co.uk",
  children,
  className,
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-float",
        className
      )}
    >
      {/* top bar */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1">
          <div className="mx-auto flex max-w-[18rem] items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-slate-200">
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-slate-400" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
            {url}
          </div>
        </div>
        <div className="w-10" />
      </div>
      {children}
    </div>
  );
}

/* ── Phone frame ────────────────────────────────────────────────────────── */

export function PhoneMock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-[2.2rem] border-[6px] border-slate-900 bg-slate-900 shadow-float",
        className
      )}
    >
      <div className="absolute left-1/2 top-0 z-10 h-4 w-20 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
      <div className="overflow-hidden rounded-[1.7rem] bg-white">{children}</div>
    </div>
  );
}

/* ── Tablet frame ───────────────────────────────────────────────────────── */

export function TabletMock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.4rem] border-[7px] border-slate-900 bg-slate-900 shadow-float",
        className
      )}
    >
      <div className="overflow-hidden rounded-[0.9rem] bg-white">{children}</div>
    </div>
  );
}

/* ── The website rendered inside a frame ────────────────────────────────── */

export function MiniSite({
  theme = DEFAULT_THEME,
  compact = false,
}: {
  theme?: SiteTheme;
  compact?: boolean;
}) {
  const grad = `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent2} 100%)`;
  return (
    <div className="bg-white text-slate-900" aria-hidden="true">
      {/* nav */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span
            className="h-5 w-5 rounded-md"
            style={{ background: grad }}
          />
          <span className="text-[11px] font-bold tracking-tight sm:text-xs">{theme.name}</span>
        </div>
        <div className="hidden items-center gap-3 text-[9px] font-medium text-slate-400 sm:flex">
          <span>Home</span>
          <span>Services</span>
          <span>About</span>
          <span
            className="rounded-full px-2.5 py-1 text-[9px] font-semibold text-white"
            style={{ background: theme.accent }}
          >
            {theme.cta ?? "Contact"}
          </span>
        </div>
      </div>

      {/* hero */}
      <div className="relative px-4 pb-5 pt-3 sm:px-5">
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <div className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.accent }}>
              {theme.services[2]}
            </div>
            <div className="mt-1.5 text-[15px] font-extrabold leading-tight tracking-tight sm:text-lg">
              {theme.tagline}
            </div>
            <div className="mt-2 h-1.5 w-4/5 rounded-full bg-slate-100" />
            <div className="mt-1 h-1.5 w-3/5 rounded-full bg-slate-100" />
            <div className="mt-3 flex gap-2">
              <span
                className="rounded-md px-3 py-1.5 text-[9px] font-semibold text-white"
                style={{ background: grad }}
              >
                {theme.cta ?? "Get a Quote"}
              </span>
              <span className="rounded-md px-3 py-1.5 text-[9px] font-semibold text-slate-500 ring-1 ring-slate-200">
                Call Now
              </span>
            </div>
          </div>
          <div className="col-span-2">
            <div
              className="h-full min-h-[5.5rem] rounded-lg"
              style={{ background: grad, opacity: 0.9 }}
            />
          </div>
        </div>
      </div>

      {!compact && (
        <>
          {/* service cards */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-4 sm:px-5">
            {theme.services.map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                <div
                  className="mb-1.5 h-4 w-4 rounded-md"
                  style={{ background: i === 1 ? theme.accent2 : theme.accent, opacity: 0.85 }}
                />
                <div className="text-[8px] font-semibold text-slate-700">{s}</div>
                <div className="mt-1 h-1 w-full rounded-full bg-slate-200/70" />
                <div className="mt-0.5 h-1 w-2/3 rounded-full bg-slate-200/70" />
              </div>
            ))}
          </div>

          {/* trust strip */}
          <div
            className="flex items-center justify-between px-4 py-2.5 text-[8px] font-semibold text-white sm:px-5"
            style={{ background: grad }}
          >
            <span>★★★★★ Trusted locally</span>
            <span>Fully insured · Free quotes</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Mobile-layout website (single column, no viewport breakpoints) ───────── */
// Designed to render at a fixed narrow width (use inside ScaledFrame) so it
// always looks like a real mobile site — never a squished desktop layout.
export function MiniSiteMobile({ theme = DEFAULT_THEME }: { theme?: SiteTheme }) {
  const grad = `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent2} 100%)`;
  return (
    <div className="bg-white text-slate-900" aria-hidden="true">
      {/* nav */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded" style={{ background: grad }} />
          <span className="text-[10px] font-bold tracking-tight">{theme.name}</span>
        </div>
        <div className="flex flex-col gap-[3px]">
          <span className="h-0.5 w-3.5 rounded bg-slate-400" />
          <span className="h-0.5 w-3.5 rounded bg-slate-400" />
          <span className="h-0.5 w-3.5 rounded bg-slate-400" />
        </div>
      </div>

      {/* hero (stacked) */}
      <div className="px-3 pb-3 pt-1">
        <div className="text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>
          {theme.services[2]}
        </div>
        <div className="mt-1 text-[13px] font-extrabold leading-tight tracking-tight">
          {theme.tagline}
        </div>
        <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100" />
        <div className="mt-1 h-1 w-3/4 rounded-full bg-slate-100" />
        <div
          className="mt-2 w-full rounded-md px-3 py-2 text-center text-[9px] font-semibold text-white"
          style={{ background: grad }}
        >
          {theme.cta ?? "Get a Quote"}
        </div>
        <div className="mt-2 h-20 w-full rounded-lg" style={{ background: grad, opacity: 0.9 }} />
      </div>

      {/* stacked service rows */}
      <div className="space-y-1.5 px-3 pb-3">
        {theme.services.map((s, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2">
            <span
              className="h-5 w-5 flex-shrink-0 rounded-md"
              style={{ background: i === 1 ? theme.accent2 : theme.accent, opacity: 0.85 }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-semibold text-slate-700">{s}</div>
              <div className="mt-0.5 h-1 w-2/3 rounded-full bg-slate-200/70" />
            </div>
          </div>
        ))}
      </div>

      {/* trust strip */}
      <div
        className="px-3 py-2 text-center text-[8px] font-semibold text-white"
        style={{ background: grad }}
      >
        ★★★★★ Trusted locally · Free quotes
      </div>
    </div>
  );
}
