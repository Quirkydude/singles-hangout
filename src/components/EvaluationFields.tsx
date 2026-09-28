"use client";

import { useFormStatus } from "react-dom";
import {
  AGREE_SCALE,
  RATING_WORDS,
  SCORE_VALUES,
  STAR_VALUES,
  type ChoiceOption,
  type FeedbackQuestion,
} from "@/lib/evaluation-core";

/**
 * Every control an evaluation question can be answered with.
 *
 * Both forms draw their questions from here: the participants' form and the
 * panelists' form differ in what they ask, not in how a star rating, a scale
 * or a text box looks and behaves. The only thing a caller has to supply is
 * the question itself and the number it carries on the printed form (`tag`),
 * because each questionnaire has its own numbering.
 */

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand-red";

export const labelClass = "block text-sm font-semibold text-ink";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-brand-red">
      {message}
    </p>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="currentColor">
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" />
    </svg>
  );
}

export function SubmitButton({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 font-display text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 0 1 8-8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          Sending...
        </>
      ) : (
        label
      )}
    </button>
  );
}

/** A large tappable radio card, used for the Yes / No and age range answers. */
function ChoiceCards({
  name,
  options,
  value,
  onChange,
  errorId,
  error,
  columns = 2,
}: {
  name: string;
  options: readonly ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  errorId: string;
  error?: string;
  columns?: 1 | 2;
}) {
  return (
    <>
      <div
        className={`mt-2 grid gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}
      >
        {options.map((option) => {
          const optionValue = String(option.value);
          const selected = value === optionValue;
          return (
            <label
              key={optionValue}
              className={`flex cursor-pointer flex-col rounded-xl border-2 px-4 py-3.5 text-sm transition-colors ${
                selected
                  ? "border-brand-red bg-brand-red/5"
                  : "border-line hover:border-ink/30"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={name}
                  value={optionValue}
                  checked={selected}
                  onChange={() => onChange(optionValue)}
                  className="h-4 w-4 shrink-0 accent-[var(--color-brand-red)]"
                  aria-describedby={error ? errorId : undefined}
                />
                <span className="font-semibold text-ink">{option.label}</span>
              </span>
              {option.hint ? (
                <span className="mt-1 pl-7 text-xs text-ink-muted">
                  {option.hint}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </>
  );
}

/** 5-star rating: one tap per answer, stored as a number for easy analysis. */
function StarRow({
  name,
  value,
  onChange,
  lowLabel,
  highLabel,
  errorId,
  error,
  groupLabel,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  lowLabel: string;
  highLabel: string;
  errorId: string;
  error?: string;
  groupLabel: string;
}) {
  const chosen = value === "" ? 0 : Number(value);

  return (
    <>
      <div
        role="radiogroup"
        aria-label={groupLabel}
        className="mt-2 flex items-center gap-1.5"
      >
        {STAR_VALUES.map((star) => {
          const filled = star <= chosen;
          return (
            <label key={star} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={star}
                checked={chosen === star}
                onChange={() => onChange(String(star))}
                className="peer sr-only"
                aria-label={`${star} out of 5`}
                aria-describedby={error ? errorId : undefined}
              />
              <span
                className={`grid h-11 w-11 place-items-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2 ${
                  filled
                    ? "border-brand-red bg-brand-red/5 text-brand-red"
                    : "border-line text-ink-muted/40 hover:border-ink/30"
                }`}
              >
                <StarIcon />
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3 text-xs text-ink-muted">
        <span>{lowLabel}</span>
        <span className={`text-center font-semibold ${chosen ? "text-brand-red" : ""}`}>
          {chosen ? `${chosen} / 5` : "Tap a star"}
        </span>
        <span className="text-right">{highLabel}</span>
      </div>
      <FieldError id={errorId} message={error} />
    </>
  );
}

/**
 * A numbered scale: 1-5 for the agree/disagree statements and the
 * Poor -> Excellent question, 1-10 for "how likely are you to recommend".
 * The chosen word is spelled out underneath, so nobody has to guess.
 */
function NumberRow({
  name,
  value,
  onChange,
  options,
  legend,
  lowLabel,
  highLabel,
  errorId,
  error,
  groupLabel,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: number | string; label: string }[];
  legend?: string;
  lowLabel?: string;
  highLabel?: string;
  errorId: string;
  error?: string;
  groupLabel: string;
}) {
  const chosen = options.find((option) => String(option.value) === value);

  return (
    <>
      <div
        role="radiogroup"
        aria-label={groupLabel}
        className="mt-2 grid grid-cols-5 gap-1.5"
      >
        {options.map((option) => {
          const optionValue = String(option.value);
          const selected = value === optionValue;
          return (
            <label key={optionValue} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={selected}
                onChange={() => onChange(optionValue)}
                className="peer sr-only"
                aria-label={option.label || optionValue}
                aria-describedby={error ? errorId : undefined}
              />
              <span
                className={`grid h-11 place-items-center rounded-lg border-2 font-display text-base font-bold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2 ${
                  selected
                    ? "border-brand-red bg-brand-red text-white"
                    : "border-line text-ink hover:border-ink/30"
                }`}
              >
                {optionValue}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3 text-xs text-ink-muted">
        <span>{lowLabel}</span>
        <span className={`text-center font-semibold ${chosen ? "text-brand-red" : ""}`}>
          {chosen
            ? chosen.label
              ? `${chosen.value} - ${chosen.label}`
              : `You chose ${chosen.value}`
            : "Tap a number"}
        </span>
        <span className="text-right">{highLabel}</span>
      </div>
      {legend ? (
        <p className="mt-1 text-[0.7rem] text-ink-muted">{legend}</p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </>
  );
}

/**
 * One question, rendered with the control its `kind` calls for, plus its own
 * error message. `tag` is the number the question carries on the printed form,
 * so each questionnaire keeps its own numbering.
 */
export function QuestionBlock({
  question,
  tag,
  value,
  onChange,
  error,
}: {
  question: FeedbackQuestion;
  tag: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const errorId = `${question.id}-error`;
  const options = question.kind === "choice" ? question.options : undefined;
  const numericChoice =
    options !== undefined &&
    options.every((option) => typeof option.value === "number");

  return (
    <div className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <p className={labelClass}>
        <span className="mr-1.5 font-display text-xs font-bold text-brand-red">
          {tag}
        </span>
        {question.label}
        {question.kind === "text" && !question.required ? (
          <span className="ml-1.5 font-normal text-ink-muted">(optional)</span>
        ) : null}
      </p>
      {question.help ? (
        <p className="mt-1 text-xs text-ink-muted">{question.help}</p>
      ) : null}

      {question.kind === "stars" ? (
        <StarRow
          name={question.id}
          value={value}
          onChange={onChange}
          groupLabel={question.label}
          lowLabel={question.lowLabel}
          highLabel={question.highLabel}
          errorId={errorId}
          error={error}
        />
      ) : null}

      {question.kind === "agree" ? (
        <NumberRow
          name={question.id}
          value={value}
          onChange={onChange}
          groupLabel={question.label}
          options={AGREE_SCALE}
          lowLabel={AGREE_SCALE[0].label}
          highLabel={AGREE_SCALE[AGREE_SCALE.length - 1].label}
          errorId={errorId}
          error={error}
        />
      ) : null}

      {question.kind === "scale10" ? (
        <NumberRow
          name={question.id}
          value={value}
          onChange={onChange}
          groupLabel={question.label}
          options={SCORE_VALUES.map((score) => ({ value: score, label: "" }))}
          lowLabel={question.lowLabel}
          highLabel={question.highLabel}
          legend={question.legend}
          errorId={errorId}
          error={error}
        />
      ) : null}

      {numericChoice && options ? (
        <NumberRow
          name={question.id}
          value={value}
          onChange={onChange}
          groupLabel={question.label}
          options={options}
          lowLabel={options[0]?.label || RATING_WORDS[0]}
          highLabel={
            options[options.length - 1]?.label ||
            RATING_WORDS[RATING_WORDS.length - 1]
          }
          errorId={errorId}
          error={error}
        />
      ) : null}

      {question.kind === "choice" && !numericChoice ? (
        <ChoiceCards
          name={question.id}
          value={value}
          onChange={onChange}
          options={question.options}
          columns={question.options.length % 2 === 0 ? 2 : 1}
          errorId={errorId}
          error={error}
        />
      ) : null}

      {question.kind === "text" ? (
        <>
          {question.multiline ? (
            <textarea
              id={question.id}
              name={question.id}
              rows={3}
              maxLength={question.maxLength}
              placeholder={question.placeholder}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={`mt-2 resize-y ${inputClass}`}
            />
          ) : (
            <input
              id={question.id}
              name={question.id}
              type="text"
              maxLength={question.maxLength}
              placeholder={question.placeholder}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={`mt-2 ${inputClass}`}
            />
          )}
          <FieldError id={errorId} message={error} />
        </>
      ) : null}
    </div>
  );
}
