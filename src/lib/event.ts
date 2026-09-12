/**
 * Single source of truth for event details.
 * Everything shown on the site, in the SMS, in the ticket and in the
 * calendar invite is derived from this file.
 */
import { maskPhone } from "@/lib/phone";

export const EVENT = {
  name: "Single's Hangout 2026",
  theme: "Before the Ring",
  tagline: "Real stories. Real lessons. Real people.",

  host: "The Church of Pentecost",
  district: "Foso Town District",
  assembly: "Habitat Assembly",
  ministry: "Youth Ministry",
  logo: "/cop-habitat-assembly.png",
  logoWhite: "/cop-habitat-assembly-white.png",

  // Saturday, 26 September 2026 at 4:00 PM (Ghana is UTC+0 year-round).
  startIso: "2026-09-26T16:00:00+00:00",
  endIso: "2026-09-26T20:00:00+00:00",
  dateLabel: "Saturday, 26 September 2026",
  dateShort: "Sat, 26 Sept 2026",
  timeLabel: "4:00 PM",

  venue: "Pizzaman Chickenman",
  address: "Pizzaman, Asin Foso - Central Region, Ghana",
  mapsQuery: "Pizzaman Chickenman Asin Foso Central Region Ghana",

  minAge: 22,
  defaultCapacity: 30,

  /** Enforced at the door. Surfaced prominently across the site. */
  dressCode: "Strictly formal",
  dressCodeNote:
    "Smart, modest and formal. No jeans, sneakers, shorts or casual wear - you may be turned away at the door.",

  activities: [
    {
      title: "Real stories & lessons",
      description:
        "People who have been where you are, sharing what actually helped them.",
    },
    {
      title: "Open panel talks",
      description:
        "Ask the questions you have always wanted to ask, out loud and without judgement.",
    },
    {
      title: "Socialization",
      description:
        "Space to simply meet people. No pressure, no performance.",
    },
    {
      title: "Games",
      description: "Light-hearted games to keep the afternoon moving.",
    },
  ],

  siteUrlFallback: "https://www.register.kamartec.org",
} as const;

/** Helpers used to build the WhatsApp share text. */
export function whatsappShareText(shareUrl: string): string {
  return [
    `${EVENT.name} - ${EVENT.theme}`,
    `${EVENT.dateShort} at ${EVENT.timeLabel}`,
    `${EVENT.venue}, ${EVENT.address.split(" - ")[0]}`,
    `Free entry, ${EVENT.minAge}+ only.`,
    `Register here: ${shareUrl}`,
  ].join("\n");
}

/** Public base URL used for QR codes, OG images and SMS links. */
export function getSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return EVENT.siteUrlFallback;
  return raw.replace(/\/+$/, "");
}

export function getTicketUrl(code: string): string {
  return `${getSiteUrl()}/ticket/${encodeURIComponent(code)}`;
}

export function getMapsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    EVENT.mapsQuery,
  )}`;
}

/**
 * The phone number to call or WhatsApp for help. Rendered as a WhatsApp
 * link so it works in a browser without exposing the raw number as text.
 */
export function getHelpWhatsAppUrl(): string {
  const number = process.env.HELP_WHATSAPP_NUMBER?.replace(/\D/g, "");
  if (!number) return "";
  return `https://wa.me/${number}`;
}

export function getHelpPhoneDisplay(): string {
  const number = process.env.HELP_WHATSAPP_NUMBER;
  if (!number) return "";
  const normalized = number.replace(/\D/g, "");
  return normalized ? maskPhone(normalized) : "";
}
