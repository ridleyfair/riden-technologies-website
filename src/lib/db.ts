import { neon } from "@neondatabase/serverless";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getDbUrl(): string {
  try {
    const url = getCloudflareContext().env.DATABASE_URL;
    if (url) return url;
  } catch {
    // local dev — no Cloudflare context available
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

export const getDb = () => neon(getDbUrl());
