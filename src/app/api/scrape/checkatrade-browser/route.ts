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

// Returns a stable key for deduplication: strips size/quality params and unwraps
// Next.js _next/image proxy URLs so the same photo at multiple widths maps to one entry.
function canonicalKey(url: string): string {
  try {
    const u = new URL(url);
    if (u.pathname === "/_next/image") {
      const src = u.searchParams.get("url");
      if (src) {
        try {
          const inner = new URL(decodeURIComponent(src));
          ["w", "h", "q", "width", "height", "quality", "size", "fit"].forEach(p => inner.searchParams.delete(p));
          return inner.toString();
        } catch {}
        return decodeURIComponent(src);
      }
    }
    ["w", "h", "q", "width", "height", "quality", "size", "fit"].forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

// For proxy URLs, return the decoded original so we get the real CDN URL.
function resolveUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.pathname === "/_next/image") {
      const src = u.searchParams.get("url");
      if (src) return decodeURIComponent(src);
    }
  } catch {}
  return url;
}

function extractPhotos(html: string): string[] {
  const seen = new Map<string, string>(); // canonical → resolved URL

  function add(raw: string) {
    if (!raw.startsWith("http")) return;
    const lower = raw.toLowerCase();
    if (SKIP.some(s => lower.includes(s))) return;
    const key = canonicalKey(raw);
    if (!seen.has(key)) seen.set(key, resolveUrl(raw));
  }

  // Parse img tags for src, data-src, and srcset
  const imgTagRe = /<img[^>]+>/gi;
  const srcRe = /\bsrc="([^"]+)"/i;
  const srcsetRe = /\bsrcset="([^"]+)"/i;
  const dataSrcRe = /\bdata-src="([^"]+)"/i;

  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgTagRe.exec(html)) !== null) {
    const tag = imgMatch[0];
    for (const re of [srcRe, dataSrcRe]) {
      const m = tag.match(re);
      if (m?.[1]) add(m[1]);
    }
    const ssm = tag.match(srcsetRe);
    if (ssm?.[1]) {
      ssm[1].split(",").forEach(part => {
        const u = part.trim().split(/\s+/)[0];
        if (u) add(u);
      });
    }
  }

  return [...seen.values()];
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
