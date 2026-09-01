// test/seoHeroIntrinsic.test.ts — the SEO hero declares the file's REAL size.
//
// AUDIT FINDING (verified, 31.08.26). All four SEO landing heroes shipped as
// width={720} height={540} — a 4:3 constant — while none of the four files is 4:3:
//
//     /mia-four            mia-four-x6-studio.webp      1400×1498   0.935:1
//     /klnoit-4-galgalim   mia-four-side.webp           1000×1000   1.000:1
//     /klnoit-shetach      mia-four-x4-night-front.jpg   554×554    1.000:1
//     /klnoit-mitkapelet   mia-fold-trunk.webp          1100×733    1.501:1
//
// .seo-hero-img is width:100%;height:auto with no CSS aspect-ratio, so the browser
// reserves the ATTRIBUTE ratio and re-lays the page when the real one arrives — and
// on mobile the hero is order:-1, so the element that shifts is the first thing on
// the page, and it is the LCP. This is the same defect class as the mobile CLS 1.15
// incident, on the one image marked `priority`.
//
// test/imageLayout.test.ts could not see it: it reads components/*.tsx only (not
// components/seo/) and polices plain <img> tags, and here the source is not a
// literal — it comes from lib/seo-pages.ts. So the contract is asserted where the
// data lives: every hero entry carries w/h, and w/h must equal the file's header.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { intrinsicSize } from "./helpers/intrinsicSize";
import { SEO_PAGES } from "../lib/seo-pages";

describe("every SEO hero declares its file's real intrinsic size", () => {
  it("still has the four landing pages", () => {
    // If pages are added, they are covered automatically; if this drops, the
    // suite is asserting about nothing.
    expect(SEO_PAGES.length).toBeGreaterThanOrEqual(4);
  });

  for (const page of SEO_PAGES) {
    it(`${page.slug}: hero ${page.hero.image} is ${page.hero.w}×${page.hero.h} on disk too`, () => {
      const real = intrinsicSize(`public${page.hero.image}`);
      expect(real, `${page.hero.image} missing or unreadable under public/`).toBeTruthy();
      expect(
        { w: real!.width, h: real!.height },
        `lib/seo-pages.ts declares ${page.hero.w}×${page.hero.h} but the file is ` +
          `${real!.width}×${real!.height} — the browser will reserve the wrong box and ` +
          `shift the page when the image decodes`,
      ).toEqual({ w: page.hero.w, h: page.hero.h });
    });
  }

  it("SeoLanding renders the declared size, not a constant", () => {
    // The data being right is worthless if the component goes back to 720×540.
    const src = readFileSync("components/seo/SeoLanding.tsx", "utf8");
    expect(src).toMatch(/width=\{page\.hero\.w\}/);
    expect(src).toMatch(/height=\{page\.hero\.h\}/);
    expect(src, "the priority hero needs sizes= so the preload fetches the right rendition")
      .toMatch(/sizes="[^"]+"/);
  });
});
