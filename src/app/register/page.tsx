import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SpotsLeft } from "@/components/SpotsLeft";
import { EVENT } from "@/lib/event";
import { getEventSettingsSafe } from "@/lib/settings";
import { RegistrationForm } from "./RegistrationForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register",
  description: `Register free for ${EVENT.name} on ${EVENT.dateLabel} at ${EVENT.venue}. Open to singles aged ${EVENT.minAge} and above.`,
  alternates: { canonical: "/register" },
};

export default async function RegisterPage() {
  const settings = await getEventSettingsSafe();
  const blocked = !settings.registrationOpen || settings.isFull;

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-cream">
        <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/"
            className="text-sm font-semibold text-ink-muted transition-colors hover:text-brand-red"
          >
            &larr; Back to event
          </Link>

          <h1 className="mt-4 font-display text-4xl uppercase tracking-tight sm:text-5xl">
            Register
          </h1>
          <p className="mt-2 text-ink-muted">
            {EVENT.name} &middot; {EVENT.dateLabel} &middot; {EVENT.timeLabel}
          </p>

          <div className="mt-4">
            <SpotsLeft settings={settings} />
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            {blocked ? (
              <div className="text-center">
                <h2 className="font-display text-2xl uppercase tracking-tight">
                  {settings.isFull ? "Registration is full" : "Registration closed"}
                </h2>
                <p className="mt-2 text-ink-muted">
                  {settings.isFull
                    ? `All ${settings.capacity} spots have been taken. Please speak to a ${EVENT.ministry} leader about the next edition.`
                    : "Registration for this event is not open right now. Please check back soon."}
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-red"
                >
                  Back to event details
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-xl bg-cream px-4 py-3 text-sm text-ink-muted">
                  This event is strictly for singles aged{" "}
                  <strong className="text-ink">{EVENT.minAge} and above</strong>.
                  Registration is free.
                </div>
                <RegistrationForm spotsLeft={settings.spotsLeft} />
              </>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
