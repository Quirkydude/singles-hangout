import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 requires a driver adapter.
 *
 * - `DATABASE_URL` is the pooled Supabase connection (Supavisor transaction
 *   mode, port 6543) and is used by the app at runtime.
 * - `DIRECT_URL` is the session/direct connection (port 5432) and is used by
 *   the Prisma CLI for migrations; see prisma.config.ts.
 *
 * The client is created lazily (on first query) rather than at import time.
 * That keeps `next build` working on machines or CI runs without database
 * credentials, and avoids opening a connection for modules that are only
 * imported.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/** Supavisor transaction mode listens on this port. */
const POOLER_TRANSACTION_PORT = "6543";

/** Small pool: this runs on serverless, where many instances each hold one. */
const DEFAULT_POOL_MAX = 5;

function resolveConnectionString(raw: string): string {
  const url = new URL(raw);

  // Supavisor in transaction mode does not support the named prepared
  // statements Prisma issues by default. `pgbouncer=true` turns them off.
  // Supabase's dashboard usually includes this; add it if it is missing.
  if (url.port === POOLER_TRANSACTION_PORT && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
}

function resolvePoolMax(): number {
  const parsed = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_POOL_MAX;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  const adapter = new PrismaPg({
    connectionString: resolveConnectionString(connectionString),
    max: resolvePoolMax(),
    // Escape hatch for environments that reject Supabase's certificate
    // chain. Prefer leaving this off so TLS is fully verified.
    ...(process.env.DATABASE_SSL_NO_VERIFY === "true"
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  });

  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * `prisma.registration.findMany()` and friends work as usual; each property
 * access resolves the real client (and its connection) on demand.
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
