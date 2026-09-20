import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLUMNS = [
  "code",
  "fullName",
  "phone",
  "age",
  "gender",
  "location",
  "isFacilitator",
  "affiliation",
  "role",
  "panelQuestion",
  "smsStatus",
  "attended",
  "checkedInAt",
  "removed",
  "removedAt",
  "removedReason",
  "createdAt",
] as const;

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

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: "asc" },
  });

  const lines = [COLUMNS.join(",")];
  for (const row of registrations) {
    lines.push(
      COLUMNS.map((column) => {
        if (column === "createdAt") return csvCell(row.createdAt);
        if (column === "checkedInAt") return csvCell(row.checkedInAt ?? "");
        if (column === "isFacilitator") return csvCell(row.isFacilitator ? "Yes" : "No");
        if (column === "affiliation") return csvCell(row.affiliation ?? "Not specified");
        if (column === "role") return csvCell(row.role ?? "");
        if (column === "attended") return csvCell(row.attended ? "Yes" : "No");
        if (column === "removed") return csvCell(row.removed ? "Yes" : "No");
        if (column === "removedAt") return csvCell(row.removedAt ?? "");
        return csvCell(row[column]);
      }).join(","),
    );
  }

  // BOM so Excel opens UTF-8 correctly.
  const body = `\uFEFF${lines.join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="singles-hangout-2026-registrations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
