/**
 * Single source of truth for event details.
 * Everything shown on the site, in the SMS, in the ticket and in the
 * calendar invite is derived from this file.
 */

export const EVENT = {
  name: "Single's Hangout 2026",
  tagline: "Real stories. Real lessons. Real people.",
  host: "The Church of Pentecost",
  district: "Foso Town District",
  assembly: "Habitat Assembly",
  ministry: "Youth Ministry",

  // Saturday, 26 September 2026 at 4:30 PM (Ghana is UTC+0 year-round).
  startIso: "2026-09-26T16:30:00+00:00",
  endIso: "2026-09-26T20:00:00+00:00",
  dateLabel: "Saturday, 26 September 2026",
  timeLabel: "4:30 PM",

  venue: "Pizzaman, Foso",
  venueDetail: "Before Ring",
  address: "Foso, Asin - Central Region, Ghana",
  mapsQuery: "Pizzaman Foso Asin Central Region Ghana",

  minAge: 23,
  defaultCapacity: 150,

  activities: [
    "Real stories & lessons",
    "Open panel talks",
    "Exchange of gifts",
    "Socialization",
    "Games",
  ],

  siteUrlFallback: "https://www.register.kamartec.org",
} as const;

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

/** Short line used inside the SMS so it stays within one 160-char segment. */
export function getSmsEventLine(): string {
  return `Sat 26 Sept, 4:30PM, Pizzaman Foso`;
}
