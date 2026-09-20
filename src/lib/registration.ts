import "server-only";

import { prisma } from "@/lib/prisma";
import { generateCode, normalizeCodeInput } from "@/lib/codes";
import { sendSms } from "@/lib/moolre";
import { EVENT, getTicketUrl } from "@/lib/event";
import { getEventSettings } from "@/lib/settings";
import { normalizeGhanaPhone } from "@/lib/phone";
import type { SmsStatus } from "@/generated/prisma/enums";

const MAX_CODE_ATTEMPTS = 6;
const MAX_SMS_LENGTH = 160;

export type RegistrationRecord = {
  code: string;
  fullName: string;
  phone: string;
};

/**
 * Builds the registration SMS. A ticket link is appended only when the
 * whole message still fits in a single 160-character SMS segment, so the
 * link is never truncated into something unusable.
 */
export function buildRegistrationSms(
  fullName: string,
  code: string,
): string {
  const firstName = fullName.trim().split(/\s+/)[0] || "there";
  const base = `Hi ${firstName}, you're registered for ${EVENT.name}. Code: ${code}. ${EVENT.dateShort}, ${EVENT.timeLabel}, ${EVENT.venue}. Show this code at the door.`;
  const withLink = `${base} ${getTicketUrl(code)}`;

  if (withLink.length <= MAX_SMS_LENGTH) return withLink;
  if (base.length <= MAX_SMS_LENGTH) return base;
  return `Hi ${firstName}, you're registered for ${EVENT.name}. Code: ${code}. Show this code at the door.`;
}

/**
 * Sends (or re-sends) the registration code and records the outcome.
 * Never throws: registration must succeed even if Moolre is unreachable.
 */
export async function sendRegistrationSms(registration: {
  id: string;
  code: string;
  fullName: string;
  phone: string;
}): Promise<{ ok: boolean; message: string }> {
  const result = await sendSms(
    registration.phone,
    buildRegistrationSms(registration.fullName, registration.code),
  );

  const smsStatus: SmsStatus = result.ok ? "SENT" : "FAILED";

  try {
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        smsStatus,
        smsError: result.ok ? null : result.message.slice(0, 500),
        smsSentAt: new Date(),
      },
    });
  } catch (error) {
    // A bookkeeping failure must not break the user's registration.
    console.error("[registration] could not record SMS status:", error);
  }

  return { ok: result.ok, message: result.message };
}

/**
 * Sent when an organizer removes someone.
 *
 * Deliberately neutral: it does not state the internal reason, so the
 * person is not told something they may find hurtful or share publicly.
 * The code is not repeated - it is now invalid.
 */
export function buildRemovalSms(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || "there";
  return `Hi ${firstName}, thank you for registering for ${EVENT.name}. We're unable to confirm your place for this edition, so your registration code is no longer valid. Please contact 0538118529.`;
}

/** Sent if an organizer restores someone they removed by mistake. */
export function buildRestoreSms(fullName: string, code: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || "there";
  const base = `Hi ${firstName}, good news - your place at ${EVENT.name} is confirmed again. Your code: ${code}. ${EVENT.dateShort}, ${EVENT.timeLabel}, ${EVENT.venue}.`;
  const withLink = `${base} ${getTicketUrl(code)}`;
  if (withLink.length <= MAX_SMS_LENGTH) return withLink;
  return base;
}

export type RemoveResult = {
  code: string;
  fullName: string;
  smsSent: boolean;
};

/**
 * Soft-removes registrations: the row is kept (so the phone number stays
 * taken and the spot is freed) but the person is marked removed.
 *
 * Already-removed rows are skipped, so re-running is safe and does not send
 * a second SMS.
 */
export async function removeRegistrations(
  codes: string[],
  reason?: string | null,
): Promise<RemoveResult[]> {
  const normalized = codes.map(normalizeCodeInput).filter(Boolean) as string[];
  if (normalized.length === 0) return [];

  const targets = await prisma.registration.findMany({
    where: { code: { in: normalized }, removed: false },
    select: { id: true, code: true, fullName: true, phone: true },
  });

  const results: RemoveResult[] = [];

  for (const target of targets) {
    await prisma.registration.update({
      where: { id: target.id },
      data: {
        removed: true,
        removedAt: new Date(),
        removedReason: reason?.trim() ? reason.trim().slice(0, 200) : null,
      },
    });

    const sms = await sendSms(target.phone, buildRemovalSms(target.fullName));
    results.push({
      code: target.code,
      fullName: target.fullName,
      smsSent: sms.ok,
    });
  }

  return results;
}

/** Undoes a removal and re-sends the original code. */
export async function restoreRegistrations(
  codes: string[],
): Promise<RemoveResult[]> {
  const normalized = codes.map(normalizeCodeInput).filter(Boolean) as string[];
  if (normalized.length === 0) return [];

  const targets = await prisma.registration.findMany({
    where: { code: { in: normalized }, removed: true },
    select: { id: true, code: true, fullName: true, phone: true },
  });

  const results: RemoveResult[] = [];

  for (const target of targets) {
    await prisma.registration.update({
      where: { id: target.id },
      data: { removed: false, removedAt: null, removedReason: null },
    });

    // Same delivery bookkeeping as a normal send.
    const sms = await sendSms(
      target.phone,
      buildRestoreSms(target.fullName, target.code),
    );
    results.push({
      code: target.code,
      fullName: target.fullName,
      smsSent: sms.ok,
    });
  }

  return results;
}

export type RegisterResult =
  | {
      outcome: "created" | "resent";
      code: string;
      smsSent: boolean;
    }
  | { outcome: "ineligible" }
  | { outcome: "invalid_phone" }
  | { outcome: "closed" }
  | { outcome: "full" }
  /** Removed by an organizer: cannot register again for this edition. */
  | { outcome: "removed" }
  | { outcome: "error"; message: string };

type RegisterInput = {
  fullName: string;
  location: string;
  isFacilitator: boolean;
  affiliation?: string | null;
  role?: string | null;
  phone: string;
  age: number;
  gender?: string | null;
  panelQuestion?: string | null;
};

/**
 * Registers an attendee.
 *
 * - The phone number is normalised here (not by the caller) so an
 *   unnormalised number can never reach Moolre or create a duplicate row.
 * - Under-age applicants are rejected (server-side gate on EVENT.minAge).
 * - A phone number that is already registered is not duplicated: the
 *   existing code is re-sent instead.
 * - Registration is blocked once capacity is reached.
 */
export async function registerAttendee(
  input: RegisterInput,
): Promise<RegisterResult> {
  if (input.age < EVENT.minAge) {
    return { outcome: "ineligible" };
  }

  const phone = normalizeGhanaPhone(input.phone);
  if (!phone) {
    return { outcome: "invalid_phone" };
  }

  const settings = await getEventSettings();
  if (!settings.registrationOpen) {
    return { outcome: "closed" };
  }

  // Already registered? Re-send the existing code instead of duplicating.
  // Checked before the capacity gate so a returning registrant always gets
  // their original code back.
  const existing = await prisma.registration.findUnique({
    where: { phone },
    select: {
      id: true,
      code: true,
      fullName: true,
      phone: true,
      removed: true,
    },
  });

  if (existing) {
    // Deliberately does NOT re-send a code. Texting them a code we have
    // just invalidated would be worse than saying nothing.
    if (existing.removed) {
      return { outcome: "removed" };
    }
    const sms = await sendRegistrationSms(existing);
    return { outcome: "resent", code: existing.code, smsSent: sms.ok };
  }

  if (settings.isFull) {
    return { outcome: "full" };
  }

  const data = {
    fullName: input.fullName,
    location: input.location,
    isFacilitator: input.isFacilitator,
    affiliation: input.affiliation?.trim() ? input.affiliation.trim() : null,
    role: input.role?.trim() ? input.role.trim() : null,
    phone,
    age: input.age,
    gender: input.gender && input.gender !== "unspecified" ? input.gender : null,
    panelQuestion: input.panelQuestion?.trim() ? input.panelQuestion.trim() : null,
  };

  // Retry on the (extremely unlikely) code collision, and re-check capacity
  // inside the transaction so we never overshoot the cap.
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateCode();

    try {
      const created = await prisma.$transaction(async (tx) => {
        const count = await tx.registration.count({
          where: { removed: false },
        });
        if (count >= settings.capacity) return null;

        return tx.registration.create({
          data: { ...data, code },
          select: { id: true, code: true, fullName: true, phone: true },
        });
      });

      if (!created) return { outcome: "full" };

      const sms = await sendRegistrationSms(created);
      return { outcome: "created", code: created.code, smsSent: sms.ok };
    } catch (error) {
      const code2 =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";

      // P2002 = unique constraint violation.
      if (code2 === "P2002") {
        const target =
          typeof error === "object" && error !== null && "meta" in error
            ? JSON.stringify((error as { meta?: unknown }).meta)
            : "";

        // A duplicate phone is not retryable; the code collision is.
        if (target.includes("phone")) {
          const raced = await prisma.registration.findUnique({
            where: { phone },
            select: { id: true, code: true, fullName: true, phone: true },
          });
          if (raced) {
            const sms = await sendRegistrationSms(raced);
            return { outcome: "resent", code: raced.code, smsSent: sms.ok };
          }
        }
        continue; // try another code
      }

      console.error("[registration] create failed:", error);
      return {
        outcome: "error",
        message: "Something went wrong saving your registration. Please try again.",
      };
    }
  }

  return {
    outcome: "error",
    message: "Could not allocate a registration code. Please try again.",
  };
}
