import { cn } from "@/lib/cn";
import type { EventSettings } from "@/lib/settings";

type SpotsLeftProps = {
  settings: EventSettings;
  className?: string;
};

/**
 * Urgency indicator driven by the editable capacity setting.
 * Shows a pulsing dot while spots remain, and a clear closed state when full.
 */
export function SpotsLeft({ settings, className }: SpotsLeftProps) {
  if (!settings.registrationOpen) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-line bg-cream px-3.5 py-1.5 text-sm font-semibold text-ink-muted",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-ink-muted" aria-hidden />
        Registration is currently closed
      </div>
    );
  }

  if (settings.isFull) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-brand-red/25 bg-brand-red/5 px-3.5 py-1.5 text-sm font-bold text-brand-red",
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-brand-red" aria-hidden />
        Registration is full
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/5 px-3.5 py-1.5 text-sm font-semibold text-brand-red",
        className,
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-red" />
      </span>
      {settings.spotsLeft} of {settings.capacity} spots left
    </div>
  );
}
