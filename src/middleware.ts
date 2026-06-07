import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Exact IPs allowed (IPv4)
const DEFAULT_ALLOWED_IPS = ["147.12.192.228"];

// IPv6 prefixes allowed — matches any address starting with this prefix
// 2a02:6b67:d625:3500 is Ridley's home network prefix (stable, last half changes per device)
const DEFAULT_ALLOWED_PREFIXES = ["2a02:6b67:d625:3500:"];

function isAllowed(ip: string): boolean {
  const exactIps = [
    ...DEFAULT_ALLOWED_IPS,
    ...(process.env.ALLOWED_IPS?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
  ];
  if (exactIps.includes(ip)) return true;

  const prefixes = [
    ...DEFAULT_ALLOWED_PREFIXES,
    ...(process.env.ALLOWED_IP_PREFIXES?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
  ];
  return prefixes.some((prefix) => ip.startsWith(prefix));
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
    if (!isAllowed(clientIp)) {
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
