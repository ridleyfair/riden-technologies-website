import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const componentPath = path.join(process.cwd(), 'src/components/marketing/process-scroll-story.tsx');

test('responsive device scene renders premium 3-device composition', () => {
  const source = fs.readFileSync(componentPath, 'utf8');
  const block = source.slice(
    source.indexOf('function TinyTabletContent()'),
    source.indexOf('function SeoScene()')
  );

  // Purpose-built mini content functions exist
  assert.match(block, /TinyTabletContent/);
  assert.match(block, /TinyPhoneContent/);

  // All three device frame components used
  assert.match(block, /DesktopMock/);
  assert.match(block, /TabletMock/);
  assert.match(block, /PhoneMock/);

  // Desktop content still uses ScaledFrame
  assert.match(block, /ScaledFrame/);

  // No MiniSiteMobile inside ResponsiveScene
  const onlyResponsive = source.slice(
    source.indexOf('function ResponsiveScene()'),
    source.indexOf('function SeoScene()')
  );
  assert.doesNotMatch(onlyResponsive, /<MiniSiteMobile/);

  // Premium badge labels present
  assert.match(block, /Desktop Optimised/);
  assert.match(block, /Tablet Friendly/);
  assert.match(block, /Mobile Responsive/);
});
