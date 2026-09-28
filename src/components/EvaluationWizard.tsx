"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { QuestionBlock, SubmitButton } from "@/components/EvaluationFields";
import type { EvaluationState, FieldErrors } from "@/lib/form-state";
import type { FeedbackSection } from "@/lib/evaluation-core";

/** Every evaluation form starts from this state (see `form-state.ts`). */
const IDLE_STATE: EvaluationState = { status: "idle" };

/** What the identity slot gets to work with. */
export type IdentityApi = {
  values: Record<string, string>;
  errors: FieldErrors;
  updateValue: (field: string, value: string) => void;
};

export type EvaluationWizardProps = {
  /** The server action that validates and stores the answers. */
  action: (
    state: EvaluationState,
    formData: FormData,
  ) => Promise<EvaluationState>;
  /** Every question, section by section. One step per section. */
  sections: readonly FeedbackSection[];
  /** Answers we already know before the person types (a ticket prefill). */
  initialValues?: Record<string, string>;
  /** The state the form starts from, e.g. `initialPanelFeedbackState`. */
  initialState?: EvaluationState;
  /** Extra step-1 checks for the identity fields above section A. */
  identityErrors?: (values: Record<string, string>) => FieldErrors;
  /** The identity fields, shown above section A on the first step. */
  renderIdentity?: (api: IdentityApi) => ReactNode;
  /** Question numbering used on the printed form, e.g. `questionTagFor`. */
  tagFor: (id: string) => string;
  /** Prefix for the section heading ids, so two forms never clash. */
  idPrefix: string;
  /** Accessible name for the progress bar. */
  progressLabel: string;
  /** Label on the final button. */
  submitLabel: string;
};

/** Keeps a step number inside the form, however it was calculated. */
function clampStep(step: number, totalSteps: number): number {
  return Math.min(Math.max(step, 1), totalSteps);
}

/**
 * The step-by-step evaluation form: one section per step, sized for a phone
 * screen. Nothing is submitted until the last step, and every step stays in
 * the DOM (hidden) so the server receives the complete answer sheet.
 *
 * Both questionnaires run on this component - the participants' form and the
 * panelists' form differ in their questions, their identity fields and the
 * wording on the buttons, not in how the steps work.
 */
export function EvaluationWizard({
  action,
  sections,
  initialValues,
  initialState: startState = IDLE_STATE,
  identityErrors,
  renderIdentity,
  tagFor,
  idPrefix,
  progressLabel,
  submitLabel,
}: EvaluationWizardProps) {
  const [state, formAction] = useActionState(action, startState);
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<string, string>>(
    () => initialValues ?? {},
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const totalSteps = sections.length;

  /**
   * Checks one step before moving on, so nobody is sent forward with an empty
   * answer they would only discover at the very end. Step 1 carries the
   * identity fields as well as section A, so both are checked together. The
   * server re-checks everything; this is about kindness, not security.
   */
  function validateStep(stepIndex: number, current: Record<string, string>) {
    const section = sections[stepIndex];
    if (!section) return {};

    const stepErrors: FieldErrors =
      stepIndex === 0 ? (identityErrors?.(current) ?? {}) : {};

    for (const question of section.questions) {
      const answered = (current[question.id] ?? "").trim() !== "";
      if (answered) continue;
      if (question.kind === "text" && !question.required) continue;
      stepErrors[question.id] = "Please answer this question.";
    }

    return stepErrors;
  }

  /**
   * The server gets the last word: when it rejects an answer it also tells us
   * which step to show, so a highlighted field is never hidden behind a step.
   * A rejection arrives as a brand-new action state, and the documented way to
   * react to new data without an effect is to adjust state during render - the
   * identity check below only fires on the render that follows a reply.
   */
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "error") {
      setErrors(state.fieldErrors ?? {});
      if (state.step) setStep(clampStep(state.step, totalSteps));
    }
  }

  // Scrolling is a real side effect, so it stays in an effect - one that never
  // touches React state.
  useEffect(() => {
    if (state.status !== "error") return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state]);

  function updateValue(field: string, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function goToStep(next: number) {
    setStep(next);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNext() {
    const stepErrors = validateStep(step - 1, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    goToStep(step + 1);
  }

  function handleBack() {
    setErrors({});
    goToStep(step - 1);
  }

  const currentSection = sections[step - 1];

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="scroll-mt-24 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-xs font-bold uppercase tracking-wider text-brand-red">
          Step {step} of {totalSteps}
        </p>
        <p className="text-xs font-semibold text-ink-muted">
          {currentSection.title}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={step}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-brand-red transition-all duration-300"
          style={{ width: `${Math.round((step / totalSteps) * 100)}%` }}
        />
      </div>

      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-brand-red/30 bg-brand-red/5 px-4 py-3 text-sm font-medium text-brand-red"
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-7 space-y-7">
        {sections.map((section, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === step;

          return (
            <section
              key={section.letter}
              hidden={!active}
              aria-labelledby={`${idPrefix}-section-${section.letter}`}
              className="space-y-7"
            >
              <div>
                <h3
                  id={`${idPrefix}-section-${section.letter}`}
                  className="font-display text-lg font-bold text-ink"
                >
                  Section {section.letter} &middot; {section.title}
                </h3>
                {section.intro ? (
                  <p className="mt-1 text-sm text-ink-muted">{section.intro}</p>
                ) : null}
              </div>

              {index === 0 && renderIdentity
                ? renderIdentity({ values, errors, updateValue })
                : null}

              {section.questions.map((question) => (
                <QuestionBlock
                  key={question.id}
                  question={question}
                  tag={tagFor(question.id)}
                  value={values[question.id] ?? ""}
                  onChange={(value) => updateValue(question.id, value)}
                  error={errors[question.id]}
                />
              ))}
            </section>
          );
        })}
      </div>

      <div className="mt-9 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-full border border-line px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:border-ink/40"
          >
            Back
          </button>
        ) : (
          <span className="hidden sm:block" />
        )}

        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-brand-red px-8 py-4 font-display text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark sm:flex-none"
          >
            Continue
          </button>
        ) : (
          <SubmitButton label={submitLabel} />
        )}
      </div>
    </form>
  );
}
