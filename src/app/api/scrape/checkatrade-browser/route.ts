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

const SKIP = [
  "favicon", "star", "badge", "tick", "1x1", "seal", "arrow",
  "sprite", "placeholder", "ct-logo", "trustmark", ".svg", "data:image",
  "logo", "icon", "avatar", "profile", "flag",
];

function extractPhotos(html: string): string[] {
  const photos = new Set<string>();

  // Match all img src and srcset URLs
  const imgTagRe = /<img[^>]+>/gi;
  const srcRe = /src="([^"]+)"/i;
  const srcsetRe = /srcset="([^"]+)"/i;
  const dataSrcRe = /data-src="([^"]+)"/i;

  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgTagRe.exec(html)) !== null) {
    const tag = imgMatch[0];
    for (const re of [srcRe, dataSrcRe]) {
      const m = tag.match(re);
      if (m?.[1] && m[1].startsWith("http")) photos.add(m[1]);
    }
    const ssm = tag.match(srcsetRe);
    if (ssm?.[1]) {
      ssm[1].split(",").forEach(part => {
        const u = part.trim().split(/\s+/)[0];
        if (u?.startsWith("http")) photos.add(u);
      });
    }
  }

  // Also pull from Next.js _next/image proxy URLs embedded in the HTML
  const nextImgRe = /https:\/\/www\.checkatrade\.com\/_next\/image\?url=([^"&\s]+)/g;
  let nim: RegExpExecArray | null;
  while ((nim = nextImgRe.exec(html)) !== null) {
    try {
      const decoded = decodeURIComponent(nim[1]);
      if (decoded.startsWith("http")) photos.add(decoded);
    } catch {}
  }

  // Filter noise
  return [...photos].filter(url => {
    const lower = url.toLowerCase();
    return !SKIP.some(s => lower.includes(s));
  });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const apiKey = getEnv("SCRAPINGBEE_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "SCRAPINGBEE_API_KEY not configured" }, { status: 500 });
  }

  let url: string;
  try { ({ url } = await req.json()); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!url?.includes("checkatrade.com")) {
    return NextResponse.json({ error: "A Checkatrade URL is required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      api_key:       apiKey,
      url,
      render_js:     "true",
      stealth_proxy: "true",
      wait:          "4000",       // wait 4s after page load for React to render photos
      country_code:  "gb",
    });

    const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`, {
      method: "GET",
      // ScrapingBee can take up to 60s — CF Worker default timeout is fine
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `ScrapingBee error ${res.status}: ${text}` }, { status: 500 });
    }

    const html = await res.text();
    const photos = extractPhotos(html);

    return NextResponse.json({
      photos,
      _debug: {
        htmlLength: html.length,
        totalFound: photos.length,
      },
    });
  } catch (err) {
    console.error("Checkatrade ScrapingBee error:", err);
    return NextResponse.json({ error: "Failed to scrape photos" }, { status: 500 });
  }
}
