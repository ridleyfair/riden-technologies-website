import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const componentPath = path.join(process.cwd(), 'src/components/marketing/process-scroll-story.tsx');

test('responsive device scene renders tablet and phone with purpose-built content', () => {
  const source = fs.readFileSync(componentPath, 'utf8');
  const responsiveScene = source.slice(
    source.indexOf('function TinyTabletContent()'),
    source.indexOf('function SeoScene()')
  );

  // Purpose-built mini content functions exist
  assert.match(responsiveScene, /TinyTabletContent/);
  assert.match(responsiveScene, /TinyPhoneContent/);

  // Device frame components used
  assert.match(responsiveScene, /TabletMock/);
  assert.match(responsiveScene, /PhoneMock/);

  // Desktop browser still uses ScaledFrame
  assert.match(responsiveScene, /ScaledFrame/);

  // No MiniSiteMobile inside ResponsiveScene (replaced by TinyPhoneContent)
  const onlyResponsive = source.slice(
    source.indexOf('function ResponsiveScene()'),
    source.indexOf('function SeoScene()')
  );
  assert.doesNotMatch(onlyResponsive, /<MiniSiteMobile/);

  // Device labels present
  assert.match(responsiveScene, /Desktop.*Tablet.*Mobile|Tablet.*Mobile/s);
});
