import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUrlSet = !!process.env.DATABASE_URL;
  const authSecretSet = !!process.env.AUTH_SECRET;

  let dbConnected = false;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    env: { DATABASE_URL: dbUrlSet, AUTH_SECRET: authSecretSet },
    db: { connected: dbConnected, error: dbError },
  });
}
