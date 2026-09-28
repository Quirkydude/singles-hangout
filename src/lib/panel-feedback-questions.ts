/**
 * Singles Connect Hangout - Panelists' Evaluation Form.
 *
 * The same idea as `feedback-questions.ts`, for the people who sat on the
 * panel: every question, option and scale is defined here, so the public form,
 * the server-side validator, the admin dashboard and the CSV export all label
 * things identically.
 *
 * The comment above each question carries its number on the printed handout,
 * so the organizers can line up a question with its answer during analysis.
 * The shapes and the scales themselves come from `evaluation-core.ts`, which
 * the participants' form uses too.
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

/** Question 4 keeps the exact wording the organizers used on the handout. */
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
    title: "Preparation & organization",
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
        id: "prepAdequacy",
        label: "Were you given enough time and information to prepare?",
        lowLabel: "Not enough",
        highLabel: "More than enough",
      },
      {
        // Q3
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
    title: "Panel moderation & flow",
    intro: "The discussion itself, and how it was steered.",
    questions: [
      {
        // Q4 - keeps the Poor -> Excellent wording from the handout.
        kind: "choice",
        id: "moderatorSteering",
        label:
          "How would you rate the moderator's ability to steer the discussion?",
        options: MODERATOR_RATING_OPTIONS,
      },
      {
        // Q5
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
        // Q6
        kind: "stars",
        id: "contributionBalance",
        label:
          "Was there a good balance in allowing all panelists to contribute?",
        lowLabel: "No balance",
        highLabel: "Very balanced",
      },
      {
        // Q7
        kind: "stars",
        id: "questionRelevance",
        label:
          "How relevant were the questions asked by the moderator and the audience?",
        lowLabel: "Not relevant",
        highLabel: "Very relevant",
      },
    ],
  },
  {
    letter: "C",
    title: "Audience & participant engagement",
    intro: "The singles in the room, seen from the panel's side of the table.",
    questions: [
      {
        // Q8 - 1 Low -> 5 Highly engaged, as requested.
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
      {
        // Q9
        kind: "stars",
        id: "audienceQuestions",
        label:
          "Were the questions from participants meaningful and relevant to singles?",
        lowLabel: "Not at all",
        highLabel: "Very meaningful",
      },
      {
        // Q10
        kind: "stars",
        id: "audienceConnection",
        label:
          "Do you feel the audience understood and connected with your contributions?",
        lowLabel: "Not at all",
        highLabel: "Very much",
      },
    ],
  },
  {
    letter: "D",
    title: "Venue, date & time",
    questions: [
      {
        // Q11
        kind: "stars",
        id: "panelDateTime",
        label: "How convenient was the date and time for you as a panelist?",
        lowLabel: "Not convenient",
        highLabel: "Very convenient",
      },
      {
        // Q12
        kind: "stars",
        id: "venueSuitability",
        label: `Was ${EVENT.venue} a suitable venue for a panel discussion?`,
        help: "Think about noise, space and comfort for the panel.",
        lowLabel: "Not suitable",
        highLabel: "Very suitable",
      },
      {
        // Q13
        kind: "stars",
        id: "technicalLogistics",
        label:
          "Were the technical logistics (microphones, seating for panelists, sound) adequate?",
        lowLabel: "Not adequate",
        highLabel: "Fully adequate",
      },
    ],
  },
  {
    letter: "E",
    title: "Overall program experience",
    questions: [
      {
        // Q14
        kind: "stars",
        id: "overallOrganization",
        label: "How would you rate the overall organization of the hangout?",
        lowLabel: "Poor",
        highLabel: "Excellent",
      },
      {
        // Q15
        kind: "stars",
        id: "panelistHospitality",
        label:
          "How would you rate the hospitality and care given to panelists?",
        help: "Reception, food, water and anything else that mattered to you.",
        lowLabel: "Poor",
        highLabel: "Excellent",
      },
      {
        // Q16
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
    ],
  },
  {
    letter: "F",
    title: "Reflection & recommendations",
    intro: "The part that matters most for the next edition.",
    questions: [
      {
        // Q17 - open text.
        kind: "text",
        id: "wentWell",
        label: "What part of the panel discussion went exceptionally well?",
        placeholder: "e.g. the questions that came from the audience",
        required: true,
        multiline: true,
        maxLength: 600,
      },
      {
        // Q18 - open text.
        kind: "text",
        id: "challenge",
        label: "What challenge did you encounter during the discussion?",
        placeholder: "e.g. time ran out before the last questions",
        required: true,
        multiline: true,
        maxLength: 600,
      },
      {
        // Q19 - open text.
        kind: "text",
        id: "topicSuggestion",
        label:
          "What topic or angle do you think we should add next time for singles?",
        placeholder: "e.g. handling pressure from family",
        required: true,
        multiline: true,
        maxLength: 600,
      },
      {
        // Q20 - keeps the 1-10 scale from the handout.
        kind: "scale10",
        id: "overallSuccess",
        label:
          "On a scale of 1 to 10, how would you rate the overall success of the program?",
        lowLabel: "Not successful",
        highLabel: "Fully successful",
        legend: "10 means the program achieved everything it set out to do.",
      },
      {
        // Q21
        kind: "choice",
        id: "serveAgain",
        label: "Would you be willing to serve as a panelist again?",
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
          { value: "Maybe", label: "Maybe" },
        ],
      },
      {
        // Q22 - anything else on their mind. Optional.
        kind: "text",
        id: "suggestions",
        label:
          "Any other suggestions or observations to improve future editions?",
        placeholder: "Anything else you would change or add",
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

