import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { prisma } from "@/lib/prisma";
import { EVENT, getMapsUrl, getTicketUrl } from "@/lib/event";
import { normalizeCodeInput } from "@/lib/codes";
import { formatPhoneForDisplay, maskPhone } from "@/lib/phone";
import { renderTicketQr } from "@/lib/qr";
import { ShareActions } from "./ShareActions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ fresh?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const normalized = normalizeCodeInput(decodeURIComponent(code));
  return {
    title: `Ticket ${normalized}`,
    description: `Your registration ticket for ${EVENT.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function TicketPage({ params, searchParams }: PageProps) {
  const [{ code }, query] = await Promise.all([params, searchParams]);
  const normalized = normalizeCodeInput(decodeURIComponent(code));
  const isFresh = query.fresh === "1";

  const registration = await prisma.registration.findUnique({
    where: { code: normalized },
    select: {
      code: true,
      fullName: true,
      phone: true,
      location: true,
      isFacilitator: true,
      affiliation: true,
      role: true,
      removed: true,
      age: true,
      smsStatus: true,
      createdAt: true,
    },
  });

  if (!registration) notFound();
  if (registration.removed) notFound();

  const qrSvg = await renderTicketQr(registration.code);
  const ticketUrl = getTicketUrl(registration.code);

  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-cream">
        <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-14">
          {isFresh ? (
            <div className="mb-5 rounded-xl border border-green-600/25 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              You are registered. We sent your code by SMS to your phone.
            </div>
          ) : null}

          {/* Ticket */}
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="bg-ink px-6 py-6 text-white">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-red-light">
                {EVENT.host} &middot; {EVENT.assembly}
              </p>
              <h1 className="mt-2 font-display text-3xl uppercase leading-tight tracking-tight">
                {EVENT.name}
              </h1>
              <p className="mt-1.5 text-sm text-white/70">
                {EVENT.dateLabel} &middot; {EVENT.timeLabel}
              </p>
            </div>

            <div className="flex flex-col items-center px-6 py-7">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
                Registration code
              </p>
              <p className="mt-2 font-display text-4xl font-bold tracking-[0.08em] text-brand-red sm:text-5xl">
                {registration.code}
              </p>

              <div
                className="mt-6 w-full max-w-[260px] [&>svg]:h-auto [&>svg]:w-full"
                // The SVG is generated server-side from a fixed payload.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                aria-label={`QR code for registration ${registration.code}`}
                role="img"
              />

              <p className="mt-4 text-center text-sm font-semibold text-ink">
                Dress code: <span className="text-brand-red">{EVENT.dressCode}</span>
              </p>
              <p className="mt-1 text-center text-xs text-ink-muted">
                Please dress formally. Entry may be refused otherwise.
              </p>
            </div>

            {/* Tear-line detail */}
            <div className="border-t border-dashed border-line px-6 py-6">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
                <div className="col-span-2">
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                    Name
                  </dt>
                  <dd className="mt-0.5 font-semibold text-ink">
                    {registration.fullName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                    Phone
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {formatPhoneForDisplay(registration.phone)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                    Attending as
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {registration.isFacilitator
                      ? "Facilitator"
                      : (registration.role ?? "Participant")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                    Fellowship
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {registration.isFacilitator
                      ? "Facilitating"
                      : (registration.affiliation ?? "Not specified")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                    Location
                  </dt>
                  <dd className="mt-0.5 text-ink">{registration.location}</dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-ink-muted">
                    Venue
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {EVENT.venue}
                  </dd>
                </div>
              </dl>

              {registration.smsStatus !== "SENT" ? (
                <p className="mt-5 rounded-lg bg-cream px-3.5 py-2.5 text-xs text-ink-muted">
                  We could not confirm SMS delivery. Your ticket is still valid -
                  screenshot this page, or contact 0538118529 to resen your code.
                </p>
              ) : null}

              <a
                href={getMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block text-sm font-semibold text-brand-red hover:underline"
              >
                Get directions &rarr;
              </a>
            </div>
          </div>

          <div className="mt-6">
            <ShareActions
              code={registration.code}
              ticketUrl={ticketUrl}
              fullName={registration.fullName}
            />
          </div>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Registered number: {maskPhone(registration.phone)} &middot;{" "}
            <Link href="/" className="font-semibold text-ink hover:text-brand-red">
              Event details
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
