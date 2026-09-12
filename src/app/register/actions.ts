"use server";

import { redirect } from "next/navigation";
import { registrationSchema } from "@/lib/validation";
import { normalizeGhanaPhone } from "@/lib/phone";
import { registerAttendee } from "@/lib/registration";
import { EVENT } from "@/lib/event";
import {
  resolveAffiliation,
  resolveRole,
  type AffiliationValue,
  type RoleValue,
} from "@/lib/registration-options";
import type { FieldErrors, FormState } from "@/lib/form-state";

/** Maps a field name to the step that owns it, for error routing. */
function stepForField(field: string | undefined): number {
  switch (field) {
    case "isFacilitator":
      return 2;
    case "affiliation":
      return 3;
    case "role":
      return 4;
    default:
      return 1;
  }
}

function rawValues(formData: FormData): Record<string, string> {
  const keys = [
    "fullName",
    "location",
    "phone",
    "age",
    "gender",
    "panelQuestion",
    "isFacilitator",
    "affiliation",
    "role",
  ];
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string" && value !== "") values[key] = value;
  }
  return values;
}

export async function registerAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = rawValues(formData);

  const parsed = registrationSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    // Send the user back to the step that owns the first invalid field,
    // otherwise the error would be invisible on a later step.
    const step = stepForField(Object.keys(fieldErrors)[0]);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      values,
      step,
    };
  }

  const data = parsed.data;
  const phone = normalizeGhanaPhone(data.phone);

  if (!phone) {
    return {
      status: "error",
      message: "Please enter a valid Ghanaian mobile number.",
      fieldErrors: { phone: "Enter a valid Ghanaian mobile number." },
      values,
    };
  }

  // Age gate: checked again on the server, never trust the browser.
  if (data.age < EVENT.minAge) {
    return {
      status: "ineligible",
      message: `This event is strictly for singles aged ${EVENT.minAge} and above. We hope to see you at a future edition.`,
      fieldErrors: { age: `You must be ${EVENT.minAge} or older to register.` },
      values,
    };
  }

  const isFacilitator = data.isFacilitator === "yes";
  const affiliation = (data.affiliation || undefined) as
    | AffiliationValue
    | undefined;
  const roleInput = (data.role || undefined) as RoleValue | undefined;

  const result = await registerAttendee({
    fullName: data.fullName,
    location: data.location,
    isFacilitator,
    affiliation: resolveAffiliation(isFacilitator, affiliation),
    role: resolveRole(isFacilitator, affiliation, roleInput),
    phone,
    age: data.age,
    gender: data.gender,
    panelQuestion: data.panelQuestion ?? null,
  });

  switch (result.outcome) {
    case "created":
    case "resent":
      redirect(`/ticket/${result.code}?fresh=1`);
    case "ineligible":
      return {
        status: "ineligible",
        message: `This event is strictly for singles aged ${EVENT.minAge} and above.`,
        values,
      };
    case "invalid_phone":
      return {
        status: "error",
        message: "Please enter a valid Ghanaian mobile number.",
        fieldErrors: { phone: "Enter a valid Ghanaian mobile number." },
        values,
      };
    case "full":
      return {
        status: "full",
        message:
          "Registration is now full. Please speak to a Youth Ministry leader about the next edition.",
        values,
      };
    case "closed":
      return {
        status: "closed",
        message: "Registration is currently closed.",
        values,
      };
    default:
      return {
        status: "error",
        message: result.message,
        values,
      };
  }
}
