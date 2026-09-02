// test/imageLibraryIntegrity.test.ts — one photograph, one filename.
//
// MEASURED 2026-09-02: public/ held EIGHT filenames that were four photographs.
// Four pairs were byte-identical, and two of the "spare" names were aliases of files
// the site actually serves. Nothing was broken by it — and that is the problem. The
// repo has already paid once for the shape this creates: a photograph reachable under
// several names is a photograph that gets a second, contradictory alt text, and
// `mia-white.webp` was the standing proof — a name describing the BACKGROUND, on a
// file byte-identical to `mia-four-x4-seat.webp`.
//
// SECOND MEASUREMENT, SAME DAY, AND IT MOVED THE GATE. Deleting an alias from
// public/ does NOT retire it. `assets-archive/` — where scripts/optimize-images.mjs
// parks every original it re-encodes — held the SAME duplicate pair, in a directory
// this file never opened, behind a script whose next run would have written the alias
// straight back into public/ with no diff to notice it. A guard that watches one of
// two directories the same photograph can live in is a guard with a documented blind
// spot. It now walks BOTH, and the three aliases that only the wider scan could see
// are gone:
//
//   assets-archive/mia-white.webp        == assets-archive/mia-four-x4-seat.webp
//   assets-archive/mia-fold-lot.jpg      == the new public/mia-four-x4-fold-parking.jpg
//                                           (the archived ORIGINAL, restored to /public
//                                            at full resolution instead of re-encoded
//                                            down to 1100px on the way in)
//   public/mia-four-freedom.png          == assets-archive/mia-four-x4-pure-freedom.png
//                                           — 428KB, referenced by NOTHING, deployed on
//                                             every build. Found only by the wider scan.
//
// WHAT THIS ENFORCES
//   1. No two image files under public/ OR assets-archive/ are byte-identical. An
//      alias is free to create and expensive to notice.
//   2. Every image referenced by the live vehicle_media_assets row still exists.
//      The row has no renderer today (components/seo/SeoLanding.tsx passes no
//      mediaKey, on purpose, and Product360Stage reads only spin360Paths and
//      glbPath) — but "no consumer today" is not "safe to delete", and the list
//      below is what stops a future cleanup from removing them.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, extname } from "node:path";

const IMAGE = new Set([".webp", ".png", ".jpg", ".jpeg", ".avif"]);

/**
 * Both directories a photograph can live in.
 *
 * `public/` is what deploys; `assets-archive/` is where optimize-images.mjs keeps
 * the originals it re-encoded, and it is a WRITE-BACK path — a name left in that
 * script's TARGETS list turns an archived file into a public one on the next run.
 * Scanning only public/ therefore misses both the duplicate and the mechanism that
 * restores it.
 */
const ROOTS = ["public", "assets-archive"];

function imageFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) imageFiles(p, out);
    else if (IMAGE.has(extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

const publicImages = () => ROOTS.flatMap((r) => imageFiles(r));

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
 * the place to record it.
 *
 * IT IS EMPTY, AND THAT IS THE POINT. Both entries it carried are resolved, and
 * neither needed the production data edit the earlier note here proposed:
 *
 *  mia-beach.webp == miame-life-1.webp — the note said resolving it meant pointing the
 *    live vehicle_media_assets row at `mia-beach.webp`. It did not. The lifestyle band
 *    moved to the manufacturer's 1500×1000 seated frame, which left `mia-beach.webp`
 *    with no consumer at all; `miame-life-1.webp` — the name the DB row actually holds
 *    — stays exactly where it was. A better photograph dissolved the duplicate, and
 *    nothing was written to production.
 *
 *  mia-four-x4-seat.webp == mia-white.webp — one file, two names, two alt texts. The
 *    alias is deleted (in public/ AND in assets-archive/, and its name is out of
 *    optimize-images.mjs so the next run cannot rewrite it), Tribute renders the
 *    surviving name, and its alt no longer claims a configuration the page does not
 *    price.
 *
 * An empty baseline makes the second test below vacuous — deliberately. The gate is
 * the first test; this list exists to hold exceptions, and there are none.
 */
const KNOWN_UNRESOLVED_DUPLICATES: string[] = [];

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
