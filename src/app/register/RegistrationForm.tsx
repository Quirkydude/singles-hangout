"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { registerAction } from "./actions";
import { initialFormState, type FormState } from "@/lib/form-state";
import { EVENT } from "@/lib/event";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand-red disabled:opacity-60";

const labelClass = "block text-sm font-semibold text-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-brand-red">
      {message}
    </p>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 font-display text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-70"
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
        "Complete registration"
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

  return (
    <form action={formAction} className="space-y-5" noValidate>
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
          disabled={isBlocked}
        />
        <FieldError id="fullName-error" message={state.fieldErrors?.fullName} />
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
          disabled={isBlocked}
        />
        <FieldError id="location-error" message={state.fieldErrors?.location} />
        <p className="mt-1.5 text-xs text-ink-muted">
          The town or area you are coming from.
        </p>
      </div>

      <fieldset disabled={isBlocked}>
        <legend className={labelClass}>Are you a youth at Habitat Assembly?</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[
            { value: "yes", label: "Yes, I am" },
            { value: "no", label: "No, I am not" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-4 py-3 text-sm font-medium transition-colors has-checked:border-brand-red has-checked:bg-brand-red/5"
            >
              <input
                type="radio"
                name="isMember"
                value={option.value}
                required
                defaultChecked={values.isMember === option.value}
                className="h-4 w-4 accent-[var(--color-brand-red)]"
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError id="isMember-error" message={state.fieldErrors?.isMember} />
      </fieldset>

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
            disabled={isBlocked}
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
            disabled={isBlocked}
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
          disabled={isBlocked}
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
          disabled={isBlocked}
        />
        <FieldError
          id="panelQuestion-error"
          message={state.fieldErrors?.panelQuestion}
        />
      </div>

      <div className="pt-1">
        <SubmitButton />
      </div>

      <p className="text-center text-xs text-ink-muted">
        {spotsLeft > 0
          ? `${spotsLeft} spots left. `
          : ""}
        By registering you agree to receive an SMS with your registration code.
      </p>

      {isBlocked ? (
        <p className="text-center text-sm">
          <Link href="/" className="font-semibold text-brand-red hover:underline">
            Back to event details
          </Link>
        </p>
      ) : null}
    </form>
  );
}
