import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import ws from "ws";

neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

const users = [
  {
    name: "Ridley Fair",
    email: "ridley@ridentechnologies.com",
    password: "Ridley@Riden2025",
    role: "owner",
  },
  {
    name: "Denis Beqiraj",
    email: "denis@ridentechnologies.com",
    password: "Denis@Riden2025",
    role: "admin",
  },
];

async function main() {
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
    console.log(`✓ ${u.email}  →  password: ${u.password}`);
  }
  console.log("\nUsers seeded. Change passwords after first login.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
