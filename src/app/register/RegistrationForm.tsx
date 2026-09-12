"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { registerAction } from "./actions";
import { initialFormState, type FormState } from "@/lib/form-state";
import { EVENT } from "@/lib/event";
import {
  AFFILIATION_OPTIONS,
  FACILITATOR_OPTIONS,
  ROLE_OPTIONS,
  type AffiliationValue,
  type FacilitatorValue,
  type RoleValue,
} from "@/lib/registration-options";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand-red disabled:opacity-60";

const labelClass = "block text-sm font-semibold text-ink";

const STEP_TITLES = [
  "Personal info",
  "Your part",
  "Where you fellowship",
  "Your role",
] as const;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-brand-red">
      {message}
    </p>
  );
}

/** A large tappable radio card, used for all the choice steps. */
function ChoiceCards({
  name,
  options,
  value,
  onChange,
  disabled,
  errorId,
  error,
  columns = 2,
}: {
  name: string;
  options: Array<{ value: string; label: string; hint?: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
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
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-xl border-2 px-4 py-3.5 text-sm transition-colors ${
                selected
                  ? "border-brand-red bg-brand-red/5"
                  : "border-line hover:border-ink/30"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange(option.value)}
                  disabled={disabled}
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
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 font-display text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
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
          Sending your code...
        </>
      ) : (
        label
      )}
    </button>
  );
}

const BLOCKING_STATUSES: Array<FormState["status"]> = [
  "ineligible",
  "full",
  "closed",
];

export function RegistrationForm({ spotsLeft }: { spotsLeft: number }) {
  const [state, formAction] = useActionState(registerAction, initialFormState);
  const values = state.values ?? {};
  const isBlocked = BLOCKING_STATUSES.includes(state.status);

  const [step, setStep] = useState(1);

  // Local mirror of the answers so the branching reacts immediately, without
  // a round trip. The inputs themselves stay uncontrolled and the whole form
  // is submitted in one request via the hidden fields below.
  const [isFacilitator, setIsFacilitator] = useState<FacilitatorValue | "">(
    (values.isFacilitator as FacilitatorValue) ?? "",
  );
  const [affiliation, setAffiliation] = useState<AffiliationValue | "">(
    (values.affiliation as AffiliationValue) ?? "",
  );
  const [role, setRole] = useState<RoleValue | "">(
    (values.role as RoleValue) ?? "",
  );

  // A server error must land on the step that owns the problem, otherwise the
  // message would be invisible. This is React's "adjust state when something
  // changes" pattern: it runs during render and re-renders immediately, which
  // avoids the cascading render an effect would cause.
  const [handledState, setHandledState] = useState<FormState>(state);
  if (state !== handledState) {
    setHandledState(state);
    if (isBlocked) {
      setStep(1);
    } else if (state.status === "error" && state.step) {
      setStep(state.step);
    }
  }

  const topRef = useRef<HTMLDivElement>(null);

  const attendsCop = affiliation === "habitat" || affiliation === "cop_other";
  const needsAffiliationStep = isFacilitator === "no";
  const needsRoleStep = needsAffiliationStep && attendsCop;

  /**
   * The last step that applies to this person. Until they answer step 2 we
   * assume the longest path so the progress bar does not jump around.
   *   - facilitator            -> 2 (skips affiliation and role)
   *   - non-COP attendee       -> 3 (skips role)
   *   - COP attendee           -> 4
   */
  const lastStep =
    isFacilitator === ""
      ? 4
      : !needsAffiliationStep
        ? 2
        : needsRoleStep
          ? 4
          : 3;

  const isFinalStep = step === lastStep;

  function goTo(next: number) {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    goTo(Math.min(step + 1, lastStep));
  }

  function back() {
    goTo(Math.max(1, step - 1));
  }

  // Client-side gating so Continue cannot advance past an unanswered step.
  // Step 1 relies on the native `required` attributes. The server validates
  // everything again regardless.
  const canAdvance = (() => {
    if (step === 1) return true;
    if (step === 2) return isFacilitator !== "";
    if (step === 3) return affiliation !== "";
    if (step === 4) return role !== "";
    return true;
  })();

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div ref={topRef} />

      {/* Hidden fields carry every answer through the single submit. */}
      <input type="hidden" name="isFacilitator" value={isFacilitator} />
      {needsAffiliationStep ? (
        <input type="hidden" name="affiliation" value={affiliation} />
      ) : null}
      {needsRoleStep ? <input type="hidden" name="role" value={role} /> : null}

      {state.message ? (
        <div
          role="alert"
          className={
            state.status === "error"
              ? "rounded-xl border border-brand-red/25 bg-brand-red/5 px-4 py-3 text-sm font-medium text-brand-red-dark"
              : "rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm font-medium text-ink"
          }
        >
          {state.message}
        </div>
      ) : null}

      {isBlocked ? (
        <p className="text-center text-sm">
          <Link href="/" className="font-semibold text-brand-red hover:underline">
            Back to event details
          </Link>
        </p>
      ) : (
        <>
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-[0.68rem] font-bold uppercase tracking-[0.14em]">
              <span className="text-brand-red">
                Step {step} of {lastStep}
              </span>
              <span className="text-ink-muted">{STEP_TITLES[step - 1]}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-brand-red transition-all duration-300"
                style={{ width: `${(step / lastStep) * 100}%` }}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* Step 1 - personal info                                        */}
          {/* ============================================================ */}
          <div className={step === 1 ? "space-y-5" : "hidden"}>
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Ama Mensah"
                defaultValue={values.fullName ?? ""}
                aria-invalid={Boolean(state.fieldErrors?.fullName)}
                aria-describedby="fullName-error"
                className={`mt-1.5 ${inputClass}`}
              />
              <FieldError
                id="fullName-error"
                message={state.fieldErrors?.fullName}
              />
            </div>

            <div>
              <label htmlFor="location" className={labelClass}>
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                placeholder="e.g. Foso, Asin"
                defaultValue={values.location ?? ""}
                aria-invalid={Boolean(state.fieldErrors?.location)}
                aria-describedby="location-error"
                className={`mt-1.5 ${inputClass}`}
              />
              <FieldError
                id="location-error"
                message={state.fieldErrors?.location}
              />
              <p className="mt-1.5 text-xs text-ink-muted">
                The town or area you are coming from.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="024 123 4567"
                  defaultValue={values.phone ?? ""}
                  aria-invalid={Boolean(state.fieldErrors?.phone)}
                  aria-describedby="phone-help phone-error"
                  className={`mt-1.5 ${inputClass}`}
                />
                <p id="phone-help" className="mt-1.5 text-xs text-ink-muted">
                  Your registration code is sent to this number by SMS.
                </p>
                <FieldError id="phone-error" message={state.fieldErrors?.phone} />
              </div>

              <div>
                <label htmlFor="age" className={labelClass}>
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  min={1}
                  max={120}
                  inputMode="numeric"
                  placeholder={`${EVENT.minAge} or above`}
                  defaultValue={values.age ?? ""}
                  aria-invalid={Boolean(state.fieldErrors?.age)}
                  aria-describedby="age-help age-error"
                  className={`mt-1.5 ${inputClass}`}
                />
                <p id="age-help" className="mt-1.5 text-xs text-ink-muted">
                  Strictly {EVENT.minAge}+ for this event.
                </p>
                <FieldError id="age-error" message={state.fieldErrors?.age} />
              </div>
            </div>

            <div>
              <label htmlFor="gender" className={labelClass}>
                Gender{" "}
                <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue={values.gender ?? "unspecified"}
                className={`mt-1.5 ${inputClass}`}
              >
                <option value="unspecified">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label htmlFor="panelQuestion" className={labelClass}>
                A question for the panel{" "}
                <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <textarea
                id="panelQuestion"
                name="panelQuestion"
                rows={3}
                maxLength={400}
                placeholder="Anything you would like the panel to talk about?"
                defaultValue={values.panelQuestion ?? ""}
                aria-invalid={Boolean(state.fieldErrors?.panelQuestion)}
                aria-describedby="panelQuestion-error"
                className={`mt-1.5 resize-y ${inputClass}`}
              />
              <FieldError
                id="panelQuestion-error"
                message={state.fieldErrors?.panelQuestion}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* Step 2 - facilitator                                          */}
          {/* ============================================================ */}
          <div className={step === 2 ? "" : "hidden"}>
            <p className={labelClass}>Are you facilitating this event?</p>
            <p className="mt-1 text-xs text-ink-muted">
              Facilitators help run the afternoon, so they skip the next
              question.
            </p>
            <ChoiceCards
              name="isFacilitatorChoice"
              options={FACILITATOR_OPTIONS}
              value={isFacilitator}
              onChange={(value) => {
                const picked = value as FacilitatorValue;
                setIsFacilitator(picked);
                if (picked === "yes") {
                  // Facilitators are never asked these.
                  setAffiliation("");
                  setRole("");
                }
              }}
              errorId="isFacilitator-error"
              error={state.fieldErrors?.isFacilitator}
            />
          </div>

          {/* ============================================================ */}
          {/* Step 3 - affiliation (skipped by facilitators)                */}
          {/* ============================================================ */}
          <div className={step === 3 ? "" : "hidden"}>
            <p className={labelClass}>Where do you fellowship?</p>
            <p className="mt-1 text-xs text-ink-muted">
              This helps us plan the seating and the protocol team.
            </p>
            <ChoiceCards
              name="affiliationChoice"
              options={AFFILIATION_OPTIONS}
              value={affiliation}
              onChange={(value) => {
                const picked = value as AffiliationValue;
                setAffiliation(picked);
                if (picked === "non_cop") setRole("");
              }}
              errorId="affiliation-error"
              error={state.fieldErrors?.affiliation}
            />
          </div>

          {/* ============================================================ */}
          {/* Step 4 - role (COP attendees only)                            */}
          {/* ============================================================ */}
          <div className={step === 4 ? "" : "hidden"}>
            <p className={labelClass}>What is your role?</p>
            <p className="mt-1 text-xs text-ink-muted">
              Choose how you are taking part on the day.
            </p>
            <ChoiceCards
              name="roleChoice"
              options={ROLE_OPTIONS}
              value={role}
              onChange={(value) => setRole(value as RoleValue)}
              errorId="role-error"
              error={state.fieldErrors?.role}
              columns={1}
            />
          </div>

          {/* ============================================================ */}
          {/* Navigation                                                    */}
          {/* ============================================================ */}
          <div className="flex items-center gap-3 pt-1">
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                className="rounded-full border border-line px-6 py-3.5 font-semibold text-ink transition-colors hover:border-ink/40"
              >
                Back
              </button>
            ) : null}

            <div className="flex-1">
              {isFinalStep ? (
                <SubmitButton
                  label="Complete registration"
                  disabled={!canAdvance}
                />
              ) : (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canAdvance}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-red px-8 py-4 font-display text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-ink-muted">
            {spotsLeft > 0 ? `${spotsLeft} spots left. ` : ""}
            By registering you agree to receive an SMS with your registration
            code.
          </p>
        </>
      )}
    </form>
  );
}
