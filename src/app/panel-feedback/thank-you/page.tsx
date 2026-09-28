import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: "Thank you",
  description: `Your panel evaluation for ${EVENT.name} has been received.`,
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ again?: string }>;
};

export default async function PanelFeedbackThankYouPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const replaced = query.again === "1";

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-cream">
        <div className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm sm:p-10">
            <span
              className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-50 text-green-700"
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>

            <h1 className="mt-4 font-display text-3xl uppercase tracking-tight sm:text-4xl">
              Thank you
            </h1>
            <p className="mt-3 text-ink-muted">
              Your panel evaluation of {EVENT.name} has been received.
              {replaced
                ? " It replaced your earlier response - we only keep the latest one."
                : ""}
            </p>

            <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm text-ink-muted">
              Your answers go straight to the organizing team. Thank you for
              giving your time to the panel and to the singles who came to
              listen.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="rounded-full bg-brand-red px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark"
              >
                Back to event
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            {EVENT.host} &middot; {EVENT.district} &middot; {EVENT.assembly}
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
