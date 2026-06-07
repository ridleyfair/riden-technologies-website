import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Your public IP — add more comma-separated IPs via the ALLOWED_IPS env var
const DEFAULT_ALLOWED_IPS = ["147.12.192.228", "2a02:6b67:d625:3500:a730:d5f3:1426:54"];

function getAllowedIps(): string[] {
  const envIps = process.env.ALLOWED_IPS
    ? process.env.ALLOWED_IPS.split(",").map((ip) => ip.trim()).filter(Boolean)
    : [];
  return [...DEFAULT_ALLOWED_IPS, ...envIps];
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    ""
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // IP whitelist — blocks /login and /portal for unknown IPs
  const isProtectedPath = pathname.startsWith("/login") || pathname.startsWith("/portal");
  if (isProtectedPath) {
    const clientIp = getClientIp(request);
    const allowed = getAllowedIps();
    if (!allowed.includes(clientIp)) {
      return new NextResponse("Access denied", { status: 403 });
    }
  }

  // Auth check — redirect unauthenticated requests to /login
  if (pathname.startsWith("/portal")) {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const user = await verifyToken(token);
    if (!user) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/portal/:path*"],
};
