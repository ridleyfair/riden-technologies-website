import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  try {
    const { env } = getCloudflareContext();

    // List all keys visible in env (secrets may or may not be enumerable)
    const envKeys = Object.keys(env as unknown as Record<string, unknown>);

    const dbUrl = env.DATABASE_URL;
    const authSecret = env.AUTH_SECRET;

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

    let prismaOk = false;
    let prismaError: string | null = null;
    if (dbConnected) {
      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.lead.findMany({ take: 1 });
        prismaOk = true;
      } catch (err) {
        prismaError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({
      cloudflareEnvKeys: envKeys,
      secrets: {
        DATABASE_URL: !!dbUrl,
        AUTH_SECRET: !!authSecret,
      },
      db: { connected: dbConnected, error: dbError || (!dbUrl ? "DATABASE_URL not set" : null) },
      prisma: { ok: prismaOk, error: prismaError },
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
