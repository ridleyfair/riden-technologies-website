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

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`SELECT * FROM "User" WHERE email = ${email} LIMIT 1`;
    const user = rows[0] as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

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
