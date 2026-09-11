import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

function toIcsUtc(iso: string): string {
  // 2026-09-26T16:30:00+00:00 -> 20260926T163000Z
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 requires CRLF line endings and lines folded at 75 octets. */
function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    parts.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  if (rest.length) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim();
  const token = code ? code.replace(/[^A-Za-z0-9]/g, "") : "invite";

  const description = [
    `${EVENT.name} - ${EVENT.assembly}, ${EVENT.ministry}.`,
    code ? `Your registration code: ${code}.` : "",
    `Activities: ${EVENT.activities.join(", ")}.`,
    "Registration is free.",
  ]
    .filter(Boolean)
    .join(" ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kamartec//Singles Hangout 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:sh26-${token}@register.kamartec.org`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${toIcsUtc(EVENT.startIso)}`,
    `DTEND:${toIcsUtc(EVENT.endIso)}`,
    foldLine(`SUMMARY:${escapeIcsText(EVENT.name)}`),
    foldLine(
      `LOCATION:${escapeIcsText(`${EVENT.venueDetail}, ${EVENT.venue}, ${EVENT.address}`)}`,
    ),
    foldLine(`DESCRIPTION:${escapeIcsText(description)}`),
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`${EVENT.name} starts in 2 hours`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const body = `${lines.join("\r\n")}\r\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="singles-hangout-2026.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
