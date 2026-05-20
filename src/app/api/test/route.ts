import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const { env } = getCloudflareContext();
    const envKeys = Object.keys(env as unknown as Record<string, unknown>);

    let dbOk = false;
    let dbError: string | null = null;
    try {
      const sql = getDb();
      await sql`SELECT 1`;
      dbOk = true;
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({
      cloudflareEnvKeys: envKeys,
      secrets: {
        DATABASE_URL: !!env.DATABASE_URL,
        AUTH_SECRET: !!env.AUTH_SECRET,
      },
      db: { connected: dbOk, error: dbError },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
