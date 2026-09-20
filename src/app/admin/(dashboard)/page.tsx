import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEventSettings } from "@/lib/settings";
import { formatPhoneForDisplay } from "@/lib/phone";
import { EVENT } from "@/lib/event";
import { MEDIA_ROLE } from "@/lib/registration-options";
import { ResendSmsButton } from "./ResendSmsButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
        {label}
      </p>
      <p className="mt-1.5 font-display text-3xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

const smsBadge: Record<string, string> = {
  SENT: "bg-green-50 text-green-700 border-green-600/20",
  FAILED: "bg-brand-red/5 text-brand-red-dark border-brand-red/25",
  PENDING: "bg-cream text-ink-muted border-line",
};

/** Small labelled count used in the breakdown rows. */
function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
        {title}
      </p>
      <ul className="mt-2.5 space-y-1.5 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-ink-muted">{row.label}</span>
            <strong className="text-ink">{row.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [
    settings,
    registrations,
    attendedCount,
    smsFailedCount,
    facilitatorRows,
    affiliationRows,
    roleRows,
  ] = await Promise.all([
    getEventSettings(),
    prisma.registration.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        code: true,
        fullName: true,
        phone: true,
        location: true,
        isFacilitator: true,
        affiliation: true,
        role: true,
        removed: true,
        age: true,
        gender: true,
        panelQuestion: true,
        smsStatus: true,
        attended: true,
        createdAt: true,
      },
    }),
    prisma.registration.count({ where: { attended: true } }),
    prisma.registration.count({ where: { smsStatus: "FAILED" } }),
    prisma.registration.groupBy({
      by: ["isFacilitator"],
      where: { removed: false },
      _count: { _all: true },
    }),
    prisma.registration.groupBy({
      by: ["affiliation"],
      where: { removed: false },
      _count: { _all: true },
    }),
    prisma.registration.groupBy({
      by: ["role"],
      where: { removed: false },
      _count: { _all: true },
    }),
  ]);

  const facilitatorCount =
    facilitatorRows.find((r) => r.isFacilitator)?._count._all ?? 0;

  const affiliationCounts = new Map(
    affiliationRows.map((r) => [r.affiliation ?? "Not specified", r._count._all]),
  );
  const roleCounts = new Map(
    roleRows.map((r) => [r.role ?? "Not specified", r._count._all]),
  );

  // The media team are pulled out of the attendee pool so the three figures in
  // "Taking part as" stay meaningful, and so their total always reconciles with
  // the active headcount shown in the "Registered" card.
  const mediaCount = roleCounts.get(MEDIA_ROLE) ?? 0;
  const attendeeCount = Math.max(
    0,
    settings.registeredCount - facilitatorCount - mediaCount,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {EVENT.name} &middot; {EVENT.dateLabel}
          </p>
        </div>
        <a
          href="/api/admin/export"
          className="rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark"
        >
          Export CSV
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered"
          value={settings.registeredCount}
          hint={`${settings.capacity} capacity`}
        />
        <StatCard
          label="Spots left"
          value={settings.spotsLeft}
          hint={settings.isFull ? "Registration is full" : "Still accepting"}
        />
        <StatCard
          label="Checked in"
          value={attendedCount}
          hint="At the door"
        />
        <StatCard
          label="Removed"
          value={settings.removedCount}
          hint={
            settings.removedCount > 0
              ? "Blocked from re-registering"
              : "Nobody removed"
          }
        />
        <StatCard
          label="SMS failed"
          value={smsFailedCount}
          hint={smsFailedCount > 0 ? "Use Resend SMS below" : "All delivered"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Breakdown
          title="Role"
          rows={[
            { label: "Organizer", value: roleCounts.get("Organizer") ?? 0 },
            {
              label: "Protocol Member",
              value: roleCounts.get("Protocol Member") ?? 0,
            },
            { label: "Participant", value: roleCounts.get("Participant") ?? 0 },
            { label: "Media", value: roleCounts.get(MEDIA_ROLE) ?? 0 },
          ]}
        />
        <Breakdown
          title="Affiliation"
          rows={[
            {
              label: "Habitat Assembly",
              value: affiliationCounts.get("Habitat Assembly") ?? 0,
            },
            {
              label: "Other COP",
              value: affiliationCounts.get("Other COP Assembly") ?? 0,
            },
            { label: "Non-COP", value: affiliationCounts.get("Non-COP") ?? 0 },
            {
              label: "Not specified",
              value: affiliationCounts.get("Not specified") ?? 0,
            },
          ]}
        />
        <Breakdown
          title="Taking part as"
          rows={[
            { label: "Attendees", value: attendeeCount },
            { label: "Facilitators", value: facilitatorCount },
            { label: "Media", value: mediaCount },
          ]}
        />
        <div className="flex flex-col justify-center rounded-2xl border border-line bg-white px-5 py-4 text-sm">
          <span className="text-ink-muted">
            Registration is{" "}
            <strong className="text-ink">
              {settings.registrationOpen ? "open" : "closed"}
            </strong>
          </span>
          <span className="mt-1 text-ink-muted">
            Capacity <strong className="text-ink">{settings.capacity}</strong>,
            spots left <strong className="text-ink">{settings.spotsLeft}</strong>
          </span>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">
            Registrations
          </h2>
          <span className="text-xs text-ink-muted">
            Showing {registrations.length}
            {registrations.length === 200 ? " most recent" : ""}
          </span>
        </div>

        {registrations.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white px-5 py-10 text-center text-sm text-ink-muted">
            No registrations yet.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-cream text-[0.68rem] uppercase tracking-widest text-ink-muted">
                  <tr>
                    <th className="px-4 py-3 font-bold">Code</th>
                    <th className="px-4 py-3 font-bold">Name</th>
                    <th className="px-4 py-3 font-bold">Phone</th>
                    <th className="px-4 py-3 font-bold">Location</th>
                    <th className="px-4 py-3 font-bold">Age</th>
                    <th className="px-4 py-3 font-bold">Role</th>
                    <th className="px-4 py-3 font-bold">Fellowship</th>
                    <th className="px-4 py-3 font-bold">SMS</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-semibold text-brand-red">
                        <Link href={`/ticket/${row.code}`} className="hover:underline">
                          {row.code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{row.fullName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                        {formatPhoneForDisplay(row.phone)}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{row.location}</td>
                      <td className="px-4 py-3 text-ink-muted">{row.age}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {row.role === MEDIA_ROLE
                          ? "Media"
                          : row.isFacilitator
                            ? "Facilitator"
                            : (row.role ?? "Participant")}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {row.isFacilitator
                          ? "-"
                          : (row.affiliation ?? "Not specified")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                            smsBadge[row.smsStatus] ?? smsBadge.PENDING
                          }`}
                        >
                          {row.smsStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.attended ? (
                          <span className="text-[0.7rem] font-bold uppercase text-green-700">
                            Checked in
                          </span>
                        ) : (
                          <span className="text-[0.7rem] font-bold uppercase text-ink-muted">
                            Not yet
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <ResendSmsButton code={row.code} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 lg:hidden">
              {registrations.map((row) => (
                <li
                  key={row.id}
                  className="rounded-2xl border border-line bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.fullName}</p>
                      <p className="text-sm text-ink-muted">
                        {formatPhoneForDisplay(row.phone)}
                      </p>
                    </div>
                    <Link
                      href={`/ticket/${row.code}`}
                      className="shrink-0 font-display text-sm font-bold text-brand-red"
                    >
                      {row.code}
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-bold uppercase">
                    <span className="rounded-full bg-cream px-2 py-0.5 text-ink-muted">
                      {row.age} yrs
                    </span>
                    <span className="rounded-full bg-cream px-2 py-0.5 text-ink-muted">
                      {row.location}
                    </span>
                    <span className="rounded-full bg-cream px-2 py-0.5 text-ink-muted">
                      {row.role === MEDIA_ROLE
                        ? "Media"
                        : row.isFacilitator
                          ? "Facilitator"
                          : (row.role ?? "Participant")}
                    </span>
                    <span className="rounded-full bg-cream px-2 py-0.5 text-ink-muted">
                      {row.isFacilitator
                        ? "-"
                        : (row.affiliation ?? "Not specified")}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 ${
                        smsBadge[row.smsStatus] ?? smsBadge.PENDING
                      }`}
                    >
                      {row.smsStatus}
                    </span>
                    {row.attended ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">
                        Checked in
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <ResendSmsButton code={row.code} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
