import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SpotsLeft } from "@/components/SpotsLeft";
import { EVENT, getMapsUrl, getSiteUrl, whatsappShareText } from "@/lib/event";
import { getEventSettingsSafe } from "@/lib/settings";

export const dynamic = "force-dynamic";

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PinIcon() {
  return (
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
  );
}

function CalendarIcon() {
  return (
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
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RegisterButton({
  blocked,
  isFull,
  size = "lg",
}: {
  blocked: boolean;
  isFull: boolean;
  size?: "lg" | "sm";
}) {
  const base =
    size === "lg"
      ? "px-7 py-3.5 font-display text-base"
      : "px-5 py-2.5 text-sm";

  if (blocked) {
    return (
      <span
        className={`rounded-full bg-white/10 font-display font-bold uppercase tracking-wide text-white/70 ${base}`}
      >
        {isFull ? "Registration full" : "Registration closed"}
      </span>
    );
  }

  return (
    <Link
      href="/register"
      className={`rounded-full bg-brand-red font-display font-bold uppercase tracking-wide text-white shadow-lg shadow-brand-red/25 transition-colors hover:bg-brand-red-dark ${base}`}
    >
      Register free
    </Link>
  );
}

/** Compact detail chip used across the hero and details sections. */
function Fact({
  icon,
  label,
  value,
  tone = "dark",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "dark" | "light";
}) {
  const labelColor = tone === "dark" ? "text-brand-red-light" : "text-brand-red";
  const valueColor = tone === "dark" ? "text-white" : "text-ink";

  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
          tone === "dark" ? "bg-white/10 text-white" : "bg-brand-red/10 text-brand-red"
        }`}
      >
        {icon}
      </span>
      <div>
        <p
          className={`text-[0.62rem] font-bold uppercase tracking-[0.16em] ${labelColor}`}
        >
          {label}
        </p>
        <p className={`mt-0.5 font-display text-base font-bold sm:text-lg ${valueColor}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const settings = await getEventSettingsSafe();
  const blocked = !settings.registrationOpen || settings.isFull;
  const shareUrl = `${getSiteUrl()}/register`;
  const waShare = `https://wa.me/?text=${encodeURIComponent(
    whatsappShareText(shareUrl),
  )}`;

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* ============================================================== */}
        {/* Hero                                                            */}
        {/* ============================================================== */}
        <section className="relative overflow-hidden bg-ink text-white">
          <div
            className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-red/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-52 -left-40 h-[26rem] w-[26rem] rounded-full bg-brand-red/10 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-16">
            <div className="animate-rise">
              <div className="flex items-center gap-3">
                <Image
                  src={EVENT.logoWhite}
                  alt={`${EVENT.host} - ${EVENT.assembly}`}
                  width={52}
                  height={52}
                  className="h-13 w-13 object-contain"
                  priority
                />
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-red-light">
                    {EVENT.host}
                  </p>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/55">
                    {EVENT.district} &middot; {EVENT.assembly}
                  </p>
                </div>
              </div>

              <h1 className="mt-6 font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Single&apos;s
                <span className="block text-brand-red">Hangout 2026</span>
              </h1>

              <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border-2 border-brand-red/70 px-4 py-1.5">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/55">
                  Theme
                </span>
                <span className="font-display text-sm font-bold uppercase tracking-[0.1em] text-brand-red-light">
                  {EVENT.theme}
                </span>
              </div>

              <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
                {EVENT.tagline} An afternoon of honest conversation, panel
                talks, games and genuine connection with other singles.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-5 border-y border-white/10 py-6 sm:grid-cols-3">
                <Fact
                  icon={<CalendarIcon />}
                  label="Date"
                  value="26 Sept 2026"
                />
                <Fact icon={<ClockIcon />} label="Time" value={EVENT.timeLabel} />
                <Fact
                  icon={<PinIcon />}
                  label="Venue"
                  value={EVENT.venue}
                />
              </div>

              <p className="mt-3 text-xs text-white/45">{EVENT.address}</p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <RegisterButton blocked={blocked} isFull={settings.isFull} />
                <Link
                  href="/find"
                  className="rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white/85 transition-colors hover:border-white/60 hover:text-white"
                >
                  Already registered?
                </Link>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <SpotsLeft
                  settings={settings}
                  className="border-white/15 bg-white/5 text-white/85"
                />
                <a
                  href={waShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-semibold text-white/85 transition-colors hover:border-white/40"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
                  </svg>
                  Share
                </a>
              </div>

              <p className="mt-3 text-xs text-white/45">
                Strictly {EVENT.minAge}+ &middot; 100% free &middot; Registration
                required
              </p>
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

        {/* ============================================================== */}
        {/* Stats strip                                                     */}
        {/* ============================================================== */}
        <section className="border-b border-line bg-brand-red text-white">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-2 divide-white/20 px-4 sm:grid-cols-4 sm:divide-x sm:px-6">
            {[
              { value: "23+", label: "Age limit" },
              { value: "5", label: "Activities" },
              { value: "100%", label: "Free entry" },
              { value: "1", label: "Afternoon" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-2 py-6 text-center sm:py-7"
              >
                <p className="font-display text-3xl font-bold sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/80">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================== */}
        {/* Theme / intro                                                   */}
        {/* ============================================================== */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-red">
                Our theme
              </p>
              <h2 className="mt-2 font-display text-4xl uppercase leading-tight tracking-tight sm:text-5xl">
                Before the Ring
              </h2>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-ink-muted">
              <p>
                Marriage is a decision, not a deadline. Before the ring there is
                a season for asking honest questions, learning from people a few
                steps ahead of you, and being deliberate about the kind of
                person you are becoming.
              </p>
              <p>
                This afternoon is about that season. No pressure, no
                matchmaking, no performance - just real stories, straight
                answers and good company.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* What to expect                                                  */}
        {/* ============================================================== */}
        <section className="border-y border-line bg-cream">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
              What to expect
            </h2>
            <p className="mt-2 max-w-2xl text-ink-muted">
              Come as you are. Everything is planned to help you relax, learn
              and meet people genuinely.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EVENT.activities.map((activity) => (
                <li
                  key={activity.title}
                  className="flex flex-col rounded-2xl border border-line bg-white p-5"
                >
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full bg-brand-red text-white"
                    aria-hidden
                  >
                    <CheckIcon />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                    {activity.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {activity.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================================== */}
        {/* How registration works                                          */}
        {/* ============================================================== */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
            How registration works
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Three steps, under a minute. Only {settings.spotsLeft}{" "}
            {settings.spotsLeft === 1 ? "spot" : "spots"} remain out of{" "}
            {settings.capacity}.
          </p>

          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Fill the form",
                body: `Your name, location, phone number and age. Open to singles aged ${EVENT.minAge} and above.`,
              },
              {
                title: "Get your code",
                body: "We text your registration code straight to your phone within seconds.",
              },
              {
                title: "Show it at the door",
                body: "Bring the code or its QR on your ticket. That is your entry - no printing needed.",
              },
            ].map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-line p-6"
              >
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
        </section>

        {/* ============================================================== */}
        {/* Event details                                                   */}
        {/* ============================================================== */}
        <section className="border-y border-line bg-ink text-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
              Event details
            </h2>

            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Fact
                icon={<CalendarIcon />}
                label="Date"
                value={EVENT.dateShort}
              />
              <Fact icon={<ClockIcon />} label="Time" value={EVENT.timeLabel} />
              <Fact icon={<PinIcon />} label="Venue" value={EVENT.venue} />
              <Fact
                icon={<CheckIcon />}
                label="Entry"
                value={`Free - ${EVENT.minAge}+`}
              />
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4 border-t border-white/10 pt-7">
              <a
                href={getMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-brand-red hover:text-white"
              >
                <PinIcon />
                Open in Google Maps
              </a>
              <p className="text-sm text-white/55">{EVENT.address}</p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* Closing CTA                                                     */}
        {/* ============================================================== */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-brand-red px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
            <div>
              <p className="font-display text-3xl uppercase leading-tight tracking-tight sm:text-4xl">
                Ready to join us?
              </p>
              <p className="mt-2 max-w-md text-sm text-white/85">
                {settings.spotsLeft} of {settings.capacity} spots left. Only{" "}
                {EVENT.minAge}+ can register, and entry is completely free.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3">
              <RegisterButton blocked={blocked} isFull={settings.isFull} />
              <a
                href={waShare}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/40 px-7 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Invite a friend
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
