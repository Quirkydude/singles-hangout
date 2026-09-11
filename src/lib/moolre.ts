import "server-only";

/**
 * Moolre SMS (Open API).
 * Docs: POST https://api.moolre.com/open/sms/send
 * Auth: X-API-VASKEY header. Body: { type: 1, senderid, messages[] }.
 *
 * Mirrors the working integration in QuickX/Backend/services/sms.js.
 */

const MOOLRE_ENDPOINT = "https://api.moolre.com/open/sms/send";
const MAX_SMS_LENGTH = 160;

export type SendSmsResult = {
  ok: boolean;
  /** Moolre response code, e.g. SMS01 on success. */
  code?: string;
  message: string;
  dryRun?: boolean;
};

function isDryRun(): boolean {
  return (
    process.env.SMS_DRY_RUN === "true" || !process.env.MOOLRE_API_KEY?.trim()
  );
}

/** Collapses whitespace and keeps the message inside one SMS segment. */
export function buildSmsText(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_SMS_LENGTH) return collapsed;
  return `${collapsed.slice(0, MAX_SMS_LENGTH - 1).trimEnd()}...`;
}

export async function sendSms(
  recipient: string,
  message: string,
): Promise<SendSmsResult> {
  const text = buildSmsText(message);
  const senderId = process.env.MOOLRE_SENDER_ID?.trim() || "Hangout26";

  if (isDryRun()) {
    const reason = process.env.MOOLRE_API_KEY?.trim()
      ? "SMS_DRY_RUN is enabled"
      : "MOOLRE_API_KEY is not configured";
    console.log(`[SMS MOCK] (${reason}) To: ${recipient} :: ${text}`);
    return {
      ok: true,
      code: "DRYRUN",
      message: "Logged to console (SMS not actually sent).",
      dryRun: true,
    };
  }

  try {
    const response = await fetch(MOOLRE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-VASKEY": process.env.MOOLRE_API_KEY!.trim(),
      },
      body: JSON.stringify({
        type: 1,
        senderid: senderId,
        messages: [{ recipient, message: text, ref: `sh26_${Date.now()}` }],
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });

    const raw = (await response.json().catch(() => null)) as
      | { status?: number; code?: string; message?: string }
      | null;

    if (response.ok && raw?.status === 1) {
      return {
        ok: true,
        code: raw.code ?? "SMS01",
        message: raw.message ?? "Success",
      };
    }

    const message_ =
      raw?.message ??
      `Moolre returned HTTP ${response.status} with an unexpected body.`;

    console.error("[Moolre] send failed:", {
      httpStatus: response.status,
      code: raw?.code,
      message: message_,
    });

    return { ok: false, code: raw?.code, message: message_ };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown network error";
    console.error("[Moolre] request error:", reason);
    return { ok: false, message: `Could not reach Moolre: ${reason}` };
  }
}
