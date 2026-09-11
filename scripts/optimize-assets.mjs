/**
 * Generates the web-optimised image assets.
 *
 * The source flyer is a 12000 x 14999 print-resolution JPEG, which is far
 * too large to ship to browsers. This script produces:
 *
 *   public/flyer.jpg      1200px wide  - desktop hero
 *   public/flyer-sm.jpg    720px wide  - mobile hero
 *   public/og-fallback.jpg 1200x630    - social preview fallback
 *
 * It also prepares the church logo in two variants (full colour for light
 * backgrounds, white for the dark sections) plus the favicon:
 *
 *   public/cop-habitat-assembly.png
 *   public/cop-habitat-assembly-white.png
 *   src/app/icon.png
 *
 * Usage:
 *   node scripts/optimize-assets.mjs [path-to-flyer.jpg] [path-to-logo.png]
 */
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULT_FLYERS = [
  path.resolve("assets/flyer-original.jpg"),
  path.resolve("..", "Single's Hangout.jpg"),
];

const DEFAULT_LOGOS = [
  path.resolve("assets/logo.png"),
  path.resolve("assets/cop-habitat-assembly.png"),
];

async function firstExisting(candidates) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

const LOGO_SIZE = 320;
const FAVICON_SIZE = 96;

/**
 * Builds a solid-white version of the logo by keeping the original alpha
 * channel. Used on the dark navy/black sections where the blue logo has
 * too little contrast.
 */
async function writeWhiteLogo(source, destination) {
  const trimmed = await sharp(source).trim({ threshold: 1 }).toBuffer();

  const { data, info } = await sharp(trimmed)
    .resize({ width: LOGO_SIZE, fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Repaint every pixel white, preserving the alpha channel.
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(destination);
}

async function main() {
  await mkdir("public", { recursive: true });
  await mkdir(path.join("src", "app"), { recursive: true });

  // ---- Flyer --------------------------------------------------------------
  const flyerArg = process.argv[2];
  const flyer = await firstExisting(
    flyerArg ? [path.resolve(flyerArg)] : DEFAULT_FLYERS,
    "flyer",
  );

  if (flyer) {
    console.log(`Flyer source: ${flyer}`);

    await sharp(flyer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile("public/flyer.jpg");

    await sharp(flyer)
      .resize({ width: 720, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile("public/flyer-sm.jpg");

    const flyerForOg = await sharp(flyer)
      .resize({ height: 630, fit: "inside" })
      .toBuffer();

    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 3,
        background: { r: 10, g: 10, b: 10 },
      },
    })
      .composite([{ input: flyerForOg, gravity: "centre" }])
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile("public/og-fallback.jpg");

    console.log("  wrote public/flyer.jpg, public/flyer-sm.jpg, public/og-fallback.jpg");
  } else {
    console.warn(
      "  Flyer not found - skipped. Pass a path:\n" +
        '    node scripts/optimize-assets.mjs "C:\\path\\to\\flyer.jpg"',
    );
  }

  // ---- Logo ---------------------------------------------------------------
  const logoArg = process.argv[3];
  const logo = await firstExisting(
    logoArg ? [path.resolve(logoArg)] : DEFAULT_LOGOS,
    "logo",
  );

  if (logo) {
    console.log(`Logo source: ${logo}`);

    await sharp(logo)
      .trim({ threshold: 1 })
      .resize({ width: LOGO_SIZE, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile("public/cop-habitat-assembly.png");

    await writeWhiteLogo(logo, "public/cop-habitat-assembly-white.png");

    // Favicon. Padded so the circle is not clipped by the browser tab.
    const faviconInner = await sharp(logo)
      .trim({ threshold: 1 })
      .resize({
        width: Math.round(FAVICON_SIZE * 0.92),
        height: Math.round(FAVICON_SIZE * 0.92),
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    await sharp({
      create: {
        width: FAVICON_SIZE,
        height: FAVICON_SIZE,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: faviconInner, gravity: "centre" }])
      .png({ compressionLevel: 9 })
      .toFile(path.join("src", "app", "icon.png"));

    console.log(
      "  wrote public/cop-habitat-assembly.png, public/cop-habitat-assembly-white.png, src/app/icon.png",
    );
  } else {
    console.warn(
      "  Logo not found - skipped. Pass a path:\n" +
        '    node scripts/optimize-assets.mjs "" "C:\\path\\to\\logo.png"',
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
