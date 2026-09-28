import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPhoneForDisplay } from "@/lib/phone";
import {
  FEEDBACK_QUESTIONS,
  RATED_QUESTIONS,
  answerLabel,
  averageLabel,
  questionMax,
  questionTagFor,
} from "@/lib/feedback-questions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Evaluation responses",
  robots: { index: false, follow: false },
};

/** Non-rating questions worth counting, because the mix of answers is the story. */
const BREAKDOWN_IDS = ["ageRange", "firstTime", "duration"] as const;

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

const smsBadge: Record<string, string> = {
  SENT: "bg-green-50 text-green-700 border-green-600/20",
  FAILED: "bg-brand-red/5 text-brand-red-dark border-brand-red/25",
  PENDING: "bg-cream text-ink-muted border-line",
};

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


export default async function AdminFeedbackPage() {
  const [rows, registeredCount] = await Promise.all([
    prisma.feedback.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.registration.count({ where: { removed: false } }),
  ]);

  /**
   * Prisma columns carry the question ids, so one lookup covers the whole
   * answer sheet - including any question added later.
   */
  const answerOf = (row: (typeof rows)[number], id: string) =>
    (row as unknown as Record<string, string | number | null>)[id] ?? null;

  // Running total per rated question, so the averages need a single pass.
  const totals = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    for (const question of RATED_QUESTIONS) {
      const value = Number(answerOf(row, question.id));
      if (!Number.isFinite(value) || value <= 0) continue;
      const running = totals.get(question.id) ?? { total: 0, count: 0 };
      running.total += value;
      running.count += 1;
      totals.set(question.id, running);
    }
  }

  const ratingRows = RATED_QUESTIONS.map((question) => {
    const running = totals.get(question.id);
    return {
      id: question.id,
      tag: questionTagFor(question.id),
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
    const question = FEEDBACK_QUESTIONS.find((item) => item.id === id);
    const counts = new Map<string, number>();
    for (const row of rows) {
      const raw = answerOf(row, id);
      if (raw === null || raw === "") continue;
      const key = String(raw);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return {
      id,
      title: question ? `${questionTagFor(id)} ${question.label}` : id,
      rows:
        question && question.kind === "choice"
          ? question.options.map((option) => ({
              label: option.label,
              value: counts.get(String(option.value)) ?? 0,
            }))
          : [],
    };
  });

  const overallRow = ratingRows.find((row) => row.id === "overallScore");
  const recommendRow = ratingRows.find((row) => row.id === "recommendScore");
  const smsSent = rows.filter((row) => row.smsStatus === "SENT").length;
  const smsFailed = rows.filter((row) => row.smsStatus === "FAILED").length;
  const linked = rows.filter((row) => row.registrationId !== null).length;

  const openAnswers = rows
    .filter(
      (row) =>
        (row.improveNext ?? "").trim() !== "" ||
        (row.comments ?? "").trim() !== "" ||
        (row.enjoyedMost ?? "").trim() !== "",
    )
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight">
            Evaluation responses
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} {rows.length === 1 ? "response" : "responses"}{" "}
            &middot; {linked} matched to a registration &middot;{" "}
            {registeredCount} registered in total. Newest first.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/feedback"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
          >
            Open the form
          </Link>
          <a
            href="/api/admin/feedback/export"
            className="rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark"
          >
            Download CSV
          </a>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">
          No evaluations yet. Responses appear here the moment someone submits
          the form, and every submitter receives a thank-you SMS.
        </p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Responses"
              value={rows.length}
              hint={`${linked} match a registration`}
            />
            <StatCard
              label="Overall experience"
              value={overallRow?.average ?? "-"}
              hint={`${overallRow?.answers ?? 0} answers`}
            />
            <StatCard
              label="Would recommend"
              value={recommendRow?.average ?? "-"}
              hint={`${recommendRow?.answers ?? 0} answers`}
            />
            <StatCard
              label="Thank-you SMS"
              value={smsSent}
              hint={
                smsFailed > 0
                  ? `${smsFailed} failed - see the responses table`
                  : "All delivered"
              }
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
                    <p className="font-semibold">{row.fullName}</p>
                    <p className="text-xs text-ink-muted">
                      {dateFormat.format(row.createdAt)} &middot;{" "}
                      {formatPhoneForDisplay(row.phone)}
                    </p>
                  </div>
                  <dl className="mt-2 space-y-2.5 text-sm">
                    {(
                      [
                        ["Enjoyed most", row.enjoyedMost],
                        ["Improve next", row.improveNext],
                        ["Comments", row.comments],
                        ["Topic request", row.nextTopic],
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
                    <th className="py-2 pr-4">Respondent</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Age range</th>
                    <th className="py-2 pr-4">Overall</th>
                    <th className="py-2 pr-4">Recommend</th>
                    <th className="py-2 pr-4">SMS</th>
                    <th className="py-2">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-line">
                      <td className="py-3 pr-4">
                        <span className="font-semibold">{row.fullName}</span>
                        {row.registrationId ? (
                          <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[0.62rem] font-bold uppercase text-green-700">
                            Registered
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">
                        {formatPhoneForDisplay(row.phone)}
                      </td>
                      <td className="py-3 pr-4 text-ink-muted">
                        {answerLabel("ageRange", row.ageRange)}
                      </td>
                      <td className="py-3 pr-4 font-semibold">
                        {row.overallScore} / 5
                      </td>
                      <td className="py-3 pr-4 font-semibold">
                        {row.recommendScore} / 10
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-bold uppercase ${
                            smsBadge[row.smsStatus] ?? smsBadge.PENDING
                          }`}
                        >
                          {row.smsStatus}
                        </span>
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

