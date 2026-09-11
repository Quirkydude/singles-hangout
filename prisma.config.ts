import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local; the Prisma CLI does not by default.
config({ path: ".env.local" });
config();

// Neon: migrations should run against the unpooled (direct) connection.
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Omitted when no URL is configured so `prisma generate` still works
  // on a fresh clone before credentials are filled in.
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
