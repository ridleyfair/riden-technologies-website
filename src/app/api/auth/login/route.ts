import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
};

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const sql = getDb();
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const rows = await sql`
    SELECT COUNT(*) AS count FROM "LoginAttempt"
    WHERE ip = ${ip} AND "createdAt" > ${windowStart}
  `;
  return Number(rows[0]?.count ?? 0) < MAX_ATTEMPTS;
}

async function recordAttempt(ip: string) {
  const sql = getDb();
  await sql`INSERT INTO "LoginAttempt" (ip, "createdAt") VALUES (${ip}, NOW())`;
}

async function clearAttempts(ip: string) {
  const sql = getDb();
  await sql`DELETE FROM "LoginAttempt" WHERE ip = ${ip}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`SELECT id, email, name, role, "passwordHash" FROM "User" WHERE email = ${email} LIMIT 1`;
    const user = rows[0] as UserRow | undefined;

    if (!user) {
      await recordAttempt(ip);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordAttempt(ip);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Successful login — clear rate limit counter
    await clearAttempts(ip);

    const token = await createToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    const response = NextResponse.json({ success: true });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
