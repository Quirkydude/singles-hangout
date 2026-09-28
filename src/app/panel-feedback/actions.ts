"use server";

import { redirect } from "next/navigation";
import { panelFeedbackSchema } from "@/lib/validation";
import { submitPanelFeedback } from "@/lib/panel-feedback";
import {
  PANEL_FEEDBACK_SECTIONS,
  PANEL_IDENTITY_FIELDS,
  PANEL_QUESTION_IDS,
} from "@/lib/panel-feedback-questions";
import type { FieldErrors, PanelFeedbackState } from "@/lib/form-state";

const FIELD_KEYS: readonly string[] = [
  ...PANEL_IDENTITY_FIELDS,
  ...PANEL_QUESTION_IDS,
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
 * hidden on a step the panelist cannot see.
 */
function stepForField(field: string | undefined): number {
  if (!field) return 1;

  const index = PANEL_FEEDBACK_SECTIONS.findIndex((section) =>
    section.questions.some((question) => question.id === field),
  );

  return index === -1 ? 1 : index + 1;
}

export async function submitPanelFeedbackAction(
  _prevState: PanelFeedbackState,
  formData: FormData,
): Promise<PanelFeedbackState> {
  const values = rawValues(formData);

  const parsed = panelFeedbackSchema.safeParse(values);

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

  const result = await submitPanelFeedback({
    panelistName: String(parsed.data.panelistName),
    answers: parsed.data,
  });

  if (result.outcome === "error") {
    return {
      status: "error",
      message: result.message,
      values,
    };
  }

  // No SMS for panelists: the thank-you page simply confirms that the answers
  // have landed (see `panel-feedback.ts`). `again=1` means this replaced an
  // earlier answer sheet from the same name.
  redirect(
    `/panel-feedback/thank-you?again=${result.outcome === "updated" ? "1" : "0"}`,
  );
}
