import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { EVENT } from "@/lib/event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };

/** Reads a file from public/ and returns a data URI for ImageResponse. */
async function loadPublicImage(
  filename: string,
  mime: string,
): Promise<string | null> {
  try {
    const file = await readFile(path.join(process.cwd(), "public", filename));
    return `data:${mime};base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET() {
  const [flyer, logo] = await Promise.all([
    loadPublicImage("og-fallback.jpg", "image/jpeg"),
    loadPublicImage("cop-habitat-assembly.png", "image/png"),
  ]);

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
            padding: "56px 60px",
            width: flyer ? "660px" : "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Church branding */}
            <div
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" width={62} height={62} />
              ) : null}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 19,
                    letterSpacing: 2.5,
                    color: "#ff4d63",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {EVENT.host}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 17,
                    color: "rgba(255,255,255,.66)",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                  }}
                >
                  {`${EVENT.assembly} - ${EVENT.ministry}`}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 30,
                fontSize: 82,
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
                fontSize: 82,
                lineHeight: 1.05,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: -2,
              }}
            >
              Hangout 2026
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 14,
                alignSelf: "flex-start",
                padding: "9px 20px",
                borderRadius: 999,
                border: "2px solid #d6081f",
                color: "#ff4d63",
                fontSize: 22,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {EVENT.theme}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>
              {`${EVENT.dateLabel} - ${EVENT.timeLabel}`}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: "rgba(255,255,255,.72)",
              }}
            >
              {`${EVENT.venue} - ${EVENT.address.split(" - ")[0]}`}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 10,
                alignSelf: "flex-start",
                padding: "13px 28px",
                borderRadius: 999,
                backgroundColor: "#d6081f",
                fontSize: 22,
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
              height={583}
              style={{ objectFit: "contain", borderRadius: 10 }}
            />
          </div>
        ) : null}
      </div>
    ),
    SIZE,
  );
}
