import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { verifyPassword, hashPassword } from "@/lib/password";

export async function PATCH(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { name, phone, company, currentPassword, newPassword } = body;
    const sql = getDb();

    if (name) await sql`UPDATE "User" SET name = ${name} WHERE id = ${user.id}`;
    if (phone !== undefined) await sql`UPDATE "User" SET phone = ${phone} WHERE id = ${user.id}`;
    if (company !== undefined) await sql`UPDATE "User" SET company = ${company} WHERE id = ${user.id}`;

    if (currentPassword && newPassword) {
      const [row] = await sql`SELECT "passwordHash" FROM "User" WHERE id = ${user.id}`;
      const valid = await verifyPassword(currentPassword, row.passwordHash);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      const hash = await hashPassword(newPassword);
      await sql`UPDATE "User" SET "passwordHash" = ${hash} WHERE id = ${user.id}`;
    }

    const [updated] = await sql`SELECT id, email, name, role, phone, company FROM "User" WHERE id = ${user.id}`;
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
