"use server";

import { redirect } from "next/navigation";
import { feedbackSchema } from "@/lib/validation";
import { submitFeedback } from "@/lib/feedback";
import {
  FEEDBACK_QUESTION_IDS,
  FEEDBACK_SECTIONS,
  IDENTITY_FIELDS,
} from "@/lib/feedback-questions";
import type { FeedbackState, FieldErrors } from "@/lib/form-state";

const FIELD_KEYS: readonly string[] = [
  ...IDENTITY_FIELDS,
  ...FEEDBACK_QUESTION_IDS,
];

function rawValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of FIELD_KEYS) {
    const value = formData.get(key);
    if (typeof value === "string" && value !== "") values[key] = value;
  }
  return values;
}

/**
 * Maps a field name to the step that owns it, so a rejected answer is never
 * hidden on a step the participant cannot see.
 */
function stepForField(field: string | undefined): number {
  if (!field) return 1;

  const index = FEEDBACK_SECTIONS.findIndex((section) =>
    section.questions.some((question) => question.id === field),
  );

  return index === -1 ? 1 : index + 1;
}

export async function submitFeedbackAction(
  _prevState: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const values = rawValues(formData);

  const parsed = feedbackSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }

    return {
      status: "error",
      message: "Please check the highlighted answers.",
      fieldErrors,
      values,
      step: stepForField(Object.keys(fieldErrors)[0]),
    };
  }

  const result = await submitFeedback({
    fullName: String(parsed.data.fullName),
    phone: String(parsed.data.phone),
    answers: parsed.data,
  });

  switch (result.outcome) {
    case "created":
    case "updated":
      // The thank-you page confirms the submission and tells the participant
      // whether the SMS went out.
      redirect(
        `/feedback/thank-you?sms=${result.smsSent ? "sent" : "failed"}&again=${
          result.outcome === "updated" ? "1" : "0"
        }`,
      );
    case "invalid_phone":
      return {
        status: "error",
        message: "Please enter a valid Ghanaian mobile number.",
        fieldErrors: { phone: "Enter a valid Ghanaian mobile number." },
        values,
        step: 1,
      };
    default:
      return {
        status: "error",
        message: result.message,
        values,
      };
  }
}
