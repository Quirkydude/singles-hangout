"use client";

import { useState } from "react";
import { EVENT, getSiteUrl, whatsappShareText } from "@/lib/event";

type ShareActionsProps = {
  code: string;
  ticketUrl: string;
  fullName: string;
};

/**
 * Add-to-calendar, WhatsApp share and copy-link actions for the ticket page.
 */
export function ShareActions({ code, ticketUrl, fullName }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  // Share the PUBLIC registration link, never the personal ticket URL.
  const shareUrl = `${getSiteUrl()}/register`;
  const shareText = whatsappShareText(shareUrl);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `${EVENT.name} - ${EVENT.theme}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // user dismissed the sheet - fall through to WhatsApp
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="space-y-3">
      <a
        href={`/api/ics?code=${encodeURIComponent(code)}`}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition-colors hover:bg-brand-red"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
        </svg>
        Add to calendar
      </a>

      <button
        type="button"
        onClick={share}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 font-semibold text-ink transition-colors hover:border-brand-red hover:text-brand-red"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        Share with a friend
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 font-semibold text-ink transition-colors hover:border-brand-red hover:text-brand-red"
      >
        {copied ? "Link copied" : "Copy my ticket link"}
      </button>

      <p className="text-center text-xs text-ink-muted">
        Keep this link. {fullName.split(" ")[0]}, you can reopen your ticket any
        time without another SMS.
      </p>
    </div>
  );
}
