// test/product3d.test.ts — the 3D stage actually has something to show.
//
// THE DEFECT THIS CLOSES (audit finding, verified 2026-09-01). The 3D/360 control
// could never render on ANY page. Product360Stage resolves its model as
// `glb || apiGlb || ""`, and BOTH sides were always empty:
//   · `page.glb` was declared on the SeoPage type and set by no page.
//   · `apiGlb` comes from /api/vehicles/[vehicleId]/media, which SeoLanding calls
//     with `vehicleId={page.slug}` (mia-four, klnoit-*) while the only row in
//     vehicle_media_assets is keyed `mia-four-x4` — so every call 404s.
// Meanwhile public/models/mia-four-x4.glb sat committed and served by the CDN,
// referenced by nothing. A feature can be fully built, fully deployed, and dead.
//
// Nothing failed. No error, no log, no red gate — the button simply never appeared.
// That is why this file asserts the WIRING, not the rendering: a browser test would
// have caught it too, but only while someone was looking.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { SEO_PAGES } from "../lib/seo-pages";

/** Parse a GLB container far enough to prove it is one, and to count what it draws. */
function readGlb(path: string) {
  const b = readFileSync(path);
  const magic = b.toString("ascii", 0, 4);
  const version = b.readUInt32LE(4);
  let off = 12;
  let json: Record<string, unknown> | null = null;
  while (off < b.length - 8) {
    const len = b.readUInt32LE(off);
    const kind = b.toString("ascii", off + 4, off + 8);
    if (kind === "JSON") json = JSON.parse(b.toString("utf8", off + 8, off + 8 + len));
    off += 8 + len;
  }
  return { magic, version, bytes: b.length, json };
}

describe("the 3D stage is wired to a real model", () => {
  const withGlb = SEO_PAGES.filter((p) => p.glb);

  it("at least one page ships a model — otherwise the feature is dead again", () => {
    // The whole point. If this drops to zero the 3D control disappears site-wide,
    // exactly as it silently had before.
    expect(withGlb.length).toBeGreaterThan(0);
  });

  for (const page of withGlb) {
    it(`${page.slug}: ${page.glb} exists and is a valid GLB`, () => {
      const rel = page.glb!.replace(/^\//, "");
      expect(existsSync(`public/${rel}`), `${page.glb} is referenced but not in public/`).toBe(true);
      const g = readGlb(`public/${rel}`);
      expect(g.magic, "not a GLB container").toBe("glTF");
      expect(g.version).toBe(2);
      expect(g.json, "GLB has no JSON chunk").toBeTruthy();
      const meshes = (g.json as { meshes?: unknown[] }).meshes ?? [];
      expect(meshes.length, "a GLB with no meshes renders an empty stage").toBeGreaterThan(0);
    });

    it(`${page.slug}: the model is root-relative so it survives the CSP`, () => {
      // next.config.js pins remote hosts to the Supabase project (PR #152). A model
      // referenced by absolute URL to any other host is blocked at fetch time — the
      // same shape as the media row whose cover_path points at www.miame.co.il.
      expect(page.glb).toMatch(/^\/[^/]/);
    });
  }

  it("SeoLanding still forwards the model to the stage", () => {
    // The data being right is worthless if the component stops passing it.
    const src = readFileSync("components/seo/SeoLanding.tsx", "utf8");
    expect(src).toMatch(/glb=\{page\.glb\}/);
  });

  it("Product360Stage still prefers the static model over the API", () => {
    // `glb || apiGlb` is what makes a committed asset work with zero database and
    // zero env. Reversing it would make the page depend on a row that 404s.
    const src = readFileSync("components/Product360Stage.tsx", "utf8");
    expect(src).toMatch(/glb\s*\|\|\s*apiGlb/);
  });

  it("the viewer renders at native resolution on a Retina-class display", () => {
    // Measured: the old cap of 1.75 rendered an 1802px buffer into a canvas the
    // display wanted at 2060px. For a 2,508-triangle untextured scene there is no
    // fill-rate reason to render below native.
    const src = readFileSync("components/Product3DViewer.tsx", "utf8");
    const cap = src.match(/dpr=\{\[1,\s*([\d.]+)\]\}/);
    expect(cap, "Product3DViewer no longer declares a dpr cap").toBeTruthy();
    expect(Number(cap![1])).toBeGreaterThanOrEqual(2);
  });
});
