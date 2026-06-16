#!/usr/bin/env bash
# ─── Coded hero storyboard → WebP frame sequence ──────────────────────────────
# Renders scripts/hero-storyboard.html (a deterministic, pure-function-of-t
# scene) at N evenly spaced positions using headless Chrome, then encodes each
# to optimised WebP in /public/hero-sequence.
#
# This is the DEFAULT, fully on-brand source for ScrollImageSequenceHero
# (real text, exact Riden branding, no AI artifacts).
#
# Usage:  scripts/render-hero-frames-coded.sh [frame_count]
set -euo pipefail

COUNT="${1:-90}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="$ROOT/scripts/hero-storyboard.html"
OUT="$ROOT/public/hero-sequence"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
echo "→ Chrome:  $CHROME"
echo "→ Frames:  $COUNT  (1280x720)"

rm -rf "$OUT"; mkdir -p "$OUT"

for ((i=1; i<=COUNT; i++)); do
  t=$(awk -v i="$i" -v c="$COUNT" 'BEGIN{ printf "%.5f", (c>1)?(i-1)/(c-1):0 }')
  png=$(printf "$TMP/raw_%04d.png" "$i")
  "$CHROME" --headless=new --hide-scrollbars --disable-gpu --no-sandbox \
    --force-device-scale-factor=1 --window-size=1280,720 \
    --screenshot="$png" "file://$HTML?t=$t" >/dev/null 2>&1
  webp=$(printf "$OUT/frame_%04d.webp" "$i")
  ffmpeg -hide_banner -loglevel error -i "$png" \
    -c:v libwebp -quality 78 -compression_level 6 -preset photo "$webp"
  printf "\r  rendered %d/%d" "$i" "$COUNT"
done
echo

ACTUAL="$(ls "$OUT"/frame_*.webp | wc -l | tr -d ' ')"
SIZE="$(du -sh "$OUT" | cut -f1)"
echo "✓ Wrote $ACTUAL WebP frames to public/hero-sequence ($SIZE total)"
echo "✓ Ensure FRAME_COUNT=$ACTUAL, FRAME_WIDTH=1280, FRAME_HEIGHT=720 in src/lib/hero-sequence.ts"
