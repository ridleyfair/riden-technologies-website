import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const componentPath = path.join(process.cwd(), 'src/components/marketing/process-scroll-story.tsx');

test('responsive device scene renders desktop + tablet side-by-side composition', () => {
  const source = fs.readFileSync(componentPath, 'utf8');
  const block = source.slice(
    source.indexOf('function TinyTabletContent()'),
    source.indexOf('function SeoScene()')
  );

  // Purpose-built mini content function exists
  assert.match(block, /TinyTabletContent/);

  // Device frame components used
  assert.match(block, /DesktopMock/);
  assert.match(block, /TabletMock/);

  // Desktop content uses ScaledFrame
  assert.match(block, /ScaledFrame/);

  // No MiniSiteMobile inside ResponsiveScene
  const onlyResponsive = source.slice(
    source.indexOf('function ResponsiveScene()'),
    source.indexOf('function SeoScene()')
  );
  assert.doesNotMatch(onlyResponsive, /<MiniSiteMobile/);

  // Badge labels present
  assert.match(block, /Desktop Optimised/);
  assert.match(block, /Tablet Friendly/);
  assert.match(block, /Mobile Responsive/);
});
