# Riden Public Site — Light-Mode Redesign Spec

We are converting the public marketing site from dark mode to a **premium, bright, light-mode agency** look. Positioning: Riden is a **web design & website maintenance agency** for UK local businesses. NOT an "AI website generator". Keep all existing copy unless it sounds AI/tech-heavy — never add words like AI, automation, machine learning, generated, software platform, React, Next.js.

The canonical reference component is `src/components/marketing/what-we-do.tsx` — match its visual language exactly.

## Tokens (use these literally)

- Page/section bg: `bg-white`. Alternate sections may use `bg-slate-50` or a soft wash `bg-gradient-to-b from-slate-50 to-white`. NEVER dark bg, NEVER `bg-riden-dark`, `#03040a`, `glass`, `dot-pattern` (dark). Use `dot-pattern-light` / `grid-pattern-light` if a texture is wanted (subtle).
- Section wrapper: `relative py-20 sm:py-28 overflow-hidden`
- Container: `max-w-7xl mx-auto px-4 sm:px-6` (pricing/testimonials may use `max-w-6xl`)
- Primary text: `text-slate-900`. Secondary: `text-slate-600`. Subtle: `text-slate-500`.
- Eyebrow label: `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100`
- Heading: `text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900`
- Gradient highlight inside heading: wrap words in `<span className="gradient-text-brand">…</span>`
- Body/subhead: `text-base sm:text-lg text-slate-600 leading-relaxed`
- Card: use class `card-light` plus `rounded-2xl p-6 sm:p-7` (defined in globals; white card, soft shadow, hover lift). Add `group relative` when using hover affordances.
- Icon chip: `inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 ring-1 ring-blue-100` with icon `text-blue-600 h-6 w-6`. Accent variants: cyan/indigo/emerald/violet/amber (see accentMap in what-we-do.tsx) — keep accents soft (`-50` chip bg, `-100` ring, `-600` icon).
- Primary CTA (links to /contact): `inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30`
- Secondary CTA: `inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-all hover:bg-slate-50 hover:ring-slate-400`
- If using the shared `<Button>` component: `variant="gradient"` works on light (blue→violet→cyan). For outline buttons DON'T use `variant="outline"` (it's white text) — use explicit secondary classes above.

## Motion (keep, but light-friendly)
Keep framer-motion `whileInView` fade-ups: `initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:"-80px"}} transition={{duration:0.55, ease:[0.16,1,0.3,1]}}`. Stagger grids with `delay:(i%3)*0.08`. Do NOT add a global reduced-motion handler — that's done centrally.

## Accent color rule
Old dark cards used `text-blue-400`, `bg-blue-500/10`, `border-blue-500/20`. Convert to light equivalents: text `-600`, chip bg `-50`/`-100`, ring `-100`. Replace any `text-white` → `text-slate-900`, `text-slate-300/400` → `text-slate-600`, `text-slate-500/600` → `text-slate-500`, `border-riden-border` → `ring-1 ring-slate-200` or `border-slate-200`.

## Hard rules
- Keep the component's export name, props, and section `id` (e.g. `#examples`, `#faq`, `#pricing`) unchanged.
- Keep `"use client"` where present.
- Preserve all copy text and data arrays (just restyle). Pricing data comes from `@/lib/pricing` — do not change numbers.
- Must look great on mobile (test classes at `sm`/`lg`). Keep it accessible (real text, sufficient contrast — slate-600 minimum for body on white).
- No emojis as decorative icons except where already present in data; prefer lucide icons.
