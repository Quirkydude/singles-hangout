"use client";

import { EvaluationWizard } from "@/components/EvaluationWizard";
import {
  FieldError,
  inputClass,
  labelClass,
} from "@/components/EvaluationFields";
import {
  initialFeedbackState,
  type FieldErrors,
} from "@/lib/form-state";
import { normalizeGhanaPhone } from "@/lib/phone";
import { FEEDBACK_SECTIONS, questionTagFor } from "@/lib/feedback-questions";
import { submitFeedbackAction } from "./actions";

/** Who is filling the form in, prefilled from a ticket code when we have one. */
export type FeedbackPrefill = {
  fullName: string;
  phone: string;
};

function identityErrors(values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};

  if ((values.fullName ?? "").trim().length < 2) {
    errors.fullName = "Please enter your full name.";
  }
  if (normalizeGhanaPhone(values.phone ?? "") === null) {
    errors.phone = "Enter a valid Ghanaian mobile number, e.g. 024 123 4567.";
  }

  return errors;
}

/**
 * The participants' evaluation form: seven short steps, one section each, run
 * on the shared wizard (`components/EvaluationWizard.tsx`). The questions
 * themselves come from `feedback-questions.ts`, which everything else - the
 * validator, the admin dashboard and the CSV export - reads as well.
 */
export default function FeedbackForm({
  prefill,
}: {
  prefill: FeedbackPrefill;
}) {
  return (
    <EvaluationWizard
      action={submitFeedbackAction}
      sections={FEEDBACK_SECTIONS}
      initialValues={{ fullName: prefill.fullName, phone: prefill.phone }}
      initialState={initialFeedbackState}
      identityErrors={identityErrors}
      tagFor={questionTagFor}
      idPrefix="feedback"
      progressLabel="Evaluation progress"
      submitLabel="Send my evaluation"
      renderIdentity={({ values, errors, updateValue }) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={values.fullName ?? ""}
              onChange={(event) => updateValue("fullName", event.target.value)}
              aria-invalid={errors.fullName ? true : undefined}
              aria-describedby={
                errors.fullName ? "fullName-error" : undefined
              }
              className={`mt-1.5 ${inputClass}`}
            />
            <FieldError id="fullName-error" message={errors.fullName} />
          </div>

          <div>
            <label className={labelClass} htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="024 123 4567"
              value={values.phone ?? ""}
              onChange={(event) => updateValue("phone", event.target.value)}
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? "phone-error" : "phone-help"}
              className={`mt-1.5 ${inputClass}`}
            />
            <p id="phone-help" className="mt-1.5 text-xs text-ink-muted">
              MTN, Telecel or AirtelTigo. We use it to tell your response apart
              and to send your thank-you message, so it is one evaluation per
              number.
            </p>
            <FieldError id="phone-error" message={errors.phone} />
          </div>
        </div>
      )}
    />
  );
}
