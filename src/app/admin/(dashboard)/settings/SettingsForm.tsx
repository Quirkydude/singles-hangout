"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateSettingsAction } from "../../actions";
import { initialAdminState } from "@/lib/form-state";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save settings"}
    </button>
  );
}

export function SettingsForm({
  capacity,
  registrationOpen,
}: {
  capacity: number;
  registrationOpen: boolean;
}) {
  const [state, formAction] = useActionState(
    updateSettingsAction,
    initialAdminState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div
          role="alert"
          className={
            state.status === "success"
              ? "rounded-xl border border-green-600/25 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
              : "rounded-xl border border-brand-red/25 bg-brand-red/5 px-4 py-3 text-sm font-medium text-brand-red-dark"
          }
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="capacity" className="block text-sm font-semibold text-ink">
          Capacity
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          required
          defaultValue={capacity}
          className="mt-1.5 w-full max-w-xs rounded-xl border border-line bg-white px-4 py-2.5 text-base outline-none focus:border-brand-red"
        />
        <p className="mt-1.5 text-xs text-ink-muted">
          Total number of registrations allowed. Registration closes
          automatically once this is reached.
        </p>
      </div>

      <div>
        <label
          htmlFor="registrationOpen"
          className="block text-sm font-semibold text-ink"
        >
          Registration
        </label>
        <select
          id="registrationOpen"
          name="registrationOpen"
          defaultValue={String(registrationOpen)}
          className="mt-1.5 w-full max-w-xs rounded-xl border border-line bg-white px-4 py-2.5 text-base outline-none focus:border-brand-red"
        >
          <option value="true">Open - accept registrations</option>
          <option value="false">Closed - do not accept registrations</option>
        </select>
      </div>

      <SaveButton />
    </form>
  );
}
