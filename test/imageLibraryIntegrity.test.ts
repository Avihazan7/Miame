// test/imageLibraryIntegrity.test.ts — one photograph, one filename.
//
// MEASURED 2026-09-02: public/ held EIGHT filenames that were four photographs.
// Four pairs were byte-identical, and two of the "spare" names were aliases of files
// the site actually serves. Nothing was broken by it — and that is the problem. The
// repo has already paid once for the shape this creates: a photograph reachable under
// several names is a photograph that gets a second, contradictory alt text, and
// `mia-white.webp` (a BLACK vehicle) is the standing proof that the naming and the
// pixels drift apart the moment they can.
//
// WHAT THIS ENFORCES
//   1. No two files in public/ are byte-identical. An alias is free to create and
//      expensive to notice.
//   2. Every image referenced by the live vehicle_media_assets row still exists.
//      Three of the eight were NOT dead: they are that row's gallery. The row has no
//      renderer today (components/seo/SeoLanding.tsx passes no mediaKey, on purpose,
//      and Product360Stage reads only spin360Paths and glbPath) — but "no consumer
//      today" is not "safe to delete", and the list below is what stops a future
//      cleanup from removing them on the same reasoning that spared them here.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, extname } from "node:path";

const IMAGE = new Set([".webp", ".png", ".jpg", ".jpeg", ".avif"]);

function publicImages(dir = "public", out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) publicImages(p, out);
    else if (IMAGE.has(extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

/**
 * Paths named by the one published row in vehicle_media_assets (id
 * 276f8a1f…, vehicle_id `mia-four-x4`), read from production on 2026-09-02.
 * Transcribed rather than queried: this suite runs with no database, and a guard
 * that silently skips when it cannot connect is a guard that protects nothing.
 */
const LIVE_MEDIA_ROW_GALLERY = [
  "mia-four-x4-hero.webp",
  "mia-four-x4-rear.webp",
  "mia-studio.jpg",
  "mia-four-ride.jpg",
  "miame-cockpit.webp",
  "mia-wheel-detail.webp",
  "miame-life-1.webp",
];

/**
 * Duplicate pairs that CANNOT be resolved by deleting a file, because both names are
 * live. This list may only SHRINK — a new pair is the defect, and the baseline is not
 * the place to record it. Each entry is an open decision, not an exemption:
 *
 *  mia-beach.webp == miame-life-1.webp
 *    `mia-beach` is the Lifestyle band; `miame-life-1` is in the live
 *    vehicle_media_assets gallery. Two owners, one photograph. Resolving it means
 *    pointing the DB row at `mia-beach.webp` — a production data edit, not a delete.
 *
 *  mia-four-x4-seat.webp == mia-white.webp
 *    Both are rendered by components: the Lifestyle seat tile and Specs. The
 *    photograph shows a BLACK vehicle with a quick-release seat, so `mia-white` is
 *    misnamed, and Tribute renders it beside a calculator built from the 2×4 City
 *    entry model while the frame is a Pro Max. Surfaced to the owner 2026-09-02;
 *    it is a content decision (which photo belongs on the eligibility page), not a
 *    file operation, and it stays visible here until he rules.
 */
const KNOWN_UNRESOLVED_DUPLICATES = [
  ["public/mia-beach.webp", "public/miame-life-1.webp"],
  ["public/mia-four-x4-seat.webp", "public/mia-white.webp"],
].map((pair) => pair.sort().join("  ==  "));

describe("one photograph, one filename", () => {
  const files = publicImages();

  it("is looking at a populated library", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("contains no byte-identical duplicates", () => {
    const byHash = new Map<string, string[]>();
    for (const f of files) {
      const h = createHash("md5").update(readFileSync(f)).digest("hex");
      byHash.set(h, [...(byHash.get(h) ?? []), f]);
    }
    const dupes = [...byHash.values()].filter((g) => g.length > 1).map((g) => g.sort().join("  ==  "));
    const unexpected = dupes.filter((d) => !KNOWN_UNRESOLVED_DUPLICATES.includes(d));
    expect(
      unexpected,
      "the same image ships under more than one name. An alias is free to create and " +
        "expensive to notice, and it is how one photograph acquires two alt texts:\n  " +
        unexpected.join("\n  "),
    ).toEqual([]);
  });

  it("keeps the baseline honest — every listed pair is still a real duplicate", () => {
    // A baseline that outlives the thing it excuses is how a ratchet rusts open. When
    // one of these is resolved this fails and names it, instead of quietly standing.
    const byHash = new Map<string, string[]>();
    for (const f of files) {
      const h = createHash("md5").update(readFileSync(f)).digest("hex");
      byHash.set(h, [...(byHash.get(h) ?? []), f]);
    }
    const live = new Set([...byHash.values()].filter((g) => g.length > 1).map((g) => g.sort().join("  ==  ")));
    for (const pair of KNOWN_UNRESOLVED_DUPLICATES) {
      expect(live.has(pair), `${pair} is no longer a duplicate — delete it from the baseline`).toBe(true);
    }
  });
});

describe("the live media row's gallery still resolves", () => {
  it.each(LIVE_MEDIA_ROW_GALLERY)("%s is still on disk", (name) => {
    // Deleting one of these breaks a published row rather than a page — which is
    // exactly why it would not show up in a grep of the components.
    expect(existsSync(join("public", name)), `${name} is named by the live vehicle_media_assets row`).toBe(true);
  });
});
