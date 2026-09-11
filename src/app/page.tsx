import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SpotsLeft } from "@/components/SpotsLeft";
import { EVENT, getMapsUrl } from "@/lib/event";
import { getEventSettingsSafe } from "@/lib/settings";

export const dynamic = "force-dynamic";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
        {label}
      </dt>
      <dd className="font-display text-base font-bold text-ink sm:text-lg">
        {value}
      </dd>
    </div>
  );
}

export default async function HomePage() {
  const settings = await getEventSettingsSafe();
  const registrationBlocked = !settings.registrationOpen || settings.isFull;

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden border-b border-line bg-ink text-white">
          <div
            className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-red/25 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-16">
            <div className="animate-rise">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-brand-red-light">
                {EVENT.host} &middot; {EVENT.district}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                {EVENT.assembly} &middot; {EVENT.ministry}
              </p>

              <h1 className="mt-5 font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Single&apos;s
                <span className="block text-brand-red">Hangout 2026</span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
                {EVENT.tagline} An afternoon of honest conversation, panel talks,
                games and connection with other singles.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-white/10 py-6">
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-brand-red-light">
                    Date
                  </dt>
                  <dd className="mt-0.5 font-display text-base font-bold sm:text-lg">
                    26 Sept 2026
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-brand-red-light">
                    Time
                  </dt>
                  <dd className="mt-0.5 font-display text-base font-bold sm:text-lg">
                    {EVENT.timeLabel}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-brand-red-light">
                    Venue
                  </dt>
                  <dd className="mt-0.5 font-display text-base font-bold sm:text-lg">
                    {EVENT.venueDetail}, {EVENT.venue}
                  </dd>
                </div>
              </dl>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {registrationBlocked ? (
                  <span className="rounded-full bg-white/10 px-6 py-3.5 font-display text-base font-bold uppercase tracking-wide text-white/70">
                    {settings.isFull ? "Registration full" : "Registration closed"}
                  </span>
                ) : (
                  <Link
                    href="/register"
                    className="rounded-full bg-brand-red px-7 py-3.5 font-display text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-brand-red/25 transition-colors hover:bg-brand-red-dark"
                  >
                    Register free
                  </Link>
                )}
                <Link
                  href="/find"
                  className="rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white/85 transition-colors hover:border-white/60 hover:text-white"
                >
                  Already registered?
                </Link>
              </div>

              <div className="mt-5">
                <SpotsLeft
                  settings={settings}
                  className="border-white/15 bg-white/5 text-white/85"
                />
                <p className="mt-3 text-xs text-white/50">
                  Strictly {EVENT.minAge}+ &middot; 100% free &middot; Registration
                  required
                </p>
              </div>
            </div>

            {/* Flyer */}
            <div className="animate-rise mx-auto w-full max-w-sm lg:max-w-none">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl">
                <Image
                  src="/flyer.jpg"
                  alt={`${EVENT.name} flyer - ${EVENT.dateLabel} at ${EVENT.venue}`}
                  width={1200}
                  height={1500}
                  className="h-auto w-full rounded-xl"
                  priority
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 460px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* What to expect                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
            What to expect
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Come as you are. Everything is planned to help you relax, learn and
            meet people genuinely.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT.activities.map((activity) => (
              <li
                key={activity}
                className="flex items-center gap-3 rounded-xl border border-line bg-cream px-4 py-4"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-red text-white"
                  aria-hidden
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="font-semibold text-ink">{activity}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Details                                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-y border-line bg-cream">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
              Event details
            </h2>

            <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <DetailRow label="Date" value="Sat, 26 Sept 2026" />
              <DetailRow label="Time" value={EVENT.timeLabel} />
              <DetailRow
                label="Venue"
                value={`${EVENT.venueDetail}, ${EVENT.venue}`}
              />
              <DetailRow label="Entry" value="Free (23+ only)" />
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={getMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand-red hover:text-brand-red"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Open in Google Maps
              </a>
              <p className="text-sm text-ink-muted">{EVENT.address}</p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* How registration works                                           */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
            How registration works
          </h2>

          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Fill the form",
                body: "Your name, location, phone number and age. It takes under a minute.",
              },
              {
                title: "Get your code",
                body: "We text your registration code straight to your phone.",
              },
              {
                title: "Show it at the door",
                body: "Bring the code or its QR on your ticket. That is your entry.",
              },
            ].map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-line p-6">
                <span className="font-display text-3xl font-bold text-brand-red">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-ink px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl uppercase tracking-tight">
                Ready to join us?
              </p>
              <p className="mt-1 text-sm text-white/70">
                Only {EVENT.minAge}+ can register. Spots are limited.
              </p>
            </div>
            {registrationBlocked ? (
              <span className="rounded-full bg-white/10 px-6 py-3 font-display font-bold uppercase tracking-wide text-white/70">
                {settings.isFull ? "Registration full" : "Registration closed"}
              </span>
            ) : (
              <Link
                href="/register"
                className="rounded-full bg-brand-red px-7 py-3.5 font-display font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-red-dark"
              >
                Register free
              </Link>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
