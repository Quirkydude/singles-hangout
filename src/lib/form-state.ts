/**
 * Shared form state types and their initial values.
 *
 * These live outside the `"use server"` action files on purpose: a
 * `"use server"` module may only export async functions, so exporting a
 * plain object (like an initial state) from one fails the build.
 */

export type FieldErrors = Partial<Record<string, string>>;

// --- Registration form ------------------------------------------------------

export type FormState = {
  status: "idle" | "error" | "ineligible" | "full" | "closed" | "removed";
  message?: string;
  fieldErrors?: FieldErrors;
  /** Echoed back so a failed submit does not wipe what the user typed. */
  values?: Record<string, string>;
  /** Which step to show after a failed submit, so errors are visible. */
  step?: number;
};

export const initialFormState: FormState = { status: "idle" };

// --- Find my ticket ---------------------------------------------------------

export type FindState = {
  status: "idle" | "error" | "notfound";
  message?: string;
};

export const initialFindState: FindState = { status: "idle" };

// --- Admin ------------------------------------------------------------------

export type AdminActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialAdminState: AdminActionState = { status: "idle" };
