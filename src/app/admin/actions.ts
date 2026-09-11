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
import { sendRegistrationSms } from "@/lib/registration";
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
    select: { id: true, code: true, fullName: true, phone: true },
  });
  if (!registration) {
    return { status: "error", message: "Registration not found." };
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
    select: { id: true, code: true, fullName: true, attended: true, phone: true },
  });
  if (!registration) {
    return { status: "error", message: `No registration found for ${code}.` };
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
