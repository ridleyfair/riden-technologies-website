import { NextRequest, NextResponse } from "next/server";

const ALLOWED_IMAGE_HOSTS = [
  /(^|\.)googleusercontent\.com$/i,
  /(^|\.)googleapis\.com$/i,
  /(^|\.)gstatic\.com$/i,
];

function isAllowedImageUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOSTS.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get("url") ?? "";
  if (!isAllowedImageUrl(imageUrl)) {
    return NextResponse.json({ error: "Unsupported image URL" }, { status: 400 });
  }

  const upstream = await fetch(imageUrl, {
    headers: {
      "User-Agent": "Riden-Technologies-Image-Proxy/1.0",
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
    },
    cache: "force-cache",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Image fetch failed" }, { status: upstream.status || 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return NextResponse.json({ error: "URL did not return an image" }, { status: 415 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
