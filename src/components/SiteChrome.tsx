import Image from "next/image";
import Link from "next/link";
import { EVENT } from "@/lib/event";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src={EVENT.logo}
            alt={`${EVENT.host} - ${EVENT.assembly}`}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold tracking-tight text-ink sm:text-base">
              Single&apos;s Hangout
              <span className="ml-1.5 font-semibold text-brand-red">2026</span>
            </span>
            <span className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              {EVENT.host} &middot; {EVENT.assembly}
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm font-semibold">
          <Link
            href="/find"
            className="hidden text-ink-muted transition-colors hover:text-ink sm:block"
          >
            Find my ticket
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-ink px-4 py-2 text-white transition-colors hover:bg-brand-red"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-ink text-white/70">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Image
              src={EVENT.logoWhite}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 object-contain"
              aria-hidden
            />
            <div>
              <p className="font-display text-base font-bold text-white">
                {EVENT.name}
              </p>
              <p className="mt-1 text-sm">
                {EVENT.host} &middot; {EVENT.district}
              </p>
              <p className="text-sm">
                {EVENT.assembly} &middot; {EVENT.ministry}
              </p>
            </div>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-white">Need help?</p>
            <p className="mt-1">
              Speak to any {EVENT.ministry} leader at {EVENT.assembly}.
            </p>
          </div>
        </div>

        <p className="mt-8 border-t border-white/10 pt-6 text-xs text-white/40">
          Registration is free. Strictly {EVENT.minAge}+ only.
        </p>
      </div>
    </footer>
  );
}
