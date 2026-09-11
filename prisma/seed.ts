import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { EVENT } from "../src/lib/event";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local first.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const capacity = process.env.INITIAL_CAPACITY?.trim() || String(EVENT.defaultCapacity);

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
  console.log("Settings:");
  for (const row of all) console.log(`  ${row.key} = ${row.value}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
