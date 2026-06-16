#!/usr/bin/env bash
# ─── Hero scroll-sequence frame pipeline ──────────────────────────────────────
# Extracts frames from an MP4 and encodes them as optimised WebP into
# /public/hero-sequence, ready for ScrollImageSequenceHero.
#
# Usage:
#   scripts/build-hero-frames.sh <input.mp4> [frame_count] [width]
#
# Example:
#   scripts/build-hero-frames.sh /tmp/hero.mp4 96 1280
#
# After running, update FRAME_COUNT / FRAME_WIDTH / FRAME_HEIGHT in
# src/lib/hero-sequence.ts to match the printed values.
set -euo pipefail

INPUT="${1:?Usage: build-hero-frames.sh <input.mp4> [frame_count] [width]}"
COUNT="${2:-96}"
WIDTH="${3:-1280}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hero-sequence"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Input:        $INPUT"
echo "→ Target frames:$COUNT  width:${WIDTH}px"

# Source duration (seconds) → fps that yields ~COUNT frames evenly across the clip.
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT" | awk '{printf "%.4f", $1}')"
FPS="$(awk -v c="$COUNT" -v d="$DUR" 'BEGIN{ if(d<=0) d=6; printf "%.6f", c/d }')"
echo "→ Duration:     ${DUR}s  → sampling fps ${FPS}"

rm -rf "$OUT"
mkdir -p "$OUT"

# 1) Extract evenly-spaced PNG frames, scaled to WIDTH (height auto, even).
ffmpeg -hide_banner -loglevel error -i "$INPUT" \
  -vf "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos" \
  -frames:v "$COUNT" \
  "$TMP/raw_%04d.png"

# 2) Encode each PNG → optimised WebP, renumbered frame_0001.webp …
i=0
for f in "$TMP"/raw_*.png; do
  i=$((i+1))
  printf -v name "frame_%04d.webp" "$i"
  ffmpeg -hide_banner -loglevel error -i "$f" \
    -c:v libwebp -quality 72 -compression_level 6 -preset photo \
    "$OUT/$name"
done

ACTUAL="$(ls "$OUT"/frame_*.webp | wc -l | tr -d ' ')"
DIMS="$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$OUT/frame_0001.webp")"
SIZE="$(du -sh "$OUT" | cut -f1)"

echo "✓ Wrote $ACTUAL WebP frames to public/hero-sequence ($SIZE total)"
echo "✓ Frame dimensions: ${DIMS} (set FRAME_WIDTH/FRAME_HEIGHT in src/lib/hero-sequence.ts)"
echo "✓ Set FRAME_COUNT = $ACTUAL in src/lib/hero-sequence.ts"
