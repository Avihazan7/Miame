// test/catalogFinish.test.ts — the catalog's finish, held to three things a
// visual review does not catch.
//
// 1. CSS OUTLIVES ITS COMPONENT. /partners was removed by owner decision on
//    2026-09-02 and the test-ride card before it; both kept their rule sets, and
//    `.partner-card` was still named in the WAX layer's selector list. Dead CSS
//    is not merely weight: the next person reading that list sees a card family
//    that no longer exists and styles the wrong thing to match it.
//
// 2. `sizes` LIES BY DEFAULT. The Lifestyle tiles declared `50vw` while `--maxw`
//    caps the container at 1120px, so on a 1440px screen the browser was told the
//    slot was 720px when it is 527px — and it fetched the larger candidate on
//    every tile, on the one section that is nothing but photographs. A `sizes`
//    that ignores the container is the normal way this goes wrong, because it is
//    right until someone sets a max-width.
//
// 3. ONE LIGHT, NOT TWO. The finish draws its highlights from `--amb-hue-a`, the
//    same variable the model tilt writes. A hardcoded accent alongside it would
//    be a second answer to "what colour is the site right now".
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const css = readFileSync("app/globals.css", "utf8");
const read = (p: string) => readFileSync(p, "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === ".tsx") out.push(p);
  }
  return out;
}
const TSX = [...walk("components"), ...walk("app")].map(read).join("\n");

describe("no stylesheet survives the component it dressed", () => {
  it("is reading a real stylesheet", () => {
    // A guard pointed at an empty string passes forever.
    expect(css.length).toBeGreaterThan(20_000);
    expect(TSX).toContain("className");
  });

  it.each([
    ["partner-card", "/partners, removed 2026-09-02"],
    ["testride-card", "the test-ride card"],
    ["rental", "the rental fleet"],
    ["pricing-zone", "the Eilat price zone"],
  ])("styles nothing for %s (%s)", (cls) => {
    // Both halves matter: the class is gone from the markup AND from the CSS.
    // Checking only the markup is how the rules stayed for three weeks.
    expect(TSX, `${cls} is still rendered`).not.toContain(`"${cls}`);
    expect(css, `${cls} is still styled — dead CSS for a removed component`).not.toContain(`.${cls}`);
  });
});

describe("sizes describes the slot the container actually gives", () => {
  const lifestyle = read("components/Lifestyle.tsx");
  const maxw = Number(css.match(/--maxw:(\d+)px/)?.[1]);

  it("the container cap is where this test thinks it is", () => {
    // Every number below is derived from --maxw. If the token moves, this fails
    // first and names itself, instead of the sizes silently going stale.
    expect(maxw, "--maxw is no longer declared in px").toBe(1120);
  });

  it("every Image in the photo section caps its slot at the container", () => {
    const imgs = lifestyle.match(/sizes="[^"]+"/g) ?? [];
    expect(imgs.length, "the lifestyle section has no sized images").toBeGreaterThan(4);
    for (const s of imgs) {
      expect(s, `a slot ignores the ${maxw}px container: ${s}`).toContain(`(min-width: ${maxw}px)`);
    }
  });

  it("the capped values match the geometry, not a guess", () => {
    // wrap padding 22 each side; the grid is 2 columns with a 22px gap at >=780.
    const content = maxw - 44;
    expect(lifestyle, "the full-bleed band's cap is not the content width").toContain(`${content}px`);
    expect(lifestyle, "the two-column tile cap is not (content - gap) / 2").toContain(
      `${Math.floor((content - 22) / 2)}px`,
    );
  });
});

describe("the finish takes its light from the room", () => {
  // Bounded from the block's own start forward. Searching from position 0 for the
  // closing marker finds an EARLIER reduced-motion query and yields an empty slice
  // — a silently vacuous guard, which is how this file first "passed".
  const start = css.indexOf("WAX NANO CRISTAL");
  const block = css.slice(start, css.indexOf("prefers-reduced-motion: reduce", start));

  it("the finish block exists and is the one being measured", () => {
    expect(css).toContain("WAX NANO CRISTAL");
    expect(block.length).toBeGreaterThan(500);
  });

  it("draws every highlight from the ambient hue, never from a fixed accent", () => {
    // The catalog surfaces are lit by the same variable the model tilt writes,
    // so the card and the page can never disagree about the current colour.
    expect(block).toContain("hsla(var(--amb-hue-a)");
    // No hex accent smuggled in beside it. White/near-white specular highlights
    // are the material, not a colour, so rgba(255,255,255,…) is allowed.
    const hexes = (block.match(/#[0-9a-f]{3,8}\b/gi) ?? []).filter(
      (h) => !/^#(f{3,8}|f3f8ff|e7f0fc|f6fbff|e2eefb)$/i.test(h),
    );
    expect(hexes, `a fixed accent colour sits beside the ambient one: ${hexes.join(", ")}`).toEqual([]);
  });

  it("suppresses the new sweep for reduced motion, like the ones before it", () => {
    const reduce = css.slice(css.indexOf("prefers-reduced-motion: reduce"));
    expect(reduce, "the lifestyle sweep runs for a visitor who asked for less motion").toContain(
      ".life-card::after{display:none}",
    );
  });
});
