import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  let cfEnv: { DATABASE_URL?: string; AUTH_SECRET?: string } = {};
  let cfError: string | null = null;

  try {
    const { env } = getCloudflareContext();
    cfEnv = { DATABASE_URL: env.DATABASE_URL, AUTH_SECRET: env.AUTH_SECRET };
  } catch (err) {
    cfError = err instanceof Error ? err.message : String(err);
  }

  const dbUrl = cfEnv.DATABASE_URL ?? process.env.DATABASE_URL;
  const authSecret = cfEnv.AUTH_SECRET ?? process.env.AUTH_SECRET;

  let dbConnected = false;
  let dbError: string | null = null;

  if (dbUrl) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(dbUrl);
      await sql`SELECT 1`;
      dbConnected = true;
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    cloudflareContext: cfError ? { error: cfError } : "ok",
    env: {
      DATABASE_URL: !!cfEnv.DATABASE_URL,
      AUTH_SECRET: !!authSecret,
      DATABASE_URL_from_process_env: !!process.env.DATABASE_URL,
    },
    db: { connected: dbConnected, error: dbError || (!dbUrl ? "DATABASE_URL not set" : null) },
  });
}
