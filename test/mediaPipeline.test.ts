/**
 * The media pipeline — what actually reaches the browser.
 *
 * test/imageLayout.test.ts asks whether an image reserves the right box.
 * This file asks three different questions, each one a defect that was measured
 * on this repo on 2026-09-01 rather than imagined:
 *
 *   1. Does the src point at a file that ships at all? The ratio rule next door
 *      SKIPS a src it cannot find on disk, so a typo used to pass in silence and
 *      404 in the browser.
 *   2. Does a local still go through the Next optimizer? Twelve did not: they
 *      shipped the full-resolution original with no srcset.
 *   3. Does a URL that is really ours survive contact with next/image? The one
 *      published vehicle_media_assets row stores absolute https://www.miame.co.il
 *      URLs, and next/image throws on a host outside images.remotePatterns.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { toSelfHostedPath } from "../components/vehicle-media/selfHostedUrl";

/** Same recursive walk as test/imageLayout.test.ts — the nested component folders
 *  are exactly where the last two image defects were found. */
function componentFiles(dir = "components"): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...componentFiles(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

const files = componentFiles();

/** A src that is a literal, root-relative path into public/. A dynamic src (a
 *  YouTube thumbnail, a 360 frame, a Supabase URL) is out of scope by definition. */
const LOCAL_SRC = /src=["'](\/[^"']+\.(?:webp|png|jpe?g|avif))["']/;

function tags(kind: "img" | "Image" | "both") {
  const pattern = kind === "both" ? /<(img|Image)\b[\s\S]*?\/?>/g : new RegExp(`<(${kind})\\b[\\s\\S]*?\\/?>`, "g");
  const out: { file: string; src: string }[] = [];
  for (const f of files) {
    for (const m of readFileSync(f, "utf8").matchAll(pattern)) {
      const src = m[0].match(LOCAL_SRC)?.[1];
      if (src) out.push({ file: f, src });
    }
  }
  return out;
}

describe("every local image src points at a file that ships", () => {
  it("finds local srcs to check", () => {
    expect(tags("both").length).toBeGreaterThan(12);
  });

  it("resolves each one under public/", () => {
    for (const { file, src } of tags("both")) {
      expect(existsSync(`public${src}`), `${file}: ${src} is not in public/`).toBe(true);
    }
  });
});

/**
 * Local stills that STILL ship raw, bypassing the optimizer. This list may only
 * SHRINK. A name appearing here that is not already on it means a new
 * full-resolution original went out with no srcset — that is the defect, and the
 * baseline is not the place to record it.
 *
 * The two entries that are not photographs are rasterised logos rendered into a
 * far smaller slot than the file (.res-logo is at most 178px wide; .imp-logo-tile
 * img is 50px tall), so both are worth converting too; they are listed rather
 * than fixed because they sit in files this change did not otherwise open.
 */
const RAW_LOCAL_IMG_BASELINE = new Set([
  "components/Engineering.tsx:/mia-four-x4-rear.webp",
  "components/Features.tsx:/mia-fold-trunk.webp",
  // 6 → 5 on 2026-09-02. Features' detail tile served /mia-four-x4-night-front.jpg
  // — 554×554, the smallest product shot on the site — as a raw <img>, so the
  // committed JPEG shipped whole with no AVIF, no WebP and no srcset. The
  // manufacturer's 1000×1000 standing profile replaced it THROUGH next/image, so
  // the entry is gone rather than merely re-pointed. The ratchet only tightens.
  "components/Patents.tsx:/mia-four-x4-pure-freedom.webp",
  "components/Configurator.tsx:/mia-four-logo.webp",
  "components/Importer.tsx:/mia-dynamics-logo.webp",
]);

describe("local stills go through the Next optimizer", () => {
  it("ships no NEW raw full-resolution original", () => {
    for (const { file, src } of tags("img")) {
      expect(
        RAW_LOCAL_IMG_BASELINE.has(`${file}:${src}`),
        `${file} serves ${src} as a plain <img> — the whole original, no srcset. ` +
          `Use next/image with the file's true width/height and a sizes= that ` +
          `describes the slot.`,
      ).toBe(true);
    }
  });

  it("keeps the baseline honest — every entry still exists", () => {
    // A baseline that outlives the code it excuses is how a ratchet rusts open.
    const live = new Set(tags("img").map((t) => `${t.file}:${t.src}`));
    for (const entry of RAW_LOCAL_IMG_BASELINE) {
      expect(live.has(entry), `${entry} is fixed — delete it from the baseline`).toBe(true);
    }
  });
});

describe("an absolute URL on our own origin is folded back to a local path", () => {
  it("strips our origin, www and apex alike", () => {
    expect(toSelfHostedPath("https://www.miame.co.il/mia-four-x4-hero.webp")).toBe(
      "/mia-four-x4-hero.webp",
    );
    expect(toSelfHostedPath("https://miame.co.il/mia-studio.jpg")).toBe("/mia-studio.jpg");
  });

  it("leaves a Supabase storage URL alone", () => {
    const url =
      "https://thhyfwoeybkptxvbpcmg.supabase.co/storage/v1/object/public/vehicle-media/mia-four-x4/mia-four-x4.glb";
    expect(toSelfHostedPath(url)).toBe(url);
  });

  it("leaves an already-relative path alone", () => {
    expect(toSelfHostedPath("/mia-four-x4-hero.webp")).toBe("/mia-four-x4-hero.webp");
  });

  it("does not mistake a look-alike host for ours", () => {
    // Without the trailing slash in the prefix test this would be rewritten to a
    // path we do not serve — a same-origin fetch aimed at somebody else's asset.
    const url = "https://www.miame.co.il.example/mia-four-x4-hero.webp";
    expect(toSelfHostedPath(url)).toBe(url);
  });

  it("VehicleMediaExample runs EVERY image URL through it", () => {
    // The stage renders cover, gallery, spin frames and the 3D poster with
    // next/image. One unwrapped call is one `Invalid src prop` throw on the live
    // row, so the count has to match exactly rather than be "mostly wrapped".
    const src = readFileSync("components/vehicle-media/VehicleMediaExample.tsx", "utf8");
    const built = src.match(/supabasePublicImageUrl\(/g) ?? [];
    const folded = src.match(/toSelfHostedPath\(\s*supabasePublicImageUrl\(/g) ?? [];
    expect(built.length).toBeGreaterThan(0);
    expect(folded.length, "an image URL reaches <Image> without toSelfHostedPath()").toBe(
      built.length,
    );
  });
});

describe("the SEO hero and the product stage share ONE rendition", () => {
  const src = readFileSync("components/seo/SeoLanding.tsx", "utf8");

  it("hands the stage the hero's true intrinsic size", () => {
    expect(src).toMatch(/posterW=\{page\.hero\.w\}/);
    expect(src).toMatch(/posterH=\{page\.hero\.h\}/);
  });

  it("asks for the same srcset candidate on both", () => {
    // \b keeps this off `posterSizes="` — the hero's own attribute comes first.
    const hero = src.match(/\bsizes="([^"]+)"/)?.[1];
    const stage = src.match(/posterSizes="([^"]+)"/)?.[1];
    expect(hero, "the hero lost its sizes=").toBeTruthy();
    expect(
      stage,
      `the stage asks for ${stage}, the hero for ${hero} — two renditions of one ` +
        `photograph, which is the double download this pair exists to prevent`,
    ).toBe(hero);
  });
});
