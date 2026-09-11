import { randomInt } from "node:crypto";

/**
 * Registration codes avoid characters that are easy to misread or
 * mishear (0/O, 1/I/L) because people will read them out at the door.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 5;
const PREFIX = "SH26";

export function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return `${PREFIX}-${out}`;
}

/** Normalises user input so `sh26 ab2cd`, `SH26-AB2CD` etc. all match. */
export function normalizeCodeInput(input: string): string {
  const cleaned = (input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.startsWith(PREFIX)) {
    return `${PREFIX}-${cleaned.slice(PREFIX.length)}`;
  }
  return cleaned;
}
