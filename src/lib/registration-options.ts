/**
 * The answers collected by the step-based registration form.
 *
 * Kept separate from the form component so the server action, the admin
 * dashboard and the ticket page all label things identically.
 */

export const FACILITATOR_VALUES = ["yes", "no"] as const;
export type FacilitatorValue = (typeof FACILITATOR_VALUES)[number];

export const AFFILIATION_VALUES = ["habitat", "cop_other", "non_cop"] as const;
export type AffiliationValue = (typeof AFFILIATION_VALUES)[number];

export const ROLE_VALUES = ["organizer", "protocol", "participant"] as const;
export type RoleValue = (typeof ROLE_VALUES)[number];

/**
 * Internal-only role for the media team.
 *
 * Deliberately NOT part of `ROLE_VALUES`, so it cannot be produced by the
 * public registration form (the zod enum rejects it) and is never offered
 * as a choice. It is assigned by an administrator instead.
 */
export const MEDIA_ROLE = "Media";

/** Shown in the step where we ask where they fellowship. */
export const AFFILIATION_OPTIONS: Array<{
  value: AffiliationValue;
  label: string;
  hint: string;
}> = [
  {
    value: "habitat",
    label: "Habitat Assembly",
    hint: "I fellowship here",
  },
  {
    value: "cop_other",
    label: "Another COP assembly",
    hint: "I am COP, but not Habitat",
  },
  {
    value: "non_cop",
    label: "I don't attend COP",
    hint: "Visiting for this event",
  },
];

/** Shown only to people who attend a COP assembly. */
export const ROLE_OPTIONS: Array<{
  value: RoleValue;
  label: string;
  hint: string;
}> = [
  { value: "organizer", label: "Organizer", hint: "Helping to run the event" },
  { value: "protocol", label: "Protocol Member", hint: "Ushering and protocol" },
  { value: "participant", label: "Participant", hint: "Attending as a guest" },
];

export const FACILITATOR_OPTIONS: Array<{
  value: FacilitatorValue;
  label: string;
  hint: string;
}> = [
  { value: "yes", label: "Yes, I am facilitating", hint: "Part of the team" },
  { value: "no", label: "No, I am attending", hint: "Here as a guest" },
];

/** Stored value for `affiliation`. Facilitators are never asked. */
export function resolveAffiliation(
  isFacilitator: boolean,
  affiliation: AffiliationValue | undefined,
): string | null {
  if (isFacilitator || !affiliation) return null;
  switch (affiliation) {
    case "habitat":
      return "Habitat Assembly";
    case "cop_other":
      return "Other COP Assembly";
    case "non_cop":
      return "Non-COP";
  }
}

/**
 * Stored value for `role`.
 *
 * - Facilitators are organisers by definition, so they are set to
 *   "Organizer" without being asked (they skip the question entirely).
 * - Anyone attending a COP assembly (Habitat or another) picks their own.
 * - Non-COP guests are only ever attending, so they are recorded as
 *   "Participant" rather than left blank. This keeps the admin breakdown
 *   complete instead of having an "unspecified" bucket.
 */
export function resolveRole(
  isFacilitator: boolean,
  affiliation: AffiliationValue | undefined,
  role: RoleValue | undefined,
): string {
  // Facilitators were never asked, so they must not be recorded as guests.
  if (isFacilitator) return "Organizer";

  // Non-COP guests are only ever attending.
  if (affiliation === "non_cop") return "Participant";

  switch (role) {
    case "organizer":
      return "Organizer";
    case "protocol":
      return "Protocol Member";
    default:
      return "Participant";
  }
}

/** True when this person should be asked the role question. */
export function shouldAskRole(
  isFacilitator: FacilitatorValue,
  affiliation: AffiliationValue | "",
): boolean {
  if (isFacilitator !== "no") return false;
  return affiliation === "habitat" || affiliation === "cop_other";
}
