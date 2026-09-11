/**
 * Generates the web-optimised derivatives of the event flyer.
 *
 * The source flyer is a 12000 x 14999 print-resolution JPEG, which is far
 * too large to ship to browsers. This script produces:
 *
 *   public/flyer.jpg      1200px wide  - desktop hero
 *   public/flyer-sm.jpg    720px wide  - mobile hero
 *   public/og-fallback.jpg 1200x630    - social preview fallback
 *
 * Usage:
 *   node scripts/optimize-assets.mjs [path-to-source.jpg]
 */
import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULT_SOURCES = [
  path.resolve("assets/flyer-original.jpg"),
  path.resolve("..", "Single's Hangout.jpg"),
];

async function resolveSource() {
  const fromArg = process.argv[2];
  const candidates = fromArg ? [path.resolve(fromArg)] : DEFAULT_SOURCES;
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  throw new Error(
    `Could not find the flyer. Pass a path:\n  node scripts/optimize-assets.mjs "C:\\path\\to\\flyer.jpg"`,
  );
}

const source = await resolveSource();
await mkdir("public", { recursive: true });

console.log(`Source: ${source}`);

// Desktop hero.
await sharp(source)
  .resize({ width: 1200, withoutEnlargement: true })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile("public/flyer.jpg");

// Mobile hero.
await sharp(source)
  .resize({ width: 720, withoutEnlargement: true })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile("public/flyer-sm.jpg");

// 1200x630 social preview: the flyer centred on a black canvas.
const ogWidth = 1200;
const ogHeight = 630;
const flyerForOg = await sharp(source)
  .resize({ height: ogHeight, fit: "inside" })
  .toBuffer();

await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 3,
    background: { r: 10, g: 10, b: 10 },
  },
})
  .composite([{ input: flyerForOg, gravity: "centre" }])
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile("public/og-fallback.jpg");

console.log("Wrote public/flyer.jpg, public/flyer-sm.jpg, public/og-fallback.jpg");
