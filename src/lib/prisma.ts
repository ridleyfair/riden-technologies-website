import { neon } from "@neondatabase/serverless";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getDbUrl(): string {
  try {
    const url = getCloudflareContext().env.DATABASE_URL;
    if (url) return url;
  } catch {
    // local dev — getCloudflareContext not available outside a request
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

let _client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!_client) {
    const sql = neon(getDbUrl());
    const adapter = new PrismaNeonHTTP(sql);
    _client = new PrismaClient({ adapter });
  }
  return _client;
}

// Proxy so all existing `prisma.user.findUnique(...)` calls work unchanged,
// but the client is created on first use (during a request) not at module init.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getClient();
    const val = client[prop as keyof PrismaClient];
    return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(client) : val;
  },
});
