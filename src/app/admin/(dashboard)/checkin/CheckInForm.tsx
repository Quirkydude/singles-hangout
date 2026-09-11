"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { checkInAction } from "../../actions";
import { initialAdminState } from "@/lib/form-state";

type ScanResult = { ok: boolean; text: string };

/**
 * Camera-based check-in scanner.
 *
 * `html5-qrcode` is imported lazily (browser only) so it never runs during
 * SSR. The decoded QR payload is a ticket URL, from which we extract the
 * registration code before submitting.
 */
export function QrScanner({ onCode }: { onCode: (code: string) => void }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(
    null,
  );
  const elementId = "sh26-qr-reader";

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(elementId, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            // Expected payload: https://.../ticket/SH26-XXXXX
            const match = decodedText.match(/SH26-?[A-Z0-9]{4,6}/i);
            const code = match ? match[0].toUpperCase() : decodedText.trim();
            setResult({ ok: true, text: `Scanned ${code}` });
            onCode(match ? code.replace(/^SH26-?/i, "SH26-") : code);
            setActive(false);
          },
          () => {
            /* per-frame decode misses are expected; ignore them */
          },
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not start the camera.";
        setError(
          `${message} You can still type the code manually below. Note: camera access requires HTTPS.`,
        );
        setActive(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            /* already stopped */
          });
      }
    };
  }, [active, onCode]);

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Scan ticket QR
          </h2>
          <p className="text-xs text-ink-muted">
            Point the camera at the QR on the attendee&apos;s ticket.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setResult(null);
            setActive((value) => !value);
          }}
          className={
            active
              ? "rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-brand-red hover:text-brand-red"
              : "rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark"
          }
        >
          {active ? "Stop camera" : "Start camera"}
        </button>
      </div>

      <div
        id={elementId}
        className={
          active
            ? "mt-4 overflow-hidden rounded-xl bg-ink [&_video]:w-full"
            : "hidden"
        }
      />

      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-brand-red">
          {error}
        </p>
      ) : null}

      {result?.ok ? (
        <p className="mt-3 text-sm font-medium text-green-700">{result.text}</p>
      ) : null}
    </div>
  );
}

export function CheckInForm() {
  const [state, formAction] = useActionState(checkInAction, initialAdminState);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // After a scan or a submit, return focus to the input so a volunteer can
  // keep going without touching the screen.
  useEffect(() => {
    inputRef.current?.focus();
  }, [state]);

  return (
    <div className="space-y-5">
      <QrScanner
        onCode={(scanned) => {
          setCode(scanned);
          inputRef.current?.focus();
        }}
      />

      <form action={formAction} className="rounded-2xl border border-line bg-white p-5">
        <label htmlFor="code" className="block text-sm font-semibold text-ink">
          Registration code
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="code"
            name="code"
            ref={inputRef}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="SH26-XXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-lg font-semibold uppercase tracking-wider outline-none focus:border-brand-red"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-ink px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-red"
          >
            Check in
          </button>
        </div>

        {state.message ? (
          <div
            role="alert"
            aria-live="polite"
            className={
              state.status === "success"
                ? "mt-4 rounded-xl border border-green-600/25 bg-green-50 px-4 py-3 text-base font-semibold text-green-800"
                : "mt-4 rounded-xl border border-brand-red/25 bg-brand-red/5 px-4 py-3 text-base font-semibold text-brand-red-dark"
            }
          >
            {state.message}
          </div>
        ) : null}
      </form>
    </div>
  );
}
