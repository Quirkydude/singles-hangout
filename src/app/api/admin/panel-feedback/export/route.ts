import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import type { FeedbackQuestion } from "@/lib/evaluation-core";
import {
  PANEL_QUESTIONS,
  panelAnswerLabel,
  panelQuestionTagFor,
} from "@/lib/panel-feedback-questions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
 * the worded choices ("Just right", "Yes") keep their wording so the sheet
 * reads well on its own.
 */
function answerCell(
  question: FeedbackQuestion,
  raw: string | number | null,
): string {
  if (raw === null || raw === "") return "";
  if (question.kind !== "choice") return String(raw);
  const numeric = question.options.every(
    (option) => typeof option.value === "number",
  );
  return numeric ? String(raw) : panelAnswerLabel(question.id, raw);
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.panelFeedback.findMany({
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "receivedAt",
    "panelistName",
    ...PANEL_QUESTIONS.map((question) => {
      const tag = panelQuestionTagFor(question.id);
      return tag ? `${tag} ${question.label}` : question.label;
    }),
  ];

  const lines = [header.map(csvCell).join(",")];

  for (const row of rows) {
    const answers = row as unknown as Record<
      string,
      string | number | null | undefined
    >;

    const values = [csvCell(row.createdAt), csvCell(row.panelistName)];

    for (const question of PANEL_QUESTIONS) {
      values.push(csvCell(answerCell(question, answers[question.id] ?? null)));
    }

    lines.push(values.join(","));
  }

  // BOM so Excel opens the accented characters and the naira/cedi symbols right.
  const body = `\uFEFF${lines.join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="singles-hangout-2026-panelist-evaluations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
