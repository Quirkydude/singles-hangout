import { z } from "zod";
import { EVENT } from "@/lib/event";
import { normalizeGhanaPhone } from "@/lib/phone";
import { AFFILIATION_VALUES, ROLE_VALUES } from "@/lib/registration-options";
import {
  questionById,
  type FeedbackField,
  type FeedbackQuestionId,
} from "@/lib/feedback-questions";

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

// --- Singles Connect Hangout evaluation form --------------------------------

/**
 * Choice answers are validated against exactly the options the form offers, so
 * an option can never be added to the UI without being accepted here.
 */
function choiceField(id: FeedbackQuestionId): z.ZodTypeAny {
  const question = questionById(id);
  if (question.kind !== "choice") {
    throw new Error(`"${id}" is not a choice question.`);
  }

  const values = question.options.map((option) => option.value);

  // Some choices carry a word (Poor -> Excellent) but are stored as a number.
  if (values.every((value) => typeof value === "number")) {
    const numbers = values as number[];
    return z.coerce
      .number({ message: "Please choose one of the options." })
      .int("Please choose one of the options.")
      .min(Math.min(...numbers), "Please choose one of the options.")
      .max(Math.max(...numbers), "Please choose one of the options.");
  }

  return z.enum(values as [string, ...string[]], {
    message: "Please choose one of the options.",
  });
}

/** Every 5-point scale: the stars, the agree/disagree statements, and Q8. */
function ratingField(): z.ZodTypeAny {
  const message = "Please choose a rating from 1 to 5.";
  return z.coerce
    .number({ message })
    .int(message)
    .min(1, message)
    .max(5, message);
}

/** Question 20 keeps its 1-10 scale. */
function scoreField(): z.ZodTypeAny {
  const message = "Please choose a score from 1 to 10.";
  return z.coerce
    .number({ message })
    .int(message)
    .min(1, message)
    .max(10, message);
}

/** Open text. Required questions must actually say something. */
function textField(id: FeedbackQuestionId): z.ZodTypeAny {
  const question = questionById(id);
  if (question.kind !== "text") {
    throw new Error(`"${id}" is not a text question.`);
  }

  const tooLong = `Please keep your answer under ${question.maxLength} characters.`;
  const base = z
    .string({ message: "Please answer this question." })
    .trim()
    .max(question.maxLength, tooLong);

  if (question.required) {
    return z
      .string({ message: "Please answer this question." })
      .trim()
      .min(1, "Please answer this question.")
      .max(question.maxLength, tooLong);
  }

  // Optional questions arrive as an empty string rather than being missing.
  return base.default("");
}

/**
 * One rule per answer, keyed by `FeedbackField`: TypeScript fails the build if
 * a question is added to `feedback-questions.ts` without a rule here, or if a
 * rule is left behind after a question is removed.
 */
const feedbackFieldSchemas: Record<FeedbackField, z.ZodTypeAny> = {
  // Who is answering. Prefilled from the ticket code when we have one.
  fullName: z
    .string({ message: "Please enter your full name." })
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "That name is too long."),
  phone: z
    .string({ message: "Please enter your phone number." })
    .trim()
    .min(1, "Please enter your phone number.")
    .refine((value) => normalizeGhanaPhone(value) !== null, {
      message: "Enter a valid Ghanaian mobile number, e.g. 024 123 4567.",
    }),

  // Section A - general information
  ageRange: choiceField("ageRange"),
  firstTime: choiceField("firstTime"),

  // Section B - program content
  programRating: ratingField(),
  engaging: ratingField(),
  topicsRelevance: ratingField(),
  favouritePart: textField("favouritePart"),
  nextTopic: textField("nextTopic"),

  // Section C - facilitators / speakers
  facilitatorRating: choiceField("facilitatorRating"),
  facilitatorFriendly: ratingField(),
  facilitatorTiming: ratingField(),

  // Section D - location, date & time
  dateTimeConvenience: ratingField(),
  duration: choiceField("duration"),
  locationRating: ratingField(),

  // Section E - venue & environment
  venueComfort: ratingField(),
  seating: ratingField(),
  soundSetup: ratingField(),

  // Section F - food & refreshment
  foodQuality: ratingField(),
  foodTiming: ratingField(),
  dietarySuggestions: textField("dietarySuggestions"),

  // Section G - overall experience
  recommendScore: scoreField(),
  overallScore: ratingField(),
  enjoyedMost: textField("enjoyedMost"),
  improveNext: textField("improveNext"),
  comments: textField("comments"),
};

/** Every answer the form collects, with the ratings already turned into numbers. */
export type FeedbackAnswers = Record<FeedbackField, string | number>;

/**
 * The evaluation answers as submitted (all strings, straight from FormData),
 * with the ratings coerced to numbers.
 *
 * Widened through `unknown` on purpose: `z.object()` over a dynamically keyed
 * record would otherwise widen every field to `any`, while `FeedbackAnswers`
 * is what the database write relies on. `feedbackFieldSchemas` is the part
 * TypeScript checks field by field.
 */
export const feedbackSchema = z.object(
  feedbackFieldSchemas,
) as unknown as z.ZodType<FeedbackAnswers>;
