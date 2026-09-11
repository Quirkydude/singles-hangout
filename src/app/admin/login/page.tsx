import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { EVENT } from "@/lib/event";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const store = await cookies();
  if (await verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    redirect(next && next.startsWith("/admin") ? next : "/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <p className="font-display text-2xl uppercase tracking-tight">
            {EVENT.name}
          </p>
          <p className="mt-1 text-sm text-white/50">Admin dashboard</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <LoginForm next={next ?? "/admin"} />
        </div>
      </div>
    </main>
  );
}
