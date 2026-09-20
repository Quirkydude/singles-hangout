import { z } from "zod";
import { EVENT } from "@/lib/event";
import { normalizeGhanaPhone } from "@/lib/phone";
import { AFFILIATION_VALUES, ROLE_VALUES } from "@/lib/registration-options";

const MAX_AGE = 120;

export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Please enter your full name.")
      .max(120, "That name is too long."),
    location: z
      .string()
      .trim()
      .min(2, "Please tell us where you are coming from.")
      .max(120, "That location is too long."),
    phone: z
      .string()
      .trim()
      .min(1, "Please enter your phone number.")
      .refine((value) => normalizeGhanaPhone(value) !== null, {
        message: "Enter a valid Ghanaian mobile number, e.g. 024 123 4567.",
      }),
    age: z.coerce
      .number({ message: "Please enter your age." })
      .int("Age must be a whole number.")
      .min(1, "Please enter your age.")
      .max(MAX_AGE, "Please enter a valid age."),
    gender: z.enum(["male", "female", "unspecified"]).default("unspecified"),
    panelQuestion: z
      .string()
      .trim()
      .max(400, "Please keep your question under 400 characters.")
      .optional()
      .or(z.literal("")),

    // Step 2 - always asked.
    isFacilitator: z.enum(["yes", "no"], {
      message: "Please let us know if you are facilitating.",
    }),

    // Step 3 - only asked when the answer above is "no". Facilitators are
    // recorded as organizers and skip this entirely.
    affiliation: z
      .enum(AFFILIATION_VALUES, {
        message: "Please tell us where you fellowship.",
      })
      .optional()
      .or(z.literal("")),
    role: z
      .enum(ROLE_VALUES, { message: "Please choose your role." })
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.isFacilitator === "yes") return;

    // Not a facilitator, so we must know where they fellowship.
    if (!data.affiliation) {
      ctx.addIssue({
        code: "custom",
        path: ["affiliation"],
        message: "Please tell us where you fellowship.",
      });
      return;
    }

    // Only COP attendees are asked for a role. Non-COP guests are recorded
    // as participants automatically.
    const attendsCop =
      data.affiliation === "habitat" || data.affiliation === "cop_other";
    if (attendsCop && !data.role) {
      ctx.addIssue({
        code: "custom",
        path: ["role"],
        message: "Please choose your role.",
      });
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

/** Field-level errors keyed by form field name. */
export type FieldErrors = Partial<Record<string, string>>;

export function isEligibleAge(age: number): boolean {
  return Number.isFinite(age) && age >= EVENT.minAge && age <= MAX_AGE;
}

/**
 * The message shown when a removed person tries to register, or when their
 * old code is looked up. Intentionally neutral and non-accusatory.
 */
export const REMOVED_MESSAGE =
  "We were unable to confirm a place for this registration, so the code is no longer valid. Please speak to a Youth Ministry leader.";

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Enter the admin password."),
});
