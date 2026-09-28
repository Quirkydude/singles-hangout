/**
 * The vocabulary both evaluation forms share.
 *
 * The participants' questionnaire (`feedback-questions.ts`) and the panelists'
 * questionnaire (`panel-feedback-questions.ts`) ask different things, but they
 * are built from the same handful of question shapes, the same 5-point scales
 * and the same 1-10 scale. Keeping those here means an answer is stored,
 * labelled and averaged exactly the same way on both forms, and the two admin
 * dashboards cannot drift apart.
 *
 * Ratings are whole numbers, never words, so averages and distributions need
 * no clean-up before analysis.
 */

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
      /** One line under the numbers, explaining what 10 means. */
      readonly legend?: string;
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

/** The 1-10 scale used by the "how likely are you to recommend" style question. */
export const SCORE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Words for the 5-point rating scales, lowest first. */
export const RATING_WORDS = [
  "Poor",
  "Fair",
  "Good",
  "Very Good",
  "Excellent",
] as const;

/** The highest value a rating question can take (1-5, or 1-10 for a score). */
export function questionMax(question: FeedbackQuestion): number {
  return question.kind === "scale10" ? 10 : 5;
}

/**
 * "Q4" - the number the question carries on its printed form. Pass the flat
 * question list of the form in question, so each questionnaire keeps its own
 * numbering.
 */
export function questionTagOf(
  questions: readonly FeedbackQuestion[],
  id: string,
): string {
  const index = questions.findIndex((question) => question.id === id);
  return index === -1 ? "Q?" : `Q${index + 1}`;
}

/** Questions whose answers are numbers, used for averages and distributions. */
export function ratedQuestionsOf(
  questions: readonly FeedbackQuestion[],
): readonly FeedbackQuestion[] {
  return questions.filter(
    (question) =>
      question.kind === "stars" ||
      question.kind === "agree" ||
      question.kind === "scale10" ||
      (question.kind === "choice" &&
        question.options.every((option) => typeof option.value === "number")),
  );
}

/** Turns a stored answer into words for the admin dashboard and CSV export. */
export function answerLabelOf(
  questions: readonly FeedbackQuestion[],
  id: string,
  value: string | number | null | undefined,
): string {
  const question = questions.find((item) => item.id === id);
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

/** "4.3 / 5" style summary used in the admin dashboards. */
export function averageLabel(total: number, count: number, max: number): string {
  if (count === 0) return "-";
  return `${(total / count).toFixed(1)} / ${max}`;
}
