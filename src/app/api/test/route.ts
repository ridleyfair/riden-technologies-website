import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const authSecret = process.env.AUTH_SECRET;

  if (!dbUrl) {
    return NextResponse.json({
      env: { DATABASE_URL: false, AUTH_SECRET: !!authSecret },
      db: { connected: false, error: "DATABASE_URL is not set" },
    });
  }

  let dbConnected = false;
  let dbError: string | null = null;

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(dbUrl);
    await sql`SELECT 1`;
    dbConnected = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    env: { DATABASE_URL: true, AUTH_SECRET: !!authSecret },
    db: { connected: dbConnected, error: dbError },
  });
}
