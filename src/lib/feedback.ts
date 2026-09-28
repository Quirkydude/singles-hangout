import "server-only";

import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/moolre";
import { EVENT } from "@/lib/event";
import { normalizeGhanaPhone } from "@/lib/phone";
import type { SmsStatus } from "@/generated/prisma/enums";
import type { FeedbackAnswers } from "@/lib/validation";

/**
 * The thank-you SMS sent the moment an evaluation is received.
 * Kept inside a single 160-character SMS segment.
 */
export function buildThankYouSms(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] || "there";
  return `Hi ${firstName}, thank you for participating in ${EVENT.name}! We have received your evaluation form. God bless you.`;
}

/** Optional answers are stored as null so the columns stay tidy. */
function orNull(value: string | number | undefined): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

/** Ratings arrive as strings from FormData; the column is a number. */
function orNumber(value: string | number | undefined): number {
  return Number(value);
}

/**
 * Sends (or re-sends) the thank-you SMS and records the outcome.
 * Never throws: an evaluation must be saved even if Moolre is unreachable.
 */
export async function sendThankYouSms(feedback: {
  id: string;
  fullName: string;
  phone: string;
}): Promise<{ ok: boolean; message: string }> {
  const result = await sendSms(
    feedback.phone,
    buildThankYouSms(feedback.fullName),
  );

  const smsStatus: SmsStatus = result.ok ? "SENT" : "FAILED";

  try {
    await prisma.feedback.update({
      where: { id: feedback.id },
      data: {
        smsStatus,
        smsError: result.ok ? null : result.message.slice(0, 500),
        smsSentAt: new Date(),
      },
    });
  } catch (error) {
    // A bookkeeping failure must not break the participant's submission.
    console.error("[feedback] could not record SMS status:", error);
  }

  return { ok: result.ok, message: result.message };
}

export type SubmitFeedbackInput = {
  fullName: string;
  phone: string;
  answers: FeedbackAnswers;
};

export type SubmitFeedbackResult =
  | { outcome: "created"; id: string; smsSent: boolean }
  | { outcome: "updated"; id: string; smsSent: boolean }
  | { outcome: "invalid_phone" }
  | { outcome: "error"; message: string };

/** P2002 = unique constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code?: unknown }).code) === "P2002"
  );
}

const SAVED_FIELDS = { id: true, fullName: true, phone: true } as const;

/**
 * Saves one evaluation per phone number.
 *
 * Re-submitting from the same number replaces the earlier answer sheet, which
 * keeps the results clean when somebody fills the form in twice by mistake -
 * easy to do on a phone with a slow network.
 *
 * The response is linked to the registration when the number matches one, so
 * the admin dashboard can tell who has responded. People who attended without
 * registering (or facilitators who joined late) are still welcome to submit.
 */
export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResult> {
  const phone = normalizeGhanaPhone(input.phone);
  if (!phone) return { outcome: "invalid_phone" };

  const registration = await prisma.registration.findUnique({
    where: { phone },
    select: { id: true },
  });

  const answers = input.answers;

  const data = {
    fullName: input.fullName.trim(),
    phone,
    registrationId: registration?.id ?? null,

    // Section A - general information
    ageRange: String(answers.ageRange),
    firstTime: String(answers.firstTime),

    // Section B - program content
    programRating: orNumber(answers.programRating),
    engaging: orNumber(answers.engaging),
    topicsRelevance: orNumber(answers.topicsRelevance),
    favouritePart: String(answers.favouritePart).trim(),
    nextTopic: String(answers.nextTopic).trim(),

    // Section C - facilitators / speakers
    facilitatorRating: orNumber(answers.facilitatorRating),
    facilitatorFriendly: orNumber(answers.facilitatorFriendly),
    facilitatorTiming: orNumber(answers.facilitatorTiming),

    // Section D - location, date & time
    dateTimeConvenience: orNumber(answers.dateTimeConvenience),
    duration: String(answers.duration),
    locationRating: orNumber(answers.locationRating),

    // Section E - venue & environment
    venueComfort: orNumber(answers.venueComfort),
    seating: orNumber(answers.seating),
    soundSetup: orNumber(answers.soundSetup),

    // Section F - food & refreshment
    foodQuality: orNumber(answers.foodQuality),
    foodTiming: orNumber(answers.foodTiming),
    dietarySuggestions: orNull(answers.dietarySuggestions),

    // Section G - overall experience
    recommendScore: orNumber(answers.recommendScore),
    overallScore: orNumber(answers.overallScore),
    enjoyedMost: String(answers.enjoyedMost).trim(),
    improveNext: String(answers.improveNext).trim(),
    comments: orNull(answers.comments),
  };

  const existing = await prisma.feedback.findUnique({
    where: { phone },
    select: { id: true },
  });

  try {
    const saved = existing
      ? await prisma.feedback.update({
          where: { id: existing.id },
          data,
          select: SAVED_FIELDS,
        })
      : await prisma.feedback.create({ data, select: SAVED_FIELDS });

    const sms = await sendThankYouSms(saved);

    return {
      outcome: existing ? "updated" : "created",
      id: saved.id,
      smsSent: sms.ok,
    };
  } catch (error) {
    // Another tab submitted the same number a moment ago: update that row
    // instead of failing the person in front of us.
    if (isUniqueViolation(error)) {
      try {
        const raced = await prisma.feedback.update({
          where: { phone },
          data,
          select: SAVED_FIELDS,
        });
        const sms = await sendThankYouSms(raced);
        return { outcome: "updated", id: raced.id, smsSent: sms.ok };
      } catch (retryError) {
        console.error("[feedback] retry after conflict failed:", retryError);
      }
    }

    console.error("[feedback] save failed:", error);
    return {
      outcome: "error",
      message: "Something went wrong saving your evaluation. Please try again.",
    };
  }
}
