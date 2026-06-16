import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const ROOT = '/home/skids/Riden-Technologies-Website';
const componentPath = `${ROOT}/src/components/marketing/full-site-scroll-sequence.tsx`;
const publicVideoPath = `${ROOT}/public/videos/full-site-scroll-sequence-source.mp4`;
const publicPosterPath = `${ROOT}/public/videos/full-site-scroll-sequence-poster.jpg`;

test('full-site scroll sequence publishes the new MP4 and poster for the browser', () => {
  assert.ok(fs.existsSync(publicVideoPath), 'expected browser-served MP4 at public/videos/full-site-scroll-sequence-source.mp4');
  assert.ok(fs.statSync(publicVideoPath).size > 1_000_000, 'expected MP4 to be a real video asset');
  assert.ok(fs.existsSync(publicPosterPath), 'expected poster fallback at public/videos/full-site-scroll-sequence-poster.jpg');
  assert.ok(fs.statSync(publicPosterPath).size > 10_000, 'expected poster to be a real image asset');
});

test('full-site scroll sequence component is whole-page, not hero-image-only', () => {
  const source = fs.readFileSync(componentPath, 'utf8');
  assert.match(source, /\/videos\/full-site-scroll-sequence-source\.mp4/);
  assert.match(source, /sticky top-0 h-screen/);
  assert.match(source, /screenCopy\.map/);
  assert.match(source, /prefers-reduced-motion/);
  assert.doesNotMatch(source, /ScrollImageSequenceHero/);
});

test('copy is embedded inside the scroll image composition instead of separate cards', () => {
  const source = fs.readFileSync(componentPath, 'utf8');
  assert.match(source, /screenCopy/);
  assert.match(source, /InterfaceOverlays/);
  assert.match(source, /data-embedded-sequence-copy/);
  assert.match(source, /mix-blend-multiply/);
  assert.doesNotMatch(source, /rounded-\[2rem\] border border-white\/80 bg-white\/78 p-6 shadow/);
  assert.doesNotMatch(source, /glass card/i);
});
