import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

neonConfig.poolQueryViaFetch = true;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string): Promise<string> {
  const { webcrypto } = await import("node:crypto");
  const subtle = webcrypto.subtle;
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    KEY_LENGTH * 8
  );
  return `${bufToHex(salt.buffer as ArrayBuffer)}:${bufToHex(bits)}`;
}

const users = [
  { name: "Ridley Fair", email: "ridley@ridentechnologies.com", password: "Ridley@Riden2025", role: "owner" },
  { name: "Denis Beqiraj", email: "denis@ridentechnologies.com", password: "Denis@Riden2025", role: "admin" },
];

async function main() {
  for (const u of users) {
    const passwordHash = await hashPassword(u.password);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
    console.log(`✓ ${u.email}  →  password: ${u.password}`);
  }
  console.log("\nUsers seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
