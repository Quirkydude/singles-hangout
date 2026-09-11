import type { Metadata } from "next";
import { getEventSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const settings = await getEventSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Change the cap or pause registration. Values take effect immediately.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-line bg-white p-6">
        <SettingsForm
          capacity={settings.capacity}
          registrationOpen={settings.registrationOpen}
        />
      </div>

      <div className="max-w-2xl rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">
          Current status
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
              Registered
            </dt>
            <dd className="mt-0.5 font-semibold">{settings.registeredCount}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
              Capacity
            </dt>
            <dd className="mt-0.5 font-semibold">{settings.capacity}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
              Spots left
            </dt>
            <dd className="mt-0.5 font-semibold">{settings.spotsLeft}</dd>
          </div>
          <div>
            <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
              Registration
            </dt>
            <dd className="mt-0.5 font-semibold">
              {settings.registrationOpen ? "Open" : "Closed"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
