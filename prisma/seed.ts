/**
 * Seeds the editable settings rows (capacity, registration open/closed).
 *
 * Uses the shared Prisma client from src/lib/prisma.ts so the Supabase
 * connection handling (pooler parameters, pool size, TLS options) is
 * identical to the running application.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { prisma } from "../src/lib/prisma";
import { EVENT } from "../src/lib/event";

async function main() {
  const capacity =
    process.env.INITIAL_CAPACITY?.trim() || String(EVENT.defaultCapacity);

  const settings = [
    { key: "capacity", value: capacity },
    { key: "registration_open", value: "true" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {}, // never overwrite a value that is already configured
      create: setting,
    });
  }

  const all = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  const count = await prisma.registration.count();

  console.log("Settings:");
  for (const row of all) console.log(`  ${row.key} = ${row.value}`);
  console.log(`Registrations so far: ${count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
