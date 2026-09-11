import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { EVENT } from "@/lib/event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };

/**
 * Loads the flyer straight off disk so the OG image does not depend on
 * the site being reachable at its public URL. Falls back to a remote
 * fetch (then to no image) if the file is unavailable.
 */
async function loadFlyer(): Promise<string | null> {
  try {
    const file = await readFile(
      path.join(process.cwd(), "public", "og-fallback.jpg"),
    );
    return `data:image/jpeg;base64,${file.toString("base64")}`;
  } catch {
    try {
      const response = await fetch(
        `${process.env.SITE_URL || EVENT.siteUrlFallback}/og-fallback.jpg`,
        { cache: "no-store" },
      );
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:image/jpeg;base64,${buffer.toString("base64")}`;
    } catch {
      return null;
    }
  }
}

export async function GET() {
  const flyer = await loadFlyer();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          backgroundColor: "#0b0b0d",
          color: "#ffffff",
        }}
      >
        {/* Left: copy */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px",
            width: flyer ? "660px" : "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 21,
                letterSpacing: 3,
                color: "#ff4d63",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {`${EVENT.host} - ${EVENT.district}`}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 26,
                fontSize: 86,
                lineHeight: 1,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: -2,
              }}
            >
              Single&apos;s
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 86,
                lineHeight: 1.05,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: -2,
                color: "#d6081f",
              }}
            >
              Hangout 2026
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", fontSize: 29, fontWeight: 700 }}>
              {`${EVENT.dateLabel} - ${EVENT.timeLabel}`}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 25,
                color: "rgba(255,255,255,.72)",
              }}
            >
              {`${EVENT.venueDetail}, ${EVENT.venue}`}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 12,
                alignSelf: "flex-start",
                padding: "13px 28px",
                borderRadius: 999,
                backgroundColor: "#d6081f",
                fontSize: 23,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {`Register free - ${EVENT.minAge}+`}
            </div>
          </div>
        </div>

        {/* Right: flyer thumb */}
        {flyer ? (
          <div
            style={{
              display: "flex",
              flex: 1,
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#17171b",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flyer}
              alt=""
              width={470}
              height={587}
              style={{ objectFit: "contain", borderRadius: 10 }}
            />
          </div>
        ) : null}
      </div>
    ),
    SIZE,
  );
}
