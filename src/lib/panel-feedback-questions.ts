/**
 * Singles Connect Hangout - Panelists' Evaluation Form.
 *
 * The same idea as `feedback-questions.ts`, for the people who sat on the
 * panel: every question, option and scale is defined here, so the public form,
 * the server-side validator, the admin dashboard and the CSV export all label
 * things identically.
 *
 * Ten questions in four steps, kept short on purpose: nine of them are a tap -
 * a star rating, a 5-point scale or a fixed choice - and the one open question
 * comes last, so a general comment is the final thing asked. Questions retired
 * to get there are listed in `prisma/schema.prisma`; their columns stay in the
 * database so earlier answers are not lost.
 *
 * The comment above each question carries its number on the printed handout,
 * so the organizers can line up a question with its answer during analysis.
 * The shapes and the scales themselves come from `evaluation-core.ts`, which
 * the participants' form uses too.
 *
 * Ratings are stored as whole numbers, never as words, so averages and
 * distributions need no clean-up before analysis.
 */

import {
  answerLabelOf,
  questionTagOf,
  ratedQuestionsOf,
  type ChoiceOption,
  type FeedbackQuestion,
  type FeedbackSection,
} from "@/lib/evaluation-core";

/** Question 3 keeps the exact wording the organizers used on the handout. */
export const MODERATOR_RATING_OPTIONS: readonly ChoiceOption[] = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Good" },
  { value: 4, label: "Very Good" },
  { value: 5, label: "Excellent" },
];

/**
 * The form itself, section by section. `panelistName` is asked at the top of
 * step 1 and is handled separately from these questions, because it says who
 * is answering rather than what they thought - see `PANEL_IDENTITY_FIELDS`.
 */
export const PANEL_FEEDBACK_SECTIONS = [
  {
    letter: "A",
    title: "Preparation",
    intro: "How the panel was arranged before the day.",
    questions: [
      {
        // Q1
        kind: "stars",
        id: "topicClarity",
        label:
          "How would you rate the clarity of the panel topic and objectives communicated to you?",
        lowLabel: "Not clear",
        highLabel: "Very clear",
      },
      {
        // Q2
        kind: "stars",
        id: "preEventComms",
        label:
          "How was the communication and coordination from the organizing team before the event?",
        lowLabel: "Poor",
        highLabel: "Excellent",
      },
    ],
  },
  {
    letter: "B",
    title: "The discussion",
    intro: "How the panel itself went.",
    questions: [
      {
        // Q3 - keeps the Poor -> Excellent wording from the handout.
        kind: "choice",
        id: "moderatorSteering",
        label:
          "How would you rate the moderator's ability to steer the discussion?",
        options: MODERATOR_RATING_OPTIONS,
      },
      {
        // Q4
        kind: "choice",
        id: "timeAdequacy",
        label: "Was the time allocated for the panel discussion adequate?",
        options: [
          { value: "Too short", label: "Too short" },
          { value: "Just right", label: "Just right" },
          { value: "Too long", label: "Too long" },
        ],
      },
      {
        // Q5
        kind: "stars",
        id: "questionRelevance",
        label:
          "How relevant were the questions asked by the moderator and the audience?",
        lowLabel: "Not relevant",
        highLabel: "Very relevant",
      },
      {
        // Q6 - 1 Low -> 5 Highly engaged, as requested.
        kind: "choice",
        id: "audienceEngagement",
        label:
          "How would you rate the participants' engagement during the panel?",
        help: "1 is low, 5 is highly engaged.",
        options: [
          { value: 1, label: "Low" },
          { value: 2, label: "Somewhat low" },
          { value: 3, label: "Moderate" },
          { value: 4, label: "Engaged" },
          { value: 5, label: "Highly engaged" },
        ],
      },
    ],
  },
  {
    letter: "C",
    title: "The big picture",
    intro: "How the day looked from the panel's side of the table.",
    questions: [
      {
        // Q7
        kind: "choice",
        id: "objectivesAchieved",
        label:
          "Do you think the objectives of the Singles Connect Hangout were achieved?",
        options: [
          { value: "Yes, fully", label: "Yes, fully" },
          { value: "Partly", label: "Partly" },
          { value: "No", label: "No" },
        ],
      },
      {
        // Q8 - keeps the 1-10 scale from the handout.
        kind: "scale10",
        id: "overallSuccess",
        label:
          "On a scale of 1 to 10, how would you rate the overall success of the program?",
        lowLabel: "Not successful",
        highLabel: "Fully successful",
        legend: "10 means the program achieved everything it set out to do.",
      },
      {
        // Q9
        kind: "choice",
        id: "serveAgain",
        label: "Would you be willing to serve as a panelist again?",
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
          { value: "Maybe", label: "Maybe" },
        ],
      },
    ],
  },
  {
    letter: "D",
    title: "Your comment",
    intro: "The last question, and the one we read first.",
    questions: [
      {
        // Q10 - the one open question, kept last on purpose.
        kind: "text",
        id: "suggestions",
        label: "Any other comment or suggestion?",
        help: "Anything you would keep, change or add for the next edition.",
        placeholder: "Anything else on your mind",
        required: false,
        multiline: true,
        maxLength: 1000,
      },
    ],
  },
] as const satisfies readonly FeedbackSection[];

/** Question ids in form order (section A first). */
export const PANEL_QUESTION_IDS = PANEL_FEEDBACK_SECTIONS.flatMap((section) =>
  section.questions.map((question) => question.id),
);

/** The id type of every question on the panelists' form. */
export type PanelQuestionId = (typeof PANEL_FEEDBACK_SECTIONS)[number]["questions"][number]["id"];

/** Who is filling the form in: the name on the panel list. */
export const PANEL_IDENTITY_FIELDS = ["panelistName"] as const;
export type PanelIdentityField = (typeof PANEL_IDENTITY_FIELDS)[number];

/** Every field a submission carries: the answers plus who sent them. */
export type PanelFeedbackField = PanelQuestionId | PanelIdentityField;

/** The sections as the loose type, so `.flatMap` keeps a simple result type. */
const LOOSE_PANEL_SECTIONS: readonly FeedbackSection[] = PANEL_FEEDBACK_SECTIONS;

/** Flat list, handy for the admin dashboard and the CSV export. */
export const PANEL_QUESTIONS: readonly FeedbackQuestion[] =
  LOOSE_PANEL_SECTIONS.flatMap((section) => section.questions);

/** "Q4" - matches the numbering on the printed handout. */
export function panelQuestionTagFor(id: string): string {
  return questionTagOf(PANEL_QUESTIONS, id);
}

/** Looks a question up by id. Throws on a typo, so mistakes fail loudly. */
export function panelQuestionById(id: PanelQuestionId): FeedbackQuestion {
  const question = PANEL_QUESTIONS.find((item) => item.id === id);
  if (!question) throw new Error(`Unknown panel evaluation question: ${id}`);
  return question;
}

/** Questions whose answers are numbers, used for averages and distributions. */
export const PANEL_RATED_QUESTIONS: readonly FeedbackQuestion[] =
  ratedQuestionsOf(PANEL_QUESTIONS);

/** Turns a stored answer into words for the admin dashboard and CSV export. */
export function panelAnswerLabel(
  id: string,
  value: string | number | null | undefined,
): string {
  return answerLabelOf(PANEL_QUESTIONS, id, value);
}

