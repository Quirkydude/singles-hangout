"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { findTicketAction } from "./actions";
import { initialFindState } from "@/lib/form-state";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand-red";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-brand-red px-6 py-3.5 font-display font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark disabled:opacity-70"
    >
      {pending ? "Looking..." : "Find my ticket"}
    </button>
  );
}

export function FindTicketForm() {
  const [state, formAction] = useActionState(findTicketAction, initialFindState);

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div
          role="alert"
          className="rounded-xl border border-brand-red/25 bg-brand-red/5 px-4 py-3 text-sm font-medium text-brand-red-dark"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-ink">
          Registration code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          placeholder="SH26-XXXXX"
          autoCapitalize="characters"
          className={`mt-1.5 uppercase ${inputClass}`}
        />
      </div>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-ink">
          Phone number you registered with
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="024 123 4567"
          className={`mt-1.5 ${inputClass}`}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
