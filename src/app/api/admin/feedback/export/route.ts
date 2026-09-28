import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import {
  FEEDBACK_QUESTIONS,
  answerLabel,
  questionTagFor,
  type FeedbackQuestion,
} from "@/lib/feedback-questions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Question ids in the order they appear on the printed form. */
const QUESTION_IDS = FEEDBACK_QUESTIONS.map((question) => question.id);

/**
 * Escapes a value for CSV. A leading quote/equals/plus/minus is prefixed
 * with a tab so spreadsheet apps do not interpret it as a formula.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@]/.test(text)) text = `\t${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Ratings stay as numbers so the columns can be averaged in a spreadsheet;
 * fixed choices keep their wording so the sheet reads well on its own.
 */
function answerCell(question: FeedbackQuestion, raw: string | number | null): string {
  if (raw === null || raw === "") return "";
  if (question.kind !== "choice") return String(raw);
  const numeric = question.options.every(
    (option) => typeof option.value === "number",
  );
  return numeric ? String(raw) : answerLabel(question.id, raw);
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "asc" },
    include: { registration: { select: { code: true } } },
  });

  const header = [
    "receivedAt",
    "fullName",
    "phone",
    "registrationCode",
    ...FEEDBACK_QUESTIONS.map(
      (question) => `${questionTagFor(question.id)} ${question.label}`,
    ),
    "smsStatus",
    "smsSentAt",
  ];

  const lines = [header.map(csvCell).join(",")];

  for (const row of rows) {
    // Prisma columns carry the question ids, so one lookup covers them all.
    const answers = row as unknown as Record<string, string | number | null>;

    const values = [
      csvCell(row.createdAt),
      csvCell(row.fullName),
      csvCell(row.phone),
      csvCell(row.registration?.code ?? ""),
    ];

    for (const question of FEEDBACK_QUESTIONS) {
      values.push(csvCell(answerCell(question, answers[question.id] ?? null)));
    }

    values.push(csvCell(row.smsStatus));
    values.push(csvCell(row.smsSentAt ?? ""));

    lines.push(values.join(","));
  }

  // BOM so Excel opens UTF-8 correctly.
  const body = `\uFEFF${lines.join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="singles-hangout-2026-evaluations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
