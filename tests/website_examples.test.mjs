import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const componentPath = path.join(process.cwd(), 'src/components/marketing/website-examples.tsx');
const screenshotPath = path.join(process.cwd(), 'public/images/portfolio/begu-carpentry.png');

test('website examples section only showcases BEGU Carpentry with a real screenshot', () => {
  const source = fs.readFileSync(componentPath, 'utf8');

  assert.match(source, /BEGU Carpentry/);
  assert.match(source, /\/images\/portfolio\/begu-carpentry\.png/);
  assert.match(source, /https:\/\/begucarpentry\.com/);
  assert.match(source, /View BEGU Website/);
  assert.doesNotMatch(source, /Harper Plumbing/);
  assert.doesNotMatch(source, /Voltedge Electrical/);
  assert.doesNotMatch(source, /Stoneworks Builders/);
  assert.doesNotMatch(source, /Lumière Beauty/);
  assert.doesNotMatch(source, /Evergreen Gardens/);
});

test('BEGU Carpentry screenshot asset exists', () => {
  assert.equal(fs.existsSync(screenshotPath), true);
  const stat = fs.statSync(screenshotPath);
  assert.ok(stat.size > 100_000, `expected screenshot to be a real image, got ${stat.size} bytes`);
});
