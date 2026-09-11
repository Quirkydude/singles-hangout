"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeCodeInput } from "@/lib/codes";
import { normalizeGhanaPhone } from "@/lib/phone";
import type { FindState } from "@/lib/form-state";

export async function findTicketAction(
  _prevState: FindState,
  formData: FormData,
): Promise<FindState> {
  const rawCode = String(formData.get("code") ?? "").trim();
  const rawPhone = String(formData.get("phone") ?? "").trim();

  if (rawCode) {
    const code = normalizeCodeInput(rawCode);
    const found = await prisma.registration.findUnique({
      where: { code },
      select: { code: true },
    });
    if (!found) {
      return {
        status: "notfound",
        message: "We could not find a registration with that code.",
      };
    }
    redirect(`/ticket/${found.code}`);
  }

  if (rawPhone) {
    const phone = normalizeGhanaPhone(rawPhone);
    if (!phone) {
      return {
        status: "error",
        message: "Enter a valid Ghanaian mobile number.",
      };
    }
    const found = await prisma.registration.findUnique({
      where: { phone },
      select: { code: true },
    });
    if (!found) {
      return {
        status: "notfound",
        message: "That number is not registered yet.",
      };
    }
    redirect(`/ticket/${found.code}`);
  }

  return {
    status: "error",
    message: "Enter your registration code or the phone number you used.",
  };
}
