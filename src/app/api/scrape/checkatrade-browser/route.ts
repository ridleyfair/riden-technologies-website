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

export type PhotoGallery = { name: string; photos: string[] };

const SKIP = [
  "favicon", "star", "badge", "tick", "1x1", "seal", "arrow",
  "sprite", "placeholder", "ct-logo", "trustmark", ".svg", "data:image",
  "logo", "icon", "avatar", "profile", "flag", "map", "banner",
];

// Strips Cloudinary-style transformation path segments (c_fill,h_400,w_600 etc.)
// and unwraps Next.js _next/image proxy URLs.
function canonicalKey(url: string): string {
  try {
    const u = new URL(url);

    // Unwrap _next/image proxy → recurse on inner URL
    if (u.pathname === "/_next/image") {
      const src = u.searchParams.get("url");
      if (src) return canonicalKey(decodeURIComponent(src));
    }

    // Strip Cloudinary transformation segments from the path
    // e.g. /image/upload/c_fill,h_400,w_600/v123/photo.jpg → /image/upload/v123/photo.jpg
    const cleaned = u.pathname.replace(/\/(?:[a-z]+_[a-z0-9]+,?)+(?=\/)/g, "");

    // Strip common size/quality query params
    ["w", "h", "q", "width", "height", "quality", "size", "fit", "auto"].forEach(p =>
      u.searchParams.delete(p)
    );

    return u.origin + cleaned + (u.search || "");
  } catch {
    return url;
  }
}

// Returns the best URL for actual use: decoded original for _next/image proxies.
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

function urlFromImgTag(tag: string): string | null {
  // Prefer the largest srcset entry (best quality)
  const ssm = tag.match(/\bsrcset="([^"]+)"/i);
  if (ssm?.[1]) {
    const best = ssm[1]
      .split(",")
      .map(p => { const [u, w] = p.trim().split(/\s+/); return { u, w: parseInt(w) || 0 }; })
      .sort((a, b) => b.w - a.w)[0];
    if (best?.u?.startsWith("http")) return resolveUrl(best.u);
  }
  const srcm = tag.match(/\bsrc="([^"]+)"/i);
  if (srcm?.[1]?.startsWith("http")) return resolveUrl(srcm[1]);
  const dsm = tag.match(/\bdata-src="([^"]+)"/i);
  if (dsm?.[1]?.startsWith("http")) return resolveUrl(dsm[1]);
  return null;
}

function isNoise(url: string): boolean {
  const lower = url.toLowerCase();
  return SKIP.some(s => lower.includes(s));
}

// Checkatrade tab/nav headings that are never album names
const UI_HEADINGS = new Set([
  "overview", "skills", "reviews", "photos", "contact", "about",
  "services", "accreditations", "opening hours", "location", "find us",
  "get in touch", "request a quote", "call now", "memberships",
  "awards", "qualifications", "insurance", "our work", "portfolio",
]);

// Parses the rendered HTML into named galleries.
// Strategy: walk headings and img tags by position; each photo belongs to
// the nearest preceding heading. UI/nav headings are ignored.
function extractGalleries(html: string): PhotoGallery[] {
  type HeadingEvent = { kind: "heading"; text: string; pos: number };
  type PhotoEvent   = { kind: "photo";   url: string;  pos: number };
  type Event = HeadingEvent | PhotoEvent;

  const events: Event[] = [];
  const globalSeen = new Set<string>();

  // Headings h2–h5 — skip known UI labels
  const headingRe = /<h([2-5])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hm: RegExpExecArray | null;
  while ((hm = headingRe.exec(html)) !== null) {
    const text = hm[2].replace(/<[^>]+>/g, "").trim();
    if (text.length >= 2 && text.length <= 80 && /[a-zA-Z]/.test(text)) {
      if (!UI_HEADINGS.has(text.toLowerCase())) {
        events.push({ kind: "heading", text, pos: hm.index });
      }
    }
  }

  // Images
  const imgRe = /<img[^>]+>/gi;
  let im: RegExpExecArray | null;
  while ((im = imgRe.exec(html)) !== null) {
    const url = urlFromImgTag(im[0]);
    if (!url || isNoise(url)) continue;
    const key = canonicalKey(url);
    if (!globalSeen.has(key)) {
      globalSeen.add(key);
      events.push({ kind: "photo", url, pos: im.index });
    }
  }

  events.sort((a, b) => a.pos - b.pos);

  // Assign each photo to its most recent heading
  const map = new Map<string, string[]>();
  let heading = "Portfolio";

  for (const ev of events) {
    if (ev.kind === "heading") {
      heading = ev.text;
    } else {
      if (!map.has(heading)) map.set(heading, []);
      map.get(heading)!.push(ev.url);
    }
  }

  const groups = [...map.entries()]
    .map(([name, photos]) => ({ name, photos }))
    .filter(g => g.photos.length > 0);

  // If we only got one group (no album structure detected), return it as-is.
  // If we got multiple groups, filter out likely noise (< 2 photos) but keep named albums.
  if (groups.length <= 1) return groups;
  return groups.filter(g => g.photos.length >= 2 || g.name !== "Portfolio");
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
    const cleanUrl = url.replace(/#.*$/, "").replace(/\/+$/, "");

    // If the user pasted a specific album URL (/trades/{slug}/albums/{albumId}),
    // scrape it directly — album pages render all photos for that album.
    // Otherwise scrape the profile page which shows recent work photos.
    const albumMatch = cleanUrl.match(/\/albums\/([^/]+)$/);
    const scrapeUrl = albumMatch
      ? cleanUrl
      : cleanUrl.replace(/\/(albums|photos|reviews|skills)(\/.*)?$/, "");

    const params = new URLSearchParams({
      api_key:       apiKey,
      url:           scrapeUrl,
      render_js:     "true",
      stealth_proxy: "true",
      wait:          "5000",
      country_code:  "gb",
    });

    const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params}`);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `ScrapingBee error ${res.status}: ${text}` }, { status: 500 });
    }

    const html = await res.text();
    const rawGalleries = extractGalleries(html);

    // If we scraped a specific album URL and the parser returned everything as
    // "Portfolio", rename it to the album name from the page <h1>.
    const galleries = (albumMatch && rawGalleries.length === 1 && rawGalleries[0].name === "Portfolio")
      ? (() => { const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i); return [{ ...rawGalleries[0], name: h1?.[1]?.trim() ?? rawGalleries[0].name }]; })()
      : rawGalleries;

    const photos = galleries.flatMap(g => g.photos);

    return NextResponse.json({
      galleries,
      photos,
      _debug: { htmlLength: html.length, galleryCount: galleries.length, totalPhotos: photos.length, scrapedUrl: scrapeUrl },
    });
  } catch (err) {
    console.error("Checkatrade ScrapingBee error:", err);
    return NextResponse.json({ error: "Failed to scrape photos" }, { status: 500 });
  }
}
