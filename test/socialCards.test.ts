// test/socialCards.test.ts — the share card, the entity graph, and the two ways
// each of them broke silently.
//
// ALL FOUR FINDINGS BELOW WERE MEASURED ON THE BUILT OUTPUT, 2026-09-09, and none
// of them is visible in review: every object involved looks complete where it is
// written. That is exactly why they need a gate rather than a convention.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { SEO_PAGES } from "../lib/seo-pages";

const read = (p: string) => readFileSync(p, "utf8");

/** Intrinsic size from the file header — WebP or JPEG, no decoding. */
function dims(file: string): { w: number; h: number } {
  const b = readFileSync(file);
  if (b.toString("ascii", 0, 4) === "RIFF") {
    const tag = b.toString("ascii", 12, 16);
    if (tag === "VP8X") return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
    if (tag === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  // JPEG: walk the segments to SOF
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error(`cannot read dimensions of ${file}`);
}

/** Every app route file that declares its own metadata. */
function routeFiles(dir = "app", out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) routeFiles(p, out);
    else if (e.name === "page.tsx") out.push(p);
  }
  return out;
}

describe("a large-image card always has an image", () => {
  // MEASURED: seven routes declared their own `openGraph` and emitted ZERO
  // og:image while still emitting twitter:card=summary_large_image — including
  // /legal/privacy, /legal/terms and /legal/accessibility, all `index: true`.
  // Next merges metadata one TOP-LEVEL key at a time, so a route that declares
  // `openGraph: { title, description, url, type }` replaces the parent's WHOLE
  // object and takes the inherited image with it.
  const overriders = routeFiles().filter((f) => /openGraph:\s*\{/.test(read(f)));

  it("finds the routes that override openGraph", () => {
    expect(overriders.length).toBeGreaterThan(5);
  });

  // The GUARANTEE is "this route resolves to a card image", and there are now three
  // honest ways to satisfy it. The original text scan only recognised one of them
  // (a literal `images:` key), which is why it had to be widened when the shared
  // chrome was introduced — not weakened:
  //
  //   1. `...OG_BASE`   — the shared object in lib/seo/og.tsx, which carries
  //                       images alongside siteName and locale. Spreading it is
  //                       now the default, because og:site_name and og:locale were
  //                       being lost to the same merge trap as og:image was.
  //   2. `images:`      — the route declares its own, e.g. the four landing pages,
  //                       which have their own photograph.
  //   3. `...OG_CHROME` — the route deliberately omits `images` so that its
  //                       COLOCATED opengraph-image file convention wins. Next
  //                       gives an explicit metadata `images` precedence over the
  //                       file, so /eligibility was generating a dedicated card,
  //                       serving it at 200, and referencing the generic one.
  //                       This branch is only accepted when the file really exists.
  it.each(overriders)("%s resolves to a card image", (file) => {
    const src = read(file);
    const og = src.slice(src.indexOf("openGraph:"));
    const block = og.slice(0, og.indexOf("},") + 1);
    const hasOwnImages = /images\s*:/.test(block);
    const hasSharedImages = /\.\.\.OG_BASE/.test(block);
    const colocated = existsSync(file.replace(/page\.tsx$/, "opengraph-image.tsx"));
    const viaChrome = /\.\.\.OG_CHROME/.test(block) && colocated;
    expect(
      hasOwnImages || hasSharedImages || viaChrome,
      `${file} overrides openGraph and no image resolves for it. Spread ...OG_BASE ` +
        `(lib/seo/og.tsx), declare your own images, or — if this route has its own ` +
        `opengraph-image.tsx beside it — spread ...OG_CHROME and let the file ` +
        `convention supply the image. Note that ...OG_CHROME WITHOUT that file is a ` +
        `large-image card with no image, which renders as an empty frame.`,
    ).toBe(true);
  });

  it("every route that relies on the file convention actually has the file", () => {
    // The dangerous half of branch 3: ...OG_CHROME is a promise that a colocated
    // opengraph-image.tsx exists. Delete that file and the route silently becomes a
    // summary_large_image card with no image — the exact defect this describe block
    // was written for, re-entering through the fix for it.
    const broken = overriders.filter((f) => {
      const og = read(f).slice(read(f).indexOf("openGraph:"));
      const block = og.slice(0, og.indexOf("},") + 1);
      return (
        /\.\.\.OG_CHROME/.test(block) &&
        !/images\s*:/.test(block) &&
        !existsSync(f.replace(/page\.tsx$/, "opengraph-image.tsx"))
      );
    });
    expect(broken, "these spread OG_CHROME but have no opengraph-image.tsx beside them").toEqual([]);
  });
});

describe("the social image is shaped like a social card", () => {
  // MEASURED: /mia-four shipped its hero — 1800×1994, ratio 0.90, PORTRAIT — as
  // its og:image. A large-image card lays out at roughly 1.91:1, so a portrait
  // file is cropped to a slice or letterboxed. The hero is correct on the page;
  // the two roles now have two fields.
  it.each(SEO_PAGES.map((p) => [p.slug, p] as const))(
    "/%s ships a landscape social image",
    (_slug, page) => {
      const chosen = page.ogImage ?? page.hero;
      const file = `public${chosen.image}`;
      expect(existsSync(file), `${file} is missing`).toBe(true);
      const { w, h } = dims(file);
      // the declared numbers must match the file, or the card lies about itself
      expect(w).toBe(chosen.w);
      expect(h).toBe(chosen.h);
      expect(w / h, `${chosen.image} is ${(w / h).toFixed(2)}:1 — too tall for a large-image card`).toBeGreaterThanOrEqual(1.4);
    },
  );
});

describe("the entity graph names one brand", () => {
  // MEASURED: app/layout.tsx corrected `brand: "MiaMe"` to the product line and
  // documented why — "MiaMe is the SELLER, not the brand" — and the correction
  // was never propagated. Three other places still published MiaMe as the brand
  // of the same physical product, so the site disagreed with itself about who
  // makes MIA FOUR.
  const publishers = ["components/seo/SeoLanding.tsx", "lib/seo/product-jsonld.ts", "lib/spyqe.ts", "app/layout.tsx"];

  it.each(publishers)("%s does not publish MiaMe as a Brand name", (file) => {
    const src = read(file);
    // Comments are allowed to discuss the old value; code is not.
    const code = src
      .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, " ")
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    expect(code, `${file} still names MiaMe as the brand`).not.toMatch(
      /brand\s*:\s*(\{[^}]*name\s*:\s*)?["']MiaMe["']/,
    );
  });
});

describe("an Offer stands only on a page that makes it", () => {
  // MEASURED: the root layout's @graph carried four Product+Offer nodes, each
  // `InStock` with a price, into ALL thirteen routes — /legal/privacy included.
  // The file already states the principle for FAQPage ("whatever stands in it is
  // injected into all thirteen routes") and simply had not applied it here.
  it("the root layout ships no Product node", () => {
    const layout = read("app/layout.tsx");
    const graph = layout.slice(layout.indexOf("const JSON_LD"), layout.indexOf("export const viewport"));
    const code = graph
      .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, " ")
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    expect(code, "HOME_PRODUCTS is back in the root graph").not.toMatch(/\.\.\.HOME_PRODUCTS/);
    expect(code, "the SPYQE product node is back in the root graph").not.toMatch(/spyqeProductJsonLd\(/);
  });

  it("the home page ships them instead", () => {
    expect(read("app/page.tsx")).toMatch(/HOME_PRODUCTS_JSONLD/);
  });
});
