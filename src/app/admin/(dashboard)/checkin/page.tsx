import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPhoneForDisplay } from "@/lib/phone";
import { CheckInForm } from "./CheckInForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Check-in",
  robots: { index: false, follow: false },
};

export default async function CheckInPage() {
  const [attended, total, recent] = await Promise.all([
    prisma.registration.count({ where: { attended: true } }),
    prisma.registration.count(),
    prisma.registration.findMany({
      where: { attended: true },
      orderBy: { checkedInAt: "desc" },
      take: 10,
      select: {
        id: true,
        code: true,
        fullName: true,
        phone: true,
        checkedInAt: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight">
            Check-in
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Scan a ticket QR or type the code to admit an attendee.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-5 py-3 text-right">
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
            Checked in
          </p>
          <p className="font-display text-2xl font-bold">
            {attended}
            <span className="text-base font-medium text-ink-muted"> / {total}</span>
          </p>
        </div>
      </div>

      <CheckInForm />

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Recently checked in
        </h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Nobody yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recent.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-semibold">{row.fullName}</p>
                  <p className="text-xs text-ink-muted">
                    {formatPhoneForDisplay(row.phone)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-brand-red">
                    {row.code}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {row.checkedInAt
                      ? new Date(row.checkedInAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
