"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "../actions";
import { initialAdminState } from "@/lib/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-brand-red px-6 py-3.5 font-display font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark disabled:opacity-70"
    >
      {pending ? "Checking..." : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initialAdminState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {state.message ? (
        <div
          role="alert"
          className="rounded-xl border border-brand-red/25 bg-brand-red/5 px-4 py-3 text-sm font-medium text-brand-red-dark"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-ink">
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-brand-red"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
