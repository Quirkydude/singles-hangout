/**
 * Singles Connect Hangout - Evaluation Form.
 *
 * Every question, option and scale the evaluation form uses is defined here,
 * so the public form, the server-side validator, the admin dashboard and the
 * CSV export all label things identically (same idea as
 * `registration-options.ts`).
 *
 * The comment above each question carries its number on the printed form, so
 * the organizers can line up a question with its answer during analysis.
 * As requested, questions 4, 11, 13-18 and 21 use a 5-point scale (stars, or
 * Strongly agree -> Strongly disagree) and question 20 keeps its 1-10 scale.
 *
 * Ratings are stored as whole numbers, never as words, so averages and
 * distributions need no clean-up before analysis.
 */

import { EVENT } from "@/lib/event";

export type ChoiceOption = {
  readonly value: string | number;
  readonly label: string;
  readonly hint?: string;
};

/** Every question is one of these shapes. */
export type FeedbackQuestion =
  | {
      readonly kind: "choice";
      readonly id: string;
      readonly label: string;
      readonly help?: string;
      readonly options: readonly ChoiceOption[];
    }
  | {
      readonly kind: "stars";
      readonly id: string;
      readonly label: string;
      readonly help?: string;
      /** Wording for the two ends of the 5-star scale. */
      readonly lowLabel: string;
      readonly highLabel: string;
    }
  | {
      readonly kind: "agree";
      readonly id: string;
      readonly label: string;
      readonly help?: string;
    }
  | {
      readonly kind: "scale10";
      readonly id: string;
      readonly label: string;
      readonly help?: string;
      readonly lowLabel: string;
      readonly highLabel: string;
    }
  | {
      readonly kind: "text";
      readonly id: string;
      readonly label: string;
      readonly help?: string;
      readonly placeholder?: string;
      /** Optional questions may be left blank. */
      readonly required: boolean;
      readonly multiline: boolean;
      readonly maxLength: number;
    };

export type FeedbackSection = {
  readonly letter: string;
  readonly title: string;
  readonly intro?: string;
  readonly questions: readonly FeedbackQuestion[];
};

/** 5-point agree/disagree scale used by the "was / were" statements. */
export const AGREE_SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
] as const;

/** Star ratings always run from 1 (low) to 5 (high). */
export const STAR_VALUES = [1, 2, 3, 4, 5] as const;

/** The 1-10 scale, used by the "how likely are you to recommend" question. */
export const SCORE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Words for the 5-point rating scales, lowest first. */
export const RATING_WORDS = [
  "Poor",
  "Fair",
  "Good",
  "Very Good",
  "Excellent",
] as const;

/** Question 8 keeps the exact wording the organizers used on the form. */
export const FACILITATOR_RATING_OPTIONS: readonly ChoiceOption[] = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Good" },
  { value: 4, label: "Very Good" },
  { value: 5, label: "Excellent" },
];

/**
 * The form itself, section by section. `fullName` and `phone` (asked at the
 * top of step 1) are handled separately from these questions because they are
 * identity, not evaluation - see `IDENTITY_FIELDS`.
 */
export const FEEDBACK_SECTIONS = [
  {
    letter: "A",
    title: "General information",
    intro: "Two quick questions so we can tell how different groups responded.",
    questions: [
      {
        // Q1
        kind: "choice",
        id: "ageRange",
        label: "What is your age range?",
        options: [
          { value: "18-24", label: "18 - 24" },
          { value: "25-30", label: "25 - 30" },
          { value: "31-35", label: "31 - 35" },
          { value: "36+", label: "36 and above" },
        ],
      },
      {
        // Q2
        kind: "choice",
        id: "firstTime",
        label: "Is this your first time attending Singles Connect?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
  {
    letter: "B",
    title: "Program content",
    questions: [
      {
        // Q3
        kind: "stars",
        id: "programRating",
        label: "How would you rate the overall program?",
        lowLabel: "Poor",
        highLabel: "Excellent",
      },
      {
        // Q4 - 5-star rating, as requested.
        kind: "stars",
        id: "engaging",
        label: "Was the program engaging and interactive?",
        lowLabel: "Not at all",
        highLabel: "Very engaging",
      },
      {
        // Q5
        kind: "stars",
        id: "topicsRelevance",
        label: "How relevant were the topics discussed to you as a single?",
        lowLabel: "Not relevant",
        highLabel: "Very relevant",
      },
      {
        // Q6
        kind: "text",
        id: "favouritePart",
        label: "What was your favourite part of the program?",
        placeholder: "e.g. the panel discussion",
        required: true,
        multiline: true,
        maxLength: 600,
      },
      {
        // Q7
        kind: "text",
        id: "nextTopic",
        label: "What topic would you want us to discuss next time?",
        placeholder: "e.g. handling pressure from family",
        required: true,
        multiline: true,
        maxLength: 600,
      },
    ],
  },
  {
    letter: "C",
    title: "Facilitators / speakers",
    questions: [
      {
        // Q8 - keeps the Poor -> Excellent wording from the printed form.
        kind: "choice",
        id: "facilitatorRating",
        label: "How would you rate the facilitators' knowledge and delivery?",
        options: FACILITATOR_RATING_OPTIONS,
      },
      {
        // Q9 - Likert scale, as requested.
        kind: "agree",
        id: "facilitatorFriendly",
        label:
          "The facilitators were friendly, approachable and open to questions.",
      },
      {
        // Q10 - Likert scale, as requested.
        kind: "agree",
        id: "facilitatorTiming",
        label: "The facilitators managed time well.",
      },
    ],
  },
  {
    letter: "D",
    title: "Location, date & time",
    questions: [
      {
        // Q11 - 5-star rating, as requested.
        kind: "stars",
        id: "dateTimeConvenience",
        label: "How convenient was the chosen date and time for you?",
        lowLabel: "Not convenient",
        highLabel: "Very convenient",
      },
      {
        // Q12
        kind: "choice",
        id: "duration",
        label: "Was the duration of the hangout adequate?",
        options: [
          { value: "Too short", label: "Too short" },
          { value: "Just right", label: "Just right" },
          { value: "Too long", label: "Too long" },
        ],
      },
      {
        // Q13 - 5-star rating, as requested.
        kind: "stars",
        id: "locationRating",
        label: "How would you rate the location in terms of accessibility?",
        help: `${EVENT.venue} - ${EVENT.address}`,
        lowLabel: "Poor",
        highLabel: "Excellent",
      },
    ],
  },
  {
    letter: "E",
    title: "Venue & environment",
    questions: [
      {
        // Q14 - 5-star rating, as requested.
        kind: "stars",
        id: "venueComfort",
        label: "Was the venue comfortable and welcoming?",
        lowLabel: "Not comfortable",
        highLabel: "Very comfortable",
      },
      {
        // Q15 - Likert scale, as requested.
        kind: "agree",
        id: "seating",
        label: "The seating arrangement was okay.",
      },
      {
        // Q16 - 5-star rating, as requested.
        kind: "stars",
        id: "soundSetup",
        label:
          "Was the sound and microphone setup clear throughout the program?",
        lowLabel: "Not clear",
        highLabel: "Very clear",
      },
    ],
  },
  {
    letter: "F",
    title: "Food & refreshment",
    questions: [
      {
        // Q17 - 5-star rating, as requested.
        kind: "stars",
        id: "foodQuality",
        label: "How would you rate the quality of the food and refreshment?",
        lowLabel: "Poor",
        highLabel: "Excellent",
      },
      {
        // Q18 - Likert scale, as requested.
        kind: "agree",
        id: "foodTiming",
        label: "The food was served on time and well organised.",
      },
      {
        // Q19 - open text, optional.
        kind: "text",
        id: "dietarySuggestions",
        label: "What would you suggest for the food and refreshment next time?",
        placeholder: "e.g. more vegetarian options",
        required: false,
        multiline: true,
        maxLength: 600,
      },
    ],
  },
  {
    letter: "G",
    title: "Overall experience",
    questions: [
      {
        // Q20 - keeps the 1-10 scale from the printed form.
        kind: "scale10",
        id: "recommendScore",
        label:
          "How likely are you to recommend Singles Connect events to a friend?",
        lowLabel: "Not likely",
        highLabel: "Very likely",
      },
      {
        // Q21 - 5-star rating, as requested.
        kind: "stars",
        id: "overallScore",
        label: "How would you rate your overall experience?",
        lowLabel: "Poor",
        highLabel: "Excellent",
      },
      {
        // Q22 - open text.
        kind: "text",
        id: "enjoyedMost",
        label: "What did you enjoy most?",
        placeholder: "The moment or part that stood out for you",
        required: true,
        multiline: true,
        maxLength: 600,
      },
      {
        // Q23 - open text.
        kind: "text",
        id: "improveNext",
        label: "What should we improve for the next edition?",
        placeholder: "Anything you would change or add",
        required: true,
        multiline: true,
        maxLength: 600,
      },
      {
        // Q24 - testimony, optional.
        kind: "text",
        id: "comments",
        label: "Any other comments or testimony?",
        help: "With your permission we may share this anonymously to promote the next edition.",
        placeholder: "Share your testimony or any final thought",
        required: false,
        multiline: true,
        maxLength: 1000,
      },
    ],
  },
] as const satisfies readonly FeedbackSection[];

/** Question ids in form order (section A first). */
export const FEEDBACK_QUESTION_IDS = FEEDBACK_SECTIONS.flatMap((section) =>
  section.questions.map((question) => question.id),
);

/** The id type of every question on the form. */
export type FeedbackQuestionId = (typeof FEEDBACK_SECTIONS)[number]["questions"][number]["id"];

/** A question exactly as it is written in `FEEDBACK_SECTIONS`. */
export type FormQuestion = (typeof FEEDBACK_SECTIONS)[number]["questions"][number];

/** Who is filling the form in. Prefilled from a ticket code when we have one. */
export const IDENTITY_FIELDS = ["fullName", "phone"] as const;
export type IdentityField = (typeof IDENTITY_FIELDS)[number];

/** Every field a submission carries: the answers plus who sent them. */
export type FeedbackField = FeedbackQuestionId | IdentityField;

/** The sections as the loose type, so `.flatMap` keeps a simple result type. */
const LOOSE_SECTIONS: readonly FeedbackSection[] = FEEDBACK_SECTIONS;

/** Flat list, handy for the admin dashboard and the CSV export. */
export const FEEDBACK_QUESTIONS: readonly FeedbackQuestion[] =
  LOOSE_SECTIONS.flatMap((section) => section.questions);

/** "Q4" - matches the numbering on the printed form. */
export function questionTag(id: FeedbackQuestionId): string {
  return questionTagFor(id);
}

/**
 * Same numbering, but for code that only holds the loose `FeedbackQuestion`
 * type (the form, the admin dashboard, the CSV export).
 */
export function questionTagFor(id: string): string {
  const index = FEEDBACK_QUESTIONS.findIndex((question) => question.id === id);
  return index === -1 ? "Q?" : `Q${index + 1}`;
}

/** Looks a question up by id. Throws on a typo, so mistakes fail loudly. */
export function questionById(id: FeedbackQuestionId): FeedbackQuestion {
  const question = FEEDBACK_QUESTIONS.find((item) => item.id === id);
  if (!question) throw new Error(`Unknown evaluation question: ${id}`);
  return question;
}

/** The highest value a rating question can take (1-5, or 1-10 for Q20). */
export function questionMax(question: FeedbackQuestion): number {
  return question.kind === "scale10" ? 10 : 5;
}

/** Questions whose answers are numbers, used for averages and distributions. */
export const RATED_QUESTIONS: readonly FeedbackQuestion[] =
  FEEDBACK_QUESTIONS.filter(
    (question) =>
      question.kind === "stars" ||
      question.kind === "agree" ||
      question.kind === "scale10" ||
      (question.kind === "choice" &&
        question.options.every((option) => typeof option.value === "number")),
  );

/** Turns a stored answer into words for the admin dashboard and CSV export. */
export function answerLabel(
  id: string,
  value: string | number | null | undefined,
): string {
  const question = FEEDBACK_QUESTIONS.find((item) => item.id === id);
  if (!question || value === null || value === undefined || value === "") {
    return "";
  }

  if (question.kind === "choice") {
    const option = question.options.find(
      (item) => String(item.value) === String(value),
    );
    return option ? option.label : String(value);
  }

  if (question.kind === "agree") {
    const step = AGREE_SCALE.find((item) => item.value === Number(value));
    return step ? `${step.label} (${value}/5)` : String(value);
  }

  if (question.kind === "stars" || question.kind === "scale10") {
    return `${value} / ${questionMax(question)}`;
  }

  return String(value);
}

/** "4.3 / 5" style summary used in the admin dashboard. */
export function averageLabel(total: number, count: number, max: number): string {
  if (count === 0) return "-";
  return `${(total / count).toFixed(1)} / ${max}`;
}


