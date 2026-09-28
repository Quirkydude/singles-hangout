import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { EVENT } from "@/lib/event";
import PanelFeedbackForm from "./PanelFeedbackForm";

export const metadata: Metadata = {
  title: "Panelists' evaluation form",
  description: `For the panelists of ${EVENT.name}: how the panel was prepared, moderated and received.`,
  alternates: { canonical: "/panel-feedback" },
  // Sent to the panel directly rather than advertised, so it stays out of search.
  robots: { index: false, follow: false },
};

export default function PanelFeedbackPage() {
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
            Panelists&apos; evaluation form
          </h1>
          <p className="mt-3 text-ink-muted">
            Thank you for sitting on the panel at {EVENT.name} &middot;{" "}
            {EVENT.theme}. Please tell us how it went from where you sat: six
            short sections, about three minutes. Your honest view of the
            preparation, the moderation and the audience helps us run a better
            panel next time.
          </p>

          <p className="mt-5 rounded-xl bg-white px-4 py-3 text-sm text-ink-muted shadow-sm">
            Venue: {EVENT.venue} &middot; {EVENT.dateLabel}. One evaluation per
            panelist - if you submit twice, we keep the latest answers.
          </p>

          <div className="mt-8">
            <PanelFeedbackForm />
          </div>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Any questions? Speak to any {EVENT.ministry} leader at{" "}
            {EVENT.assembly}.
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
