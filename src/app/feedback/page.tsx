import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { prisma } from "@/lib/prisma";
import { EVENT } from "@/lib/event";
import { normalizeCodeInput } from "@/lib/codes";
import { formatPhoneForDisplay } from "@/lib/phone";
import FeedbackForm, { type FeedbackPrefill } from "./FeedbackForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Evaluation form",
  description: `Tell us how ${EVENT.name} went. Ten quick questions in four steps, about two minutes, and a thank-you SMS when you submit.`,
  alternates: { canonical: "/feedback" },
};

type PageProps = {
  searchParams: Promise<{ code?: string }>;
};

const BLANK_PREFILL: FeedbackPrefill = { fullName: "", phone: "" };

/**
 * When the link came from a ticket we already know who is answering, so the
 * first step arrives filled in. They can still change either field.
 */
async function prefillFromCode(
  code: string | undefined,
): Promise<FeedbackPrefill> {
  if (!code) return BLANK_PREFILL;

  const normalized = normalizeCodeInput(code);
  if (!normalized.startsWith("SH26-")) return BLANK_PREFILL;

  const registration = await prisma.registration.findUnique({
    where: { code: normalized },
    select: { fullName: true, phone: true, removed: true },
  });

  if (!registration || registration.removed) return BLANK_PREFILL;

  return {
    fullName: registration.fullName,
    // Shown back the way the person typed it, not as 233241234567.
    phone: formatPhoneForDisplay(registration.phone),
  };
}

export default async function FeedbackPage({ searchParams }: PageProps) {
  const { code } = await searchParams;
  const prefill = await prefillFromCode(code);

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-cream">
        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/"
            className="text-sm font-semibold text-ink-muted transition-colors hover:text-brand-red"
          >
            &larr; Back to event
          </Link>

          <h1 className="mt-4 font-display text-4xl uppercase tracking-tight sm:text-5xl">
            Evaluation form
          </h1>
          <p className="mt-3 text-ink-muted">
            Thank you for being part of {EVENT.name} &middot; {EVENT.theme}.
            Please tell us how it went: ten quick questions in four steps,
            about two minutes. Every answer helps us plan the next edition.
          </p>

          <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm text-ink-muted shadow-sm">
            One evaluation per phone number - if you submit twice, we keep the
            latest answers. You will receive a thank-you SMS straight away.
          </p>

          <div className="mt-8">
            <FeedbackForm prefill={prefill} />
          </div>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Prefer paper? Speak to any {EVENT.ministry} leader at{" "}
            {EVENT.assembly}.
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
