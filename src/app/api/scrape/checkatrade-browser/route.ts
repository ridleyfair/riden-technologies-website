import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAuth, unauthorized } from "@/lib/api-auth";

function getEnv(key: string): string {
  try {
    const cf = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cf[key]) return cf[key]!;
  } catch {}
  return process.env[key] ?? "";
}

// Runs inside a real Chromium browser on Apify's residential proxies.
// After full JS execution + scroll, img.src contains the resolved
// /_next/image?url=...&w=1920&q=75 proxy URLs which are publicly accessible.
const PAGE_FUNCTION = `
async function pageFunction(context) {
  const { page } = context;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Use 'load' not 'networkidle' — Checkatrade's React app never reaches networkidle
  try { await page.waitForLoadState('load', { timeout: 30000 }); } catch(e) {}
  await sleep(3000);

  const SKIP = ['favicon','star','badge','tick','1x1','seal','arrow',
                'sprite','placeholder','ct-logo','trustmark','.svg','data:image'];

  // Collect all currently-visible content images from the DOM
  const collectVisible = () => page.evaluate((skip) => {
    const found = [];
    document.querySelectorAll('img').forEach(img => {
      const srcs = [img.src];
      if (img.srcset) img.srcset.split(',').forEach(p => { const u = p.trim().split(/\s+/)[0]; if (u) srcs.push(u); });
      const ds = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
      if (ds) srcs.push(ds);
      srcs.forEach(src => {
        if (src && src.startsWith('http') && !skip.some(s => src.toLowerCase().includes(s))) found.push(src);
      });
    });
    return found;
  }, SKIP);

  const allPhotos = new Set();
  (await collectVisible()).forEach(u => allPhotos.add(u));

  // Click the Photos tab — Checkatrade profile has "Overview | Skills | Reviews | Photos" nav
  try {
    // Try anchor links first (e.g. href="#photos")
    const photoAnchor = await page.$('a[href="#photos"], a[href*="#photo"], nav a:has-text("Photos"), [role="tab"]:has-text("Photos")');
    if (photoAnchor) {
      await photoAnchor.click();
      await sleep(2500);
    } else {
      // Fall back: find any link/button with text "Photos"
      const allLinks = await page.$$('a, button');
      for (const el of allLinks) {
        const txt = ((await el.textContent()) || '').trim();
        if (txt === 'Photos' || txt.startsWith('Photos ')) {
          await el.click();
          await sleep(2500);
          break;
        }
      }
    }
  } catch(e) {}

  // Scroll and collect at every step — handles virtual scrolling (unmounts off-screen rows)
  try {
    const pageH = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 250; y <= pageH + 250; y += 250) {
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await sleep(300);
      (await collectVisible()).forEach(u => allPhotos.add(u));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1000);
  } catch(e) {}

  const photos = [...allPhotos].slice(0, 150);

  // Skills — try common class/data-testid patterns
  const skills = await page.evaluate(() => {
    const found = new Set();
    ['[class*="skill"]','[class*="trade"]','[class*="categor"]',
     '[data-testid*="skill"]','[data-testid*="trade"]'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const t = (el.textContent || '').trim();
        if (t.length > 2 && t.length < 60 && /^[A-Z]/.test(t)) found.add(t);
      });
    });
    return [...found].slice(0, 50);
  });

  const meta = await page.evaluate(() => ({
    name:        document.querySelector('h1')?.innerText?.trim() || document.title || '',
    ogImage:     document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    phone:       document.querySelector('a[href^="tel:"]')?.textContent?.trim() ||
                 document.querySelector('a[href^="tel:"]')?.getAttribute('href')?.replace('tel:','') || '',
  }));

  if (meta.ogImage && meta.ogImage.startsWith('http') && !photos.includes(meta.ogImage)) {
    photos.unshift(meta.ogImage);
  }

  // Debug: raw sample so we can see what the browser actually found
  const debugRaw = await page.evaluate(() =>
    Array.from(document.images).slice(0, 5).map(img => ({
      src: img.src.slice(0, 120),
      w: img.naturalWidth,
      h: img.naturalHeight,
    }))
  );

  return { photos, skills, meta, _debug: { finalUrl: page.url(), imgCount: (await page.$$('img')).length, rawSample: debugRaw, totalCollected: allPhotos.size } };
}
`;

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const token = getEnv("APIFY_API_TOKEN");
  if (!token) {
    return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 500 });
  }

  let url: string;
  try { ({ url } = await req.json()); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!url?.includes("checkatrade.com")) {
    return NextResponse.json({ error: "A Checkatrade URL is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~playwright-scraper/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls:            [{ url }],
          pageFunction:         PAGE_FUNCTION,
          proxyConfiguration:   { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"], apifyProxyCountry: "GB" },
          maxRequestsPerCrawl:  1,
          navigationTimeoutSecs: 120,
          pageLoadTimeoutSecs:  120,
          stealth:              true,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Apify error: ${text}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ runId: data.data.id });
  } catch (err) {
    console.error("Checkatrade browser scrape error:", err);
    return NextResponse.json({ error: "Failed to start browser scrape" }, { status: 500 });
  }
}
