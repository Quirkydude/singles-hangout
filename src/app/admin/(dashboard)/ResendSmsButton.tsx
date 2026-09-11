"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resendSmsAction } from "../actions";
import { initialAdminState } from "@/lib/form-state";

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title="Re-send this registration code by SMS"
      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50"
    >
      {pending ? "Sending..." : "Resend SMS"}
    </button>
  );
}

/**
 * Per-row resend control. Each row owns its own action state so one
 * resend cannot clobber another row's feedback.
 */
export function ResendSmsButton({ code }: { code: string }) {
  const [state, formAction] = useActionState(resendSmsAction, initialAdminState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="code" value={code} />
      <ResendButton />
      {state.message ? (
        <span
          className={
            state.status === "success"
              ? "text-[0.68rem] font-medium text-green-700"
              : "text-[0.68rem] font-medium text-brand-red"
          }
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
