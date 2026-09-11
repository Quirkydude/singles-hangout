import { prisma } from "@/lib/prisma";
import { EVENT } from "@/lib/event";

export const SETTING_KEYS = {
  capacity: "capacity",
  registrationOpen: "registration_open",
} as const;

export type EventSettings = {
  capacity: number;
  registrationOpen: boolean;
  registeredCount: number;
  spotsLeft: number;
  isFull: boolean;
};

function parseCapacity(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  // 0 or a non-numeric value means "no cap".
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : EVENT.defaultCapacity;
}

function parseOpen(value: string | undefined): boolean {
  // Default to open unless explicitly switched off.
  return value === undefined ? true : value !== "false";
}

export async function getEventSettings(): Promise<EventSettings> {
  const [rows, registeredCount] = await Promise.all([
    prisma.setting.findMany({
      where: {
        key: { in: [SETTING_KEYS.capacity, SETTING_KEYS.registrationOpen] },
      },
    }),
    prisma.registration.count(),
  ]);

  const map = new Map(rows.map((row) => [row.key, row.value]));
  const capacity = parseCapacity(map.get(SETTING_KEYS.capacity));
  const registrationOpen = parseOpen(map.get(SETTING_KEYS.registrationOpen));
  const spotsLeft = Math.max(0, capacity - registeredCount);

  return {
    capacity,
    registrationOpen,
    registeredCount,
    spotsLeft,
    isFull: spotsLeft === 0,
  };
}

/** Safe to call from a page render: never throws, falls back to defaults. */
export async function getEventSettingsSafe(): Promise<EventSettings> {
  try {
    return await getEventSettings();
  } catch (error) {
    console.error("[settings] falling back to defaults:", error);
    return {
      capacity: EVENT.defaultCapacity,
      registrationOpen: true,
      registeredCount: 0,
      spotsLeft: EVENT.defaultCapacity,
      isFull: false,
    };
  }
}
