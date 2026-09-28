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
 * The shapes and the scales themselves are shared with the panelists' form -
 * see `evaluation-core.ts`.
 *
 * Ratings are stored as whole numbers, never as words, so averages and
 * distributions need no clean-up before analysis.
 */

import { EVENT } from "@/lib/event";
import {
  answerLabelOf,
  questionTagOf,
  ratedQuestionsOf,
  type ChoiceOption,
  type FeedbackQuestion,
  type FeedbackSection,
} from "@/lib/evaluation-core";

// The question shapes, the 5-point scales and the 1-10 scale are shared with
// the panelists' form, so they now live in `evaluation-core.ts` and are
// re-exported here: every existing `@/lib/feedback-questions` import keeps
// working, and a rating means the same thing on both forms.
export {
  AGREE_SCALE,
  RATING_WORDS,
  SCORE_VALUES,
  STAR_VALUES,
  averageLabel,
  questionMax,
} from "@/lib/evaluation-core";
export type {
  ChoiceOption,
  FeedbackQuestion,
  FeedbackSection,
} from "@/lib/evaluation-core";

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
  return questionTagOf(FEEDBACK_QUESTIONS, id);
}

/** Looks a question up by id. Throws on a typo, so mistakes fail loudly. */
export function questionById(id: FeedbackQuestionId): FeedbackQuestion {
  const question = FEEDBACK_QUESTIONS.find((item) => item.id === id);
  if (!question) throw new Error(`Unknown evaluation question: ${id}`);
  return question;
}

/** Questions whose answers are numbers, used for averages and distributions. */
export const RATED_QUESTIONS: readonly FeedbackQuestion[] =
  ratedQuestionsOf(FEEDBACK_QUESTIONS);

/** Turns a stored answer into words for the admin dashboard and CSV export. */
export function answerLabel(
  id: string,
  value: string | number | null | undefined,
): string {
  return answerLabelOf(FEEDBACK_QUESTIONS, id, value);
}


