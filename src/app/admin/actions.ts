"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  passwordMatches,
} from "@/lib/auth";
import { normalizeCodeInput } from "@/lib/codes";
import { SETTING_KEYS } from "@/lib/settings";
import { sendRegistrationSms, removeRegistrations, restoreRegistrations } from "@/lib/registration";
import type { AdminActionState } from "@/lib/form-state";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("/admin/login")) {
    return "/admin";
  }
  return value;
}

export async function loginAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return {
      status: "error",
      message:
        "Admin access is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.",
    };
  }

  if (!passwordMatches(password)) {
    // Small delay to blunt brute-force attempts.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { status: "error", message: "Incorrect password." };
  }

  const token = await createSessionToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function resendSmsAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const code = normalizeCodeInput(String(formData.get("code") ?? ""));
  if (!code) return { status: "error", message: "Missing registration code." };

  const registration = await prisma.registration.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      fullName: true,
      phone: true,
      removed: true,
    },
  });
  if (!registration) {
    return { status: "error", message: "Registration not found." };
  }

  // Re-sending an invalidated code would be misleading.
  if (registration.removed) {
    return {
      status: "error",
      message: `${registration.fullName} was removed, so this code is no longer valid. Restore them first if that was a mistake.`,
    };
  }

  const result = await sendRegistrationSms(registration);
  revalidatePath("/admin");

  return result.ok
    ? { status: "success", message: `Code re-sent to ${registration.fullName}.` }
    : { status: "error", message: `SMS failed: ${result.message}` };
}

export async function checkInAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const raw = String(formData.get("code") ?? "").trim();
  const code = normalizeCodeInput(raw);
  if (!code) {
    return { status: "error", message: "Enter or scan a registration code." };
  }

  const registration = await prisma.registration.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      fullName: true,
      attended: true,
      phone: true,
      removed: true,
    },
  });
  if (!registration) {
    return { status: "error", message: `No registration found for ${code}.` };
  }

  // A removed person must be turned away, not checked in.
  if (registration.removed) {
    return {
      status: "error",
      message: `Registration ${code} is no longer valid. Please direct ${registration.fullName} to a Youth Ministry leader.`,
    };
  }

  if (registration.attended) {
    return {
      status: "success",
      message: `${registration.fullName} (${registration.code}) was already checked in.`,
    };
  }

  await prisma.registration.update({
    where: { id: registration.id },
    data: { attended: true, checkedInAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/checkin");

  return {
    status: "success",
    message: `Checked in: ${registration.fullName} (${registration.code}).`,
  };
}

export async function removeRegistrationsAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const codes = formData
    .getAll("codes")
    .map((value) => String(value))
    .filter(Boolean);

  if (codes.length === 0) {
    return { status: "error", message: "Select at least one person to remove." };
  }

  const reason = String(formData.get("reason") ?? "");
  const results = await removeRegistrations(codes, reason);

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  revalidatePath("/");

  if (results.length === 0) {
    return {
      status: "error",
      message: "Nobody was removed - they may have been removed already.",
    };
  }

  const failed = results.filter((r) => !r.smsSent);
  const base = `Removed ${results.length} ${results.length === 1 ? "person" : "people"}. Their spots are free and they cannot register again.`;

  return {
    status: failed.length > 0 ? "error" : "success",
    message:
      failed.length > 0
        ? `${base} However, ${failed.length} SMS did not send - check the logs and contact them directly.`
        : `${base} SMS sent to all of them.`,
  };
}

export async function restoreRegistrationsAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const codes = formData
    .getAll("codes")
    .map((value) => String(value))
    .filter(Boolean);

  if (codes.length === 0) {
    return { status: "error", message: "Select at least one person to restore." };
  }

  const results = await restoreRegistrations(codes);

  revalidatePath("/admin");
  revalidatePath("/admin/manage");
  revalidatePath("/");

  if (results.length === 0) {
    return {
      status: "error",
      message: "Nobody was restored - they may not have been removed.",
    };
  }

  const failed = results.filter((r) => !r.smsSent);
  const base = `Restored ${results.length} ${results.length === 1 ? "person" : "people"}. Their spot is taken again.`;

  return {
    status: failed.length > 0 ? "error" : "success",
    message:
      failed.length > 0
        ? `${base} However, ${failed.length} SMS did not send - send them their code manually via Resend SMS.`
        : `${base} Their original code was texted back to them.`,
  };
}

export async function updateSettingsAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const open = String(formData.get("registrationOpen") ?? "true") === "true";

  const capacity = Number.parseInt(capacityRaw, 10);
  if (!Number.isFinite(capacity) || capacity < 1) {
    return {
      status: "error",
      message: "Capacity must be a whole number of at least 1.",
    };
  }

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.capacity },
      update: { value: String(capacity) },
      create: { key: SETTING_KEYS.capacity, value: String(capacity) },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_KEYS.registrationOpen },
      update: { value: String(open) },
      create: { key: SETTING_KEYS.registrationOpen, value: String(open) },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/register");

  return { status: "success", message: "Settings saved." };
}
