/**
 * Ghana phone number normalisation.
 *
 * Moolre expects the international form without a leading "+", e.g.
 * 0241234567 -> 233241234567
 */

const GH_MOBILE = /^233[25]\d{8}$/;

/**
 * Accepts the common ways people type their number and returns the
 * canonical 233XXXXXXXXX form, or null when the number is not a valid
 * Ghanaian mobile number.
 */
export function normalizeGhanaPhone(input: string): string | null {
  if (!input) return null;

  // Strip everything that is not a digit (spaces, dashes, +, parentheses).
  let digits = input.replace(/\D/g, "");
  if (!digits) return null;

  // 00233... -> 233...
  if (digits.startsWith("00233")) digits = digits.slice(2);

  if (digits.startsWith("233")) {
    // already international
  } else if (digits.startsWith("0") && digits.length === 10) {
    // local form: 0241234567 -> 233241234567
    digits = `233${digits.slice(1)}`;
  } else if (/^[25]\d{8}$/.test(digits)) {
    // typed without the leading zero: 241234567
    digits = `233${digits}`;
  }

  return GH_MOBILE.test(digits) ? digits : null;
}

/** 233241234567 -> 024 123 4567 (for display only). */
export function formatPhoneForDisplay(normalized: string): string {
  if (!GH_MOBILE.test(normalized)) return normalized;
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/** Masks the middle of a number for public display: 024 *** 4567 */
export function maskPhone(normalized: string): string {
  const display = formatPhoneForDisplay(normalized);
  const digits = display.replace(/\D/g, "");
  if (digits.length < 7) return display;
  return `${digits.slice(0, 3)} *** ${digits.slice(-4)}`;
}
