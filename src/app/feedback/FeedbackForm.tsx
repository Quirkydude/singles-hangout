"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitFeedbackAction } from "./actions";
import { initialFeedbackState, type FieldErrors } from "@/lib/form-state";
import { normalizeGhanaPhone } from "@/lib/phone";
import {
  AGREE_SCALE,
  FEEDBACK_SECTIONS,
  RATING_WORDS,
  SCORE_VALUES,
  STAR_VALUES,
  questionTagFor,
  type ChoiceOption,
  type FeedbackQuestion,
  type FeedbackSection,
} from "@/lib/feedback-questions";

/**
 * The sections as the plain, loose type: it keeps the optional `intro` and the
 * question list easy to iterate over, while `FEEDBACK_SECTIONS` stays the
 * single source of truth for the questions themselves.
 */
const SECTIONS: readonly FeedbackSection[] = FEEDBACK_SECTIONS;

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand-red";

const labelClass = "block text-sm font-semibold text-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-brand-red">
      {message}
    </p>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="currentColor">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" />
    </svg>
  );
}

function SubmitButton({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 font-display text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 0 1 8-8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          Sending...
        </>
      ) : (
        label
      )}
    </button>
  );
}

/** A large tappable radio card, used for the Yes / No and age range answers. */
function ChoiceCards({
  name,
  options,
  value,
  onChange,
  errorId,
  error,
  columns = 2,
}: {
  name: string;
  options: readonly ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  errorId: string;
  error?: string;
  columns?: 1 | 2;
}) {
  return (
    <>
      <div
        className={`mt-2 grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}
      >
        {options.map((option) => {
          const optionValue = String(option.value);
          const selected = value === optionValue;
          return (
            <label
              key={optionValue}
              className={`flex cursor-pointer flex-col rounded-xl border-2 px-4 py-3.5 text-sm transition-colors ${
                selected
                  ? "border-brand-red bg-brand-red/5"
                  : "border-line hover:border-ink/30"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={name}
                  value={optionValue}
                  checked={selected}
                  onChange={() => onChange(optionValue)}
                  className="h-4 w-4 shrink-0 accent-[var(--color-brand-red)]"
                  aria-describedby={error ? errorId : undefined}
                />
                <span className="font-semibold text-ink">{option.label}</span>
              </span>
              {option.hint ? (
                <span className="mt-1 pl-7 text-xs text-ink-muted">
                  {option.hint}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </>
  );
}


/** 5-star rating: one tap per answer, stored as a number for easy analysis. */
function StarRow({
  name,
  value,
  onChange,
  lowLabel,
  highLabel,
  errorId,
  error,
  groupLabel,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  lowLabel: string;
  highLabel: string;
  errorId: string;
  error?: string;
  groupLabel: string;
}) {
  const chosen = value === "" ? 0 : Number(value);

  return (
    <>
      <div
        role="radiogroup"
        aria-label={groupLabel}
        className="mt-2 flex items-center gap-1.5"
      >
        {STAR_VALUES.map((star) => {
          const filled = star <= chosen;
          return (
            <label key={star} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={star}
                checked={chosen === star}
                onChange={() => onChange(String(star))}
                className="peer sr-only"
                aria-label={`${star} out of 5`}
                aria-describedby={error ? errorId : undefined}
              />
              <span
                className={`grid h-11 w-11 place-items-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2 ${
                  filled
                    ? "border-brand-red bg-brand-red/5 text-brand-red"
                    : "border-line text-ink-muted/40 hover:border-ink/30"
                }`}
              >
                <StarIcon />
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3 text-xs text-ink-muted">
        <span>{lowLabel}</span>
        <span className={`text-center font-semibold ${chosen ? "text-brand-red" : ""}`}>
          {chosen ? `${chosen} / 5` : "Tap a star"}
        </span>
        <span className="text-right">{highLabel}</span>
      </div>
      <FieldError id={errorId} message={error} />
    </>
  );
}

/**
 * A numbered scale: 1-5 for the agree/disagree statements and the
 * Poor -> Excellent question, 1-10 for "how likely are you to recommend".
 * The chosen word is spelled out underneath, so nobody has to guess.
 */
function NumberRow({
  name,
  value,
  onChange,
  options,
  legend,
  lowLabel,
  highLabel,
  errorId,
  error,
  groupLabel,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: number | string; label: string }[];
  legend?: string;
  lowLabel?: string;
  highLabel?: string;
  errorId: string;
  error?: string;
  groupLabel: string;
}) {
  const chosen = options.find((option) => String(option.value) === value);

  return (
    <>
      <div
        role="radiogroup"
        aria-label={groupLabel}
        className="mt-2 grid grid-cols-5 gap-1.5"
      >
        {options.map((option) => {
          const optionValue = String(option.value);
          const selected = value === optionValue;
          return (
            <label key={optionValue} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={selected}
                onChange={() => onChange(optionValue)}
                className="peer sr-only"
                aria-label={option.label || optionValue}
                aria-describedby={error ? errorId : undefined}
              />
              <span
                className={`grid h-11 place-items-center rounded-lg border-2 font-display text-base font-bold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2 ${
                  selected
                    ? "border-brand-red bg-brand-red text-white"
                    : "border-line text-ink hover:border-ink/30"
                }`}
              >
                {optionValue}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3 text-xs text-ink-muted">
        <span>{lowLabel}</span>
        <span className={`text-center font-semibold ${chosen ? "text-brand-red" : ""}`}>
          {chosen
            ? chosen.label
              ? `${chosen.value} - ${chosen.label}`
              : `You chose ${chosen.value}`
            : "Tap a number"}
        </span>
        <span className="text-right">{highLabel}</span>
      </div>
      {legend ? (
        <p className="mt-1 text-[0.7rem] text-ink-muted">{legend}</p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </>
  );
}

/**
 * One question, rendered with the control its `kind` calls for, plus its own
 * error message. Question numbers match the printed form.
 */
function QuestionBlock({
  question,
  value,
  onChange,
  error,
}: {
  question: FeedbackQuestion;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const errorId = `${question.id}-error`;
  const options = question.kind === "choice" ? question.options : undefined;
  const numericChoice =
    options !== undefined &&
    options.every((option) => typeof option.value === "number");

  return (
    <div className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <p className={labelClass}>
        <span className="mr-1.5 font-display text-xs font-bold text-brand-red">
          {questionTagFor(question.id)}
        </span>
        {question.label}
        {question.kind === "text" && !question.required ? (
          <span className="ml-1.5 font-normal text-ink-muted">(optional)</span>
        ) : null}
      </p>
      {question.help ? (
        <p className="mt-1 text-xs text-ink-muted">{question.help}</p>
      ) : null}

      {question.kind === "stars" ? (
        <StarRow
          name={question.id}
          value={value}
          onChange={onChange}
          groupLabel={question.label}
          lowLabel={question.lowLabel}
          highLabel={question.highLabel}
          errorId={errorId}
          error={error}
        />
      ) : null}

      {question.kind === "agree" ? (
        <NumberRow
          name={question.id}
          value={value}
          onChange={onChange}
          groupLabel={question.label}
          options={AGREE_SCALE}
          lowLabel={AGREE_SCALE[0].label}
          highLabel={AGREE_SCALE[AGREE_SCALE.length - 1].label}
          errorId={errorId}
          error={error}
        />
      ) : null}

      {question.kind === "scale10" ? (
        <NumberRow
          name={question.id}
          value={value}
          onChange={onChange}
          groupLabel={question.label}
          options={SCORE_VALUES.map((score) => ({ value: score, label: "" }))}
          lowLabel={question.lowLabel}
          highLabel={question.highLabel}
          legend="10 means you would definitely recommend us."
          errorId={errorId}
          error={error}
        />
      ) : null}

      {numericChoice && options ? (
        <NumberRow
          name={question.id}
          value={value}
          onChange={onChange}
          groupLabel={question.label}
          options={options}
          lowLabel={RATING_WORDS[0]}
          highLabel={RATING_WORDS[RATING_WORDS.length - 1]}
          errorId={errorId}
          error={error}
        />
      ) : null}

      {question.kind === "choice" && !numericChoice ? (
        <ChoiceCards
          name={question.id}
          value={value}
          onChange={onChange}
          options={question.options}
          columns={question.options.length % 2 === 0 ? 2 : 1}
          errorId={errorId}
          error={error}
        />
      ) : null}

      {question.kind === "text" ? (
        <>
          {question.multiline ? (
            <textarea
              id={question.id}
              name={question.id}
              rows={3}
              maxLength={question.maxLength}
              placeholder={question.placeholder}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={`mt-2 resize-y ${inputClass}`}
            />
          ) : (
            <input
              id={question.id}
              name={question.id}
              type="text"
              maxLength={question.maxLength}
              placeholder={question.placeholder}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={`mt-2 ${inputClass}`}
            />
          )}
          <FieldError id={errorId} message={error} />
        </>
      ) : null}
    </div>
  );
}


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
 * Checks one step before moving on, so nobody is sent forward with an empty
 * answer they would only discover at the very end. Step 1 carries the identity
 * fields as well as section A, so both are checked together. The server
 * re-checks everything; this is about kindness, not security.
 */
function validateStep(
  stepIndex: number,
  values: Record<string, string>,
): FieldErrors {
  const section = SECTIONS[stepIndex];
  if (!section) return {};

  const errors: FieldErrors = stepIndex === 0 ? identityErrors(values) : {};

  for (const question of section.questions) {
    const answered = (values[question.id] ?? "").trim() !== "";
    if (answered) continue;
    if (question.kind === "text" && !question.required) continue;
    errors[question.id] = "Please answer this question.";
  }

  return errors;
}

/**
 * The evaluation form itself: seven short steps, one section each, sized for a
 * phone screen. Nothing is submitted until the last step, and every step stays
 * in the DOM (hidden) so the server receives the complete answer sheet.
 */
export default function FeedbackForm({
  prefill,
}: {
  prefill: FeedbackPrefill;
}) {
  const [state, formAction] = useActionState(
    submitFeedbackAction,
    initialFeedbackState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<string, string>>(() => ({
    fullName: prefill.fullName,
    phone: prefill.phone,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});

  const totalSteps = SECTIONS.length;

  // The server gets the last word: when it rejects an answer it also tells us
  // which step to show, so a highlighted field is never hidden behind a step.
  useEffect(() => {
    if (state.status !== "error") return;
    setErrors(state.fieldErrors ?? {});
    if (state.step) setStep(Math.min(Math.max(state.step, 1), totalSteps));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state, totalSteps]);

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

  const currentSection = SECTIONS[step - 1];

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
        aria-label="Evaluation progress"
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
        {SECTIONS.map((section, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === step;

          return (
            <section
              key={section.letter}
              hidden={!active}
              aria-labelledby={`feedback-section-${section.letter}`}
              className="space-y-7"
            >
              <div>
                <h3
                  id={`feedback-section-${section.letter}`}
                  className="font-display text-lg font-bold text-ink"
                >
                  Section {section.letter} &middot; {section.title}
                </h3>
                {section.intro ? (
                  <p className="mt-1 text-sm text-ink-muted">{section.intro}</p>
                ) : null}
              </div>

              {index === 0 ? (
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
                      onChange={(event) =>
                        updateValue("fullName", event.target.value)
                      }
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
                      onChange={(event) =>
                        updateValue("phone", event.target.value)
                      }
                      aria-invalid={errors.phone ? true : undefined}
                      aria-describedby={
                        errors.phone ? "phone-error" : "phone-help"
                      }
                      className={`mt-1.5 ${inputClass}`}
                    />
                    <p id="phone-help" className="mt-1.5 text-xs text-ink-muted">
                      MTN, Telecel or AirtelTigo. We use it to tell your
                      response apart and to send your thank-you message, so it
                      is one evaluation per number.
                    </p>
                    <FieldError id="phone-error" message={errors.phone} />
                  </div>
                </div>
              ) : null}

              {section.questions.map((question) => (
                <QuestionBlock
                  key={question.id}
                  question={question}
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
          <SubmitButton label="Send my evaluation" />
        )}
      </div>
    </form>
  );
}
