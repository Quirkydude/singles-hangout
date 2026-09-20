import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPhoneForDisplay } from "@/lib/phone";
import { getEventSettings } from "@/lib/settings";
import { ManageForm } from "./ManageForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage registrations",
  robots: { index: false, follow: false },
};

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "removed" ? "removed" : "active";

  const [settings, rows] = await Promise.all([
    getEventSettings(),
    prisma.registration.findMany({
      where: { removed: view === "removed" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        code: true,
        fullName: true,
        phone: true,
        age: true,
        affiliation: true,
        role: true,
        isFacilitator: true,
      },
    }),
  ]);

  const manageRows = rows.map((row) => ({
    id: row.id,
    code: row.code,
    fullName: row.fullName,
    // Display form is easier to scan and harder to mis-dial than 233...
    phone: formatPhoneForDisplay(row.phone),
    age: row.age,
    affiliation: row.affiliation,
    role: row.role,
    isFacilitator: row.isFacilitator,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">
          Manage registrations
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Remove people to free their spot. Removed people are kept on file so
          they cannot register again, and their code stops working everywhere.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white px-5 py-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
            Active
          </p>
          <p className="mt-1 font-display text-2xl font-bold">
            {settings.registeredCount}
          </p>
          <p className="text-xs text-ink-muted">Holding a spot</p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-5 py-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
            Removed
          </p>
          <p className="mt-1 font-display text-2xl font-bold">
            {settings.removedCount}
          </p>
          <p className="text-xs text-ink-muted">Blocked from re-registering</p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-5 py-4">
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
            Spots left
          </p>
          <p className="mt-1 font-display text-2xl font-bold">
            {settings.spotsLeft}
          </p>
          <p className="text-xs text-ink-muted">of {settings.capacity}</p>
        </div>
      </div>

      <ManageForm rows={manageRows} view={view} />
    </div>
  );
}
