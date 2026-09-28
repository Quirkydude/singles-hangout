"use client";

import { EvaluationWizard } from "@/components/EvaluationWizard";
import {
  FieldError,
  inputClass,
  labelClass,
} from "@/components/EvaluationFields";
import {
  initialPanelFeedbackState,
  type FieldErrors,
} from "@/lib/form-state";
import {
  PANEL_FEEDBACK_SECTIONS,
  panelQuestionTagFor,
} from "@/lib/panel-feedback-questions";
import { submitPanelFeedbackAction } from "./actions";

/** The name is the only thing we ask before the questions. */
function identityErrors(values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};

  if ((values.panelistName ?? "").trim().length < 2) {
    errors.panelistName = "Please enter your name.";
  }

  return errors;
}

/**
 * The panelists' evaluation form: six steps, one section each, on the same
 * wizard the participants' form uses. The questions come from
 * `panel-feedback-questions.ts`, which the validator, the admin dashboard and
 * the CSV export read as well.
 */
export default function PanelFeedbackForm() {
  return (
    <EvaluationWizard
      action={submitPanelFeedbackAction}
      sections={PANEL_FEEDBACK_SECTIONS}
      initialState={initialPanelFeedbackState}
      identityErrors={identityErrors}
      tagFor={panelQuestionTagFor}
      idPrefix="panel-feedback"
      progressLabel="Panel evaluation progress"
      submitLabel="Send my evaluation"
      renderIdentity={({ values, errors, updateValue }) => (
        <div>
          <label className={labelClass} htmlFor="panelistName">
            Panelist name
          </label>
          <input
            id="panelistName"
            name="panelistName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Kofi Mensah"
            value={values.panelistName ?? ""}
            onChange={(event) => updateValue("panelistName", event.target.value)}
            aria-invalid={errors.panelistName ? true : undefined}
            aria-describedby={
              errors.panelistName ? "panelistName-error" : "panelistName-help"
            }
            className={`mt-1.5 ${inputClass}`}
          />
          <p id="panelistName-help" className="mt-1.5 text-xs text-ink-muted">
            Please type your name the same way each time: one evaluation per
            panelist, and a second submission replaces the first.
          </p>
          <FieldError id="panelistName-error" message={errors.panelistName} />
        </div>
      )}
    />
  );
}
