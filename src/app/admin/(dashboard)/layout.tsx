import Link from "next/link";
import { logoutAction } from "../actions";
import { EVENT } from "@/lib/event";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/checkin", label: "Check-in" },
  { href: "/admin/settings", label: "Settings" },
];

/**
 * Chrome for the signed-in admin pages. The login page sits outside this
 * route group so it renders without the dashboard navigation.
 */
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-display text-sm font-bold tracking-tight"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-red text-[0.65rem] font-black text-white">
                SH
              </span>
              <span className="hidden sm:inline">Admin</span>
            </Link>

            <nav className="flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-cream hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-xs font-semibold text-ink-muted transition-colors hover:text-ink sm:inline"
            >
              View site
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand-red hover:text-brand-red"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-line bg-white px-4 py-4 text-center text-xs text-ink-muted sm:px-6">
        {EVENT.name} &middot; {EVENT.dateLabel}
      </footer>
    </div>
  );
}
