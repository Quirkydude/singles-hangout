import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 requires a driver adapter. The pooled Neon connection string
 * (DATABASE_URL) is used at runtime; migrations use DIRECT_URL via
 * prisma.config.ts.
 *
 * The client is created lazily (on first query) rather than at import
 * time. That keeps `next build` working on machines or CI runs that do
 * not have database credentials available, and avoids opening a
 * connection for modules that are imported but never queried.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * `prisma.registration.findMany()` and friends work as usual; each
 * property access resolves the real client (and its connection) on demand.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrisma();
    const value = Reflect.get(client, property, client) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(_target, property) {
    return property in getPrisma();
  },
});
