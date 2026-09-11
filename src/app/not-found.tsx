import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream">
        <div className="mx-auto w-full max-w-md px-4 py-20 text-center sm:px-6">
          <p className="font-display text-6xl font-bold text-brand-red">404</p>
          <h1 className="mt-4 font-display text-3xl uppercase tracking-tight">
            Page not found
          </h1>
          <p className="mt-3 text-ink-muted">
            The page or ticket you are looking for does not exist. Check the link
            or look up your ticket.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-ink px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-red"
            >
              Back to event
            </Link>
            <Link
              href="/find"
              className="rounded-full border border-line bg-white px-6 py-3 font-semibold text-ink transition-colors hover:border-brand-red hover:text-brand-red"
            >
              Find my ticket
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
