import "server-only";

import { prisma } from "@/lib/prisma";
import type { PanelFeedbackAnswers } from "@/lib/validation";

/**
 * Panelists are identified by the name they type, so the key is that name
 * lower-cased with the spacing flattened: " Ama  Mensah " and "ama mensah" are
 * one panelist, and a second submission replaces the first rather than
 * creating a duplicate row.
 */
export function panelistKeyOf(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
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

export type SubmitPanelFeedbackInput = {
  panelistName: string;
  answers: PanelFeedbackAnswers;
};

export type SubmitPanelFeedbackResult =
  | { outcome: "created"; id: string }
  | { outcome: "updated"; id: string }
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

const SAVED_FIELDS = { id: true } as const;

/**
 * Saves one evaluation per panelist.
 *
 * There is no phone number and no SMS here: the panelists are a known, small
 * group who are thanked in person, and the form they were given asks for their
 * name only. Re-submitting under the same name replaces the earlier answer
 * sheet, which keeps the results clean when somebody fills the form in twice
 * by mistake - easy to do on a phone with a slow network.
 */
export async function submitPanelFeedback(
  input: SubmitPanelFeedbackInput,
): Promise<SubmitPanelFeedbackResult> {
  const panelistName = input.panelistName.trim();
  const panelistKey = panelistKeyOf(panelistName);
  const answers = input.answers;

  const data = {
    panelistName,
    panelistKey,

    // Section A - preparation
    topicClarity: orNumber(answers.topicClarity),
    preEventComms: orNumber(answers.preEventComms),

    // Section B - the discussion
    moderatorSteering: orNumber(answers.moderatorSteering),
    timeAdequacy: String(answers.timeAdequacy),
    questionRelevance: orNumber(answers.questionRelevance),
    audienceEngagement: orNumber(answers.audienceEngagement),

    // Section C - the big picture
    objectivesAchieved: String(answers.objectivesAchieved),
    overallSuccess: orNumber(answers.overallSuccess),
    serveAgain: String(answers.serveAgain),

    // Section D - the comment
    suggestions: orNull(answers.suggestions),
  };

  const existing = await prisma.panelFeedback.findUnique({
    where: { panelistKey },
    select: { id: true },
  });

  try {
    const saved = existing
      ? await prisma.panelFeedback.update({
          where: { id: existing.id },
          data,
          select: SAVED_FIELDS,
        })
      : await prisma.panelFeedback.create({ data, select: SAVED_FIELDS });

    return { outcome: existing ? "updated" : "created", id: saved.id };
  } catch (error) {
    // Another tab submitted the same name a moment ago: update that row
    // instead of failing the panelist in front of us.
    if (isUniqueViolation(error)) {
      try {
        const raced = await prisma.panelFeedback.update({
          where: { panelistKey },
          data,
          select: SAVED_FIELDS,
        });
        return { outcome: "updated", id: raced.id };
      } catch (retryError) {
        console.error(
          "[panel-feedback] retry after conflict failed:",
          retryError,
        );
      }
    }

    console.error("[panel-feedback] save failed:", error);
    return {
      outcome: "error",
      message: "Something went wrong saving your evaluation. Please try again.",
    };
  }
}
