// ─── Hero scroll-image-sequence config ───────────────────────────────────────
// Single source of truth for the scroll-driven hero animation.
//
// Two frame sources are available — flip HERO_VARIANT to switch:
//
//   "coded"     (DEFAULT) — crisp, on-brand storyboard rendered from
//               scripts/hero-storyboard.html. Real text, exact Riden branding,
//               no AI artifacts. Regenerate: scripts/render-hero-frames-coded.sh
//
//   "cinematic" — frames extracted from the Higgsfield AI MP4 (more cinematic
//               camera/lighting, but on-screen UI text is AI-generated/garbled).
//               Source mp4: /media/hero-cinematic-source.mp4 (not served)
//               Regenerate: scripts/build-hero-frames.sh media/hero-cinematic-source.mp4 90 1280
//
// If frames fail to load or FRAME_COUNT is 0, ScrollImageSequenceHero falls back
// to a static hero (no pin), so the page always works.

export type HeroVariant = "coded" | "cinematic";

/** ← Change this one line to switch the hero animation source. */
export const HERO_VARIANT: HeroVariant = "coded";

const VARIANTS: Record<HeroVariant, { dir: string; count: number }> = {
  coded: { dir: "/hero-sequence", count: 90 },
  cinematic: { dir: "/hero-sequence-cinematic", count: 89 },
};

const active = VARIANTS[HERO_VARIANT];

/** Number of frames in the active sequence (frame_0001.webp … frame_NNNN.webp). */
export const FRAME_COUNT = active.count;

/** Native pixel dimensions of each frame — drives the canvas + aspect box (no layout shift). */
export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 720;

/** Zero-padded, 1-indexed frame path. e.g. frameSrc(1) -> /hero-sequence/frame_0001.webp */
export function frameSrc(index: number): string {
  const n = String(index).padStart(4, "0");
  return `${active.dir}/frame_${n}.webp`;
}

/** Static poster: late frame (finished website) for reduced-motion / mobile-perf fallback. */
export const FALLBACK_SRC = frameSrc(Math.max(1, Math.round(FRAME_COUNT * 0.92)));

/** On mobile we preload a strided subset of frames to keep memory/bandwidth low. */
export const MOBILE_FRAME_STRIDE = 2;
