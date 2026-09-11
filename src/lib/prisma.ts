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

/**
 * Hosts whose certificate chain is not guaranteed to be in Node's bundled
 * CA store. Supabase's Supavisor pooler is the common case: verifying it
 * fails with "self-signed certificate in certificate chain".
 */
const SUPABASE_HOST_SUFFIXES = [
  ".pooler.supabase.com",
  ".supabase.co",
  ".supabase.com",
];

type TlsPolicy =
  | { mode: "verify" }
  | { mode: "verify-ca"; ca: string }
  | { mode: "no-verify" };

function isSupabaseHost(hostname: string): boolean {
  return SUPABASE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

/**
 * Chooses how to treat the server certificate.
 *
 *   1. DATABASE_SSL_CA set          -> verify against that CA (strongest)
 *   2. DATABASE_SSL_NO_VERIFY=true  -> skip verification
 *   3. DATABASE_SSL_NO_VERIFY=false -> always verify
 *   4. unset + Supabase host        -> skip verification
 *   5. unset + anything else        -> verify
 *
 * Rule 4 exists so a deploy cannot silently break on a missing variable.
 * The connection is still encrypted; only the certificate identity check is
 * skipped. Set DATABASE_SSL_CA to get full verification if you want it.
 */
function resolveTlsPolicy(hostname: string): TlsPolicy {
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n").trim();
  if (ca) return { mode: "verify-ca", ca };

  const flag = process.env.DATABASE_SSL_NO_VERIFY?.trim().toLowerCase();
  if (flag === "true") return { mode: "no-verify" };
  if (flag === "false") return { mode: "verify" };

  return isSupabaseHost(hostname) ? { mode: "no-verify" } : { mode: "verify" };
}

/** Turns our TLS policy into the option object `pg` expects. */
function toSslOption(policy: TlsPolicy): { rejectUnauthorized: boolean; ca?: string } {
  switch (policy.mode) {
    case "no-verify":
      return { rejectUnauthorized: false };
    case "verify-ca":
      return { ca: policy.ca, rejectUnauthorized: true };
    default:
      return { rejectUnauthorized: true };
  }
}

/**
 * Normalises the connection string. `sslmode` is always removed: node-postgres
 * treats `sslmode=require` as `verify-full`, and it takes precedence over any
 * explicit `ssl` option we pass, which would make our TLS policy a no-op.
 */
function buildConnectionString(raw: string, stripSslMode: boolean): string {
  const url = new URL(raw);

  // Supavisor in transaction mode does not support the named prepared
  // statements Prisma issues by default. `pgbouncer=true` turns them off.
  // Supabase's dashboard usually includes this; add it if it is missing.
  if (url.port === POOLER_TRANSACTION_PORT && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  if (stripSslMode) {
    url.searchParams.delete("sslmode");
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

  const url = new URL(connectionString);
  const requestedSslMode = url.searchParams.get("sslmode");

  // Only impose TLS when the connection string asked for it. This keeps a
  // plain local Postgres (no sslmode) working without a certificate.
  const wantsSsl = requestedSslMode !== null && requestedSslMode !== "disable";
  const policy = resolveTlsPolicy(url.hostname);

  const adapter = new PrismaPg({
    connectionString: buildConnectionString(connectionString, wantsSsl),
    max: resolvePoolMax(),
    ...(wantsSsl ? { ssl: toSslOption(policy) } : {}),
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
