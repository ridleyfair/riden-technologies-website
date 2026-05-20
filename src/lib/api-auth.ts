import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyToken, AuthUser } from "./auth";

export async function requireAuth(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
