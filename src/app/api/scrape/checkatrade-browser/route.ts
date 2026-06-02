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

  try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch(e) {}
  await sleep(2000);

  // Scroll to trigger lazy-loaded images
  try {
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= h; y += 400) {
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await sleep(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1500);
  } catch(e) {}

  const SKIP = ['icon','logo','favicon','star','badge','tick','avatar',
                '1x1','seal','arrow','sprite','placeholder','ct-logo','trustmark'];

  // All rendered images >= 150 px wide — img.src is the resolved proxy URL
  const photos = await page.evaluate((skip) => {
    return [...new Set(
      Array.from(document.images)
        .filter(img => img.src.startsWith('http') &&
                       img.naturalWidth  >= 150 &&
                       img.naturalHeight >= 100)
        .map(img => img.src)
        .filter(src => !skip.some(s => src.toLowerCase().includes(s)))
    )].slice(0, 30);
  }, SKIP);

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

  return { photos, skills, meta };
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
          proxyConfiguration:   { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
          maxRequestsPerCrawl:  1,
          navigationTimeoutSecs: 60,
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
