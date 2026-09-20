"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  removeRegistrationsAction,
  restoreRegistrationsAction,
} from "../../actions";
import { initialAdminState } from "@/lib/form-state";

export type ManageRow = {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  age: number;
  affiliation: string | null;
  role: string | null;
  isFacilitator: boolean;
};

function Notice({ status, message }: { status: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
        status === "error"
          ? "border-brand-red/25 bg-brand-red/5 text-brand-red-dark"
          : "border-green-600/20 bg-green-50 text-green-800"
      }`}
    >
      {message}
    </p>
  );
}

function ActionButton({
  label,
  pendingLabel,
  confirmLabel,
  danger,
  confirming,
  onClick,
}: {
  label: string;
  pendingLabel: string;
  confirmLabel: string;
  danger?: boolean;
  confirming: boolean;
  onClick: () => void;
}) {
  const { pending } = useFormStatus();

  // Two-step: the first click arms the action, the second performs it.
  // Deliberately not window.confirm(), which can be suppressed by the browser.
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
          danger
            ? "bg-brand-red hover:bg-brand-red-dark"
            : "bg-ink hover:bg-ink/80"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
        danger ? "bg-brand-red-dark" : "bg-ink"
      }`}
    >
      {pending ? pendingLabel : confirmLabel}
    </button>
  );
}

function RemoveForm({
  codes,
  names,
  disabled,
}: {
  codes: string[];
  names: string[];
  disabled: boolean;
}) {
  const [state, formAction] = useActionState(
    removeRegistrationsAction,
    initialAdminState,
  );
  const [confirming, setConfirming] = useState(false);

  // Any change to the selection must re-arm the confirmation.
  const [lastCodes, setLastCodes] = useState(codes.join(","));
  if (codes.join(",") !== lastCodes) {
    setLastCodes(codes.join(","));
    setConfirming(false);
  }

  return (
    <div className="space-y-3">
      <Notice status={state.status} message={state.message} />
      <form action={formAction} className="space-y-3">
        {codes.map((code) => (
          <input key={code} type="hidden" name="codes" value={code} />
        ))}

        <div>
          <label
            htmlFor="reason"
            className="block text-xs font-semibold text-ink-muted"
          >
            Reason (optional, for your records only - never sent to them)
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            maxLength={200}
            placeholder="e.g. 22-24 age band review"
            className="mt-1 w-full max-w-md rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-red"
          />
        </div>

        {confirming && codes.length > 0 ? (
          <div className="rounded-xl border-2 border-brand-red bg-brand-red/5 px-4 py-3 text-sm">
            <p className="font-semibold text-brand-red-dark">
              Remove {codes.length} {codes.length === 1 ? "person" : "people"}?
            </p>
            <p className="mt-1 text-ink-muted">
              {names.slice(0, 6).join(", ")}
              {names.length > 6 ? ` and ${names.length - 6} more` : ""}
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              They will receive an SMS telling them their code is no longer
              valid. Their spot is freed and they cannot register again. You can
              restore them later if this is a mistake.
            </p>
          </div>
        ) : null}

        <ActionButton
          label={
            codes.length > 0
              ? `Remove ${codes.length} selected`
              : "Remove selected"
          }
          pendingLabel="Removing..."
          confirmLabel="Yes, remove them and send the SMS"
          danger
          confirming={confirming}
          onClick={() => setConfirming(true)}
        />

        <p className="text-xs text-ink-muted">
          {disabled
            ? "Select people below to remove them."
            : "SMS is sent immediately when you confirm."}
        </p>
      </form>
    </div>
  );
}

function RestoreForm({ codes }: { codes: string[] }) {
  const [state, formAction] = useActionState(
    restoreRegistrationsAction,
    initialAdminState,
  );

  return (
    <div className="space-y-3">
      <Notice status={state.status} message={state.message} />
      <form action={formAction} className="space-y-3">
        {codes.map((code) => (
          <input key={code} type="hidden" name="codes" value={code} />
        ))}
        <button
          type="submit"
          disabled={codes.length === 0}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/80 disabled:opacity-40"
        >
          Restore {codes.length > 0 ? codes.length : ""} selected
        </button>
        <p className="text-xs text-ink-muted">
          Restoring texts them their original code again and takes their spot
          back.
        </p>
      </form>
    </div>
  );
}

export function ManageForm({
  rows,
  view,
}: {
  rows: ManageRow[];
  view: "active" | "removed";
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");

  const filtered = useMemo(() => {
    const min = Number.parseInt(ageMin, 10);
    const max = Number.parseInt(ageMax, 10);
    return rows.filter((row) => {
      if (Number.isFinite(min) && row.age < min) return false;
      if (Number.isFinite(max) && row.age > max) return false;
      return true;
    });
  }, [rows, ageMin, ageMax]);

  // Never keep a selection that the filter has hidden.
  const visibleCodes = filtered.map((r) => r.code);
  const selectedVisible = selected.filter((code) => visibleCodes.includes(code));
  const selectedNames = filtered
    .filter((r) => selectedVisible.includes(r.code))
    .map((r) => r.fullName);

  const allVisibleSelected =
    visibleCodes.length > 0 && selectedVisible.length === visibleCodes.length;

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function toggleAll() {
    setSelected((prev) => {
      const withoutVisible = prev.filter((code) => !visibleCodes.includes(code));
      return allVisibleSelected ? withoutVisible : [...withoutVisible, ...visibleCodes];
    });
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2">
        {(
          [
            { key: "active", label: "Registered" },
            { key: "removed", label: "Removed" },
          ] as const
        ).map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "active" ? "/admin/manage" : "/admin/manage?view=removed"}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              view === tab.key
                ? "bg-ink text-white"
                : "border border-line bg-white text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-white px-5 py-4">
        <div>
          <label htmlFor="ageMin" className="block text-xs font-semibold text-ink-muted">
            Age from
          </label>
          <input
            id="ageMin"
            type="number"
            inputMode="numeric"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            placeholder="e.g. 22"
            className="mt-1 w-24 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-red"
          />
        </div>
        <div>
          <label htmlFor="ageMax" className="block text-xs font-semibold text-ink-muted">
            to
          </label>
          <input
            id="ageMax"
            type="number"
            inputMode="numeric"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            placeholder="e.g. 24"
            className="mt-1 w-24 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-red"
          />
        </div>
        {ageMin || ageMax ? (
          <button
            type="button"
            onClick={() => {
              setAgeMin("");
              setAgeMax("");
            }}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            Clear
          </button>
        ) : null}
        <p className="ml-auto text-sm text-ink-muted">
          Showing <strong className="text-ink">{filtered.length}</strong> of{" "}
          {rows.length}
        </p>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white px-5 py-10 text-center text-sm text-ink-muted">
          {view === "removed"
            ? "Nobody has been removed."
            : "No active registrations."}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white px-5 py-10 text-center text-sm text-ink-muted">
          No one matches that age range.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream text-[0.68rem] uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label="Select all shown"
                    className="h-4 w-4 accent-[var(--color-brand-red)]"
                  />
                </th>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Age</th>
                <th className="px-4 py-3 font-bold">Phone</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Fellowship</th>
                <th className="px-4 py-3 font-bold">Code</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(row.code)}
                      onChange={() => toggle(row.code)}
                      aria-label={`Select ${row.fullName}`}
                      className="h-4 w-4 accent-[var(--color-brand-red)]"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{row.fullName}</td>
                  <td className="px-4 py-3 text-ink-muted">{row.age}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {row.phone}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {row.isFacilitator ? "Facilitator" : (row.role ?? "-")}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {row.isFacilitator ? "-" : (row.affiliation ?? "Not specified")}
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-red">
                    {row.code}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      {rows.length > 0 ? (
        <div className="rounded-2xl border border-line bg-white px-5 py-5">
          {view === "removed" ? (
            <RestoreForm codes={selectedVisible} />
          ) : (
            <RemoveForm
              codes={selectedVisible}
              names={selectedNames}
              disabled={selectedVisible.length === 0}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
