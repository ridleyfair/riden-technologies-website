"use client";

// ─── Ambient AI backdrop─────────────────────────────────────────────────────
// Layers an abstract, TEXT-FREE generated image (Higgsfield) at low opacity for
// premium depth. Per the brand brief, AI is only ever used for non-textual
// ambience — never for UI, mockups or anything legible.
//
// Drop optimised WebP files into /public/images/backdrops/. If a file is missing
// the component still renders the coded gradient/blur fallback, so the page is
// never broken and never shows a broken image.

import { cn } from "@/lib/utils";

export type BackdropName = "aurora" | "bokeh" | "mesh";

const SRC: Record<BackdropName, string> = {
  aurora: "/images/backdrops/aurora.webp",
  bokeh: "/images/backdrops/bokeh.webp",
  mesh: "/images/backdrops/mesh.webp",
};

export function AiBackdrop({
  name = "aurora",
  className,
  opacity = 0.5,
}: {
  name?: BackdropName;
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* Coded fallback wash — always present, on-brand blue→cyan. */}
      <div className="absolute -top-1/3 left-1/2 h-[120%] w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.18),rgba(6,182,212,0.10)_45%,transparent_70%)] blur-2xl" />
      {/* Generated ambience layered on top, blended into white. */}
      <img
        src={SRC[name]}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
        style={{ opacity }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      {/* Soften edges into the white page. */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/70" />
    </div>
  );
}
