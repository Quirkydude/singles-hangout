import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { averageLabel, questionMax } from "@/lib/evaluation-core";
import {
  PANEL_QUESTIONS,
  PANEL_RATED_QUESTIONS,
  panelAnswerLabel,
  panelQuestionTagFor,
} from "@/lib/panel-feedback-questions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel evaluation responses",
  robots: { index: false, follow: false },
};

/** Non-rating questions worth counting, because the mix of answers is the story. */
const BREAKDOWN_IDS = [
  "timeAdequacy",
  "objectivesAchieved",
  "serveAgain",
] as const;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
        {label}
      </p>
      <p className="mt-1.5 font-display text-3xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

/** Small labelled count used in the breakdown cards. */
function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
        {title}
      </p>
      <ul className="mt-2.5 space-y-1.5 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-ink-muted">{row.label}</span>
            <strong className="text-ink">{row.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminPanelFeedbackPage() {
  const rows = await prisma.panelFeedback.findMany({
    orderBy: { createdAt: "desc" },
  });

  /**
   * Prisma columns carry the question ids, so one lookup covers the whole
   * answer sheet - including any question added later.
   */
  const answerOf = (row: (typeof rows)[number], id: string) =>
    (row as unknown as Record<string, string | number | null>)[id] ?? null;

  // Running total per rated question, so the averages need a single pass.
  const totals = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    for (const question of PANEL_RATED_QUESTIONS) {
      const value = Number(answerOf(row, question.id));
      if (!Number.isFinite(value) || value <= 0) continue;
      const running = totals.get(question.id) ?? { total: 0, count: 0 };
      running.total += value;
      running.count += 1;
      totals.set(question.id, running);
    }
  }

  const ratingRows = PANEL_RATED_QUESTIONS.map((question) => {
    const running = totals.get(question.id);
    return {
      id: question.id,
      tag: panelQuestionTagFor(question.id),
      label: question.label,
      answers: running?.count ?? 0,
      average: averageLabel(
        running?.total ?? 0,
        running?.count ?? 0,
        questionMax(question),
      ),
    };
  });

  const choiceCards = BREAKDOWN_IDS.map((id) => {
    const question = PANEL_QUESTIONS.find((item) => item.id === id);

    const counts = new Map<string, number>();
    for (const row of rows) {
      const raw = answerOf(row, id);
      if (raw === null || raw === "") continue;
      const key = String(raw);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return {
      id,
      title: question ? `${panelQuestionTagFor(id)} ${question.label}` : id,
      rows:
        question && question.kind === "choice"
          ? question.options.map((option) => ({
              label: option.label,
              value: counts.get(String(option.value)) ?? 0,
            }))
          : [],
    };
  });

  const successRow = ratingRows.find((row) => row.id === "overallSuccess");
  const willingCount = rows.filter((row) => row.serveAgain === "Yes").length;
  const achievedFully = rows.filter(
    (row) => row.objectivesAchieved === "Yes fully",
  ).length;

  // Only one question on the form is open text, so one check covers it.
  const openAnswers = rows
    .filter((row) => (row.suggestions ?? "").trim() !== "")
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight">
            Panel evaluation responses
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} {rows.length === 1 ? "response" : "responses"} from the
            panelists &middot; {willingCount} would serve again. Newest first.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/panel-feedback"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
          >
            Open the form
          </Link>
          <a
            href="/api/admin/panel-feedback/export"
            className="rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark"
          >
            Download CSV
          </a>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">
          No panel evaluations yet. Responses appear here the moment a panelist
          submits the form, and a second submission under the same name replaces
          the first.
        </p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Responses"
              value={rows.length}
              hint="One answer sheet per panelist"
            />
            <StatCard
              label="Would serve again"
              value={willingCount}
              hint={`${willingCount} of ${rows.length} answered Yes`}
            />
            <StatCard
              label="Overall success"
              value={successRow?.average ?? "-"}
              hint="Average of every answer, out of 10"
            />
            <StatCard
              label="Objectives achieved"
              value={achievedFully}
              hint='Answered "Yes fully"'
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {choiceCards.map((card) => (
              <Breakdown key={card.id} title={card.title} rows={card.rows} />
            ))}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-bold">
              Ratings at a glance
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Average of every answer given, out of the scale each question
              uses.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="text-left text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                  <tr>
                    <th className="py-2 pr-4">Question</th>
                    <th className="py-2 pr-4 text-right">Average</th>
                    <th className="py-2 text-right">Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingRows.map((row) => (
                    <tr key={row.id} className="border-t border-line">
                      <td className="py-3 pr-4">
                        <span className="font-bold text-ink-muted">
                          {row.tag}
                        </span>{" "}
                        {row.label}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold">
                        {row.average}
                      </td>
                      <td className="py-3 text-right text-ink-muted">
                        {row.answers}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-bold">
              In their own words
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              The latest {openAnswers.length} responses that came with written
              answers.
            </p>
            <ul className="mt-4 space-y-5">
              {openAnswers.map((row) => (
                <li
                  key={row.id}
                  className="border-t border-line pt-4 first:border-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{row.panelistName}</p>
                    <p className="text-xs text-ink-muted">
                      {dateFormat.format(row.createdAt)}
                    </p>
                  </div>
                  <dl className="mt-2 space-y-2.5 text-sm">
                    {(
                      [
                        ["Comment", row.suggestions],
                      ] as const
                    ).map(([label, text]) =>
                      text && text.trim() !== "" ? (
                        <div key={label}>
                          <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                            {label}
                          </dt>
                          <dd className="text-ink">{text}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Every response</h2>
              <p className="text-xs text-ink-muted">
                The CSV holds all {rows.length} answer sheets, one row each.
              </p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="text-left text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                  <tr>
                    <th className="py-2 pr-4">Panelist</th>
                    <th className="py-2 pr-4">Moderator</th>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Objectives</th>
                    <th className="py-2 pr-4">Overall</th>
                    <th className="py-2 pr-4">Serve again</th>
                    <th className="py-2">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-line">
                      <td className="py-3 pr-4 font-semibold">
                        {row.panelistName}
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">
                        {panelAnswerLabel(
                          "moderatorSteering",
                          row.moderatorSteering,
                        )}
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">
                        {panelAnswerLabel("timeAdequacy", row.timeAdequacy)}
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">
                        {panelAnswerLabel(
                          "objectivesAchieved",
                          row.objectivesAchieved,
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold">
                        {row.overallSuccess} / 10
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">
                        {row.serveAgain}
                      </td>
                      <td className="py-3 text-ink-muted">
                        {dateFormat.format(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
