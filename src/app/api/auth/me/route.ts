import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.json({ user: null });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ user: null });

  try {
    const sql = getDb();
    const [row] = await sql`SELECT id, email, name, role, phone, company FROM "User" WHERE id = ${user.id}`;
    return NextResponse.json({ user: row ?? user });
  } catch {
    return NextResponse.json({ user });
  }
}
