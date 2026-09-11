import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { FindTicketForm } from "./FindTicketForm";

export const metadata: Metadata = {
  title: "Find my ticket",
  description: "Look up your Single's Hangout 2026 registration code.",
  robots: { index: false, follow: true },
};

export default function FindTicketPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-cream">
        <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6 sm:py-16">
          <Link
            href="/"
            className="text-sm font-semibold text-ink-muted transition-colors hover:text-brand-red"
          >
            &larr; Back to event
          </Link>

          <h1 className="mt-4 font-display text-4xl uppercase tracking-tight">
            Find my ticket
          </h1>
          <p className="mt-2 text-ink-muted">
            Enter your registration code, or the phone number you used, to reopen
            your ticket.
          </p>

          <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <FindTicketForm />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
