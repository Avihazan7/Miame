// test/vehicleMediaKey.test.ts — a media key is a row id, never a page slug.
//
// THE DEFECT THIS CLOSES (audit, verified 2026-09-01). Product360Stage took ONE prop,
// `vehicleId`, and used it for two unrelated things: the analytics id it reports to
// /api/vehicle-media-events, and the primary key it looked up in vehicle_media_assets.
// SeoLanding passed the page slug — `mia-four`, `klnoit-4-galgalim`,
// `klnoit-mitkapelet`, `klnoit-shetach` — while the only published row is keyed
// `mia-four-x4`. Every SEO page therefore fetched a 404, on every visit, forever.
//
// It was silent by construction: the stage fails soft so the poster survives a missing
// row, which makes a permanent miss look exactly like "no media for this page". And the
// waste was the smaller half of it. Because `apiGlb` feeds the 3D viewer, a row
// published under one of those slugs would have put ITS model on a page whose own
// machine is a different one — a 4×4 rendering on the folding-scooter page, the "one
// photo, three alts" defect in three dimensions.
//
// The fix is a separate, optional `mediaKey`: no key, no request. This file keeps the
// two meanings apart, so the slug can never quietly become a lookup key again.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SEO_PAGES } from "../lib/seo-pages";

const stage = readFileSync("components/Product360Stage.tsx", "utf8");

function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) tsxFiles(p, acc);
    else if (entry.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

describe("the vehicle-media lookup is keyed on a media row, not on a page", () => {
  it("the stage asks the media API for the mediaKey it was given", () => {
    expect(
      stage,
      "Product360Stage no longer builds its media URL from mediaKey — if the lookup " +
        "went back to vehicleId, the analytics id is a lookup key again.",
    ).toMatch(/fetch\(`\/api\/vehicles\/\$\{encodeURIComponent\(mediaKey\)\}\/media`\)/);
  });

  it("no mediaKey ⇒ no request at all", () => {
    // This is the whole fix. Without the guard the component asks for `/api/vehicles/
    // undefined/media` — a 404 with a different spelling, which is not an improvement.
    expect(stage).toMatch(/if \(!visible \|\| !mediaKey\) return;/);
  });

  it("the effect re-runs on the key it actually reads", () => {
    // A stale dependency list would freeze the lookup on the first key it ever saw.
    expect(stage).toMatch(/\}, \[visible, mediaKey\]\);/);
  });

  it("no caller passes a page slug where a media key belongs", () => {
    // Written as ONE assertion over the whole tree rather than a test per call site:
    // today nothing passes mediaKey at all, and a per-file loop would quietly emit
    // zero tests — a guard that reports "passed" while checking nothing.
    const slugs = new Set(SEO_PAGES.map((p) => p.slug));
    const offenders: string[] = [];
    for (const file of [...tsxFiles("app"), ...tsxFiles("components")]) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/mediaKey=(?:\{([^}]*)\}|"([^"]*)")/g)) {
        const value = (m[1] ?? m[2] ?? "").trim();
        if (/\bslug\b/.test(value) || slugs.has(value.replace(/^["']|["']$/g, ""))) {
          offenders.push(`${file}: mediaKey={${value}}`);
        }
      }
    }
    expect(
      offenders,
      `A page identity is being used as a media key: ${offenders.join(", ")}. The media ` +
        `API is keyed on vehicle_media_assets.vehicle_id (e.g. "mia-four-x4"), so a slug ` +
        `is the exact 404 this file exists to prevent — pass the row's own key, or pass ` +
        `nothing and let the stage skip the lookup entirely.`,
    ).toEqual([]);
  });
});
