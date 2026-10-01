// test/dependencyOverrides.test.ts — the security overrides in package.json must stay
// installable, honest about the direct dependency, and above the patched floor.
//
// Three ways they broke, each silently:
//   · `"postcss": "$postcss"` resolved for `npm ci` but made every `npm install <pkg>`
//     and every `npm audit fix` die with "Unable to resolve reference $postcss" — the
//     arch-guardian autofix step failed on every run with only a warning to show for it.
//   · An override of a DIRECT dependency must equal that dependency's spec, or npm
//     refuses (EOVERRIDE). Kept literal, the two must move together; this says so first.
//   · vite came in through vitest 1.x pinned to 5.x — one high finding in
//     `npm audit --omit=dev` (devOptional, as an optional peer of @vercel/toolbar), the
//     second of the two failures that kept arch-guardian Issue #93 open.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
};
const overrides = pkg.overrides ?? {};
const direct = { ...pkg.dependencies, ...pkg.devDependencies };

/** "^6.4.3" / "6.4.3" → [6, 4, 3]; anything else → null. */
const floorOf = (range: string): number[] | null => {
  const m = /^[\^~]?(\d+)\.(\d+)\.(\d+)$/.exec(range.trim());
  return m ? m.slice(1).map(Number) : null;
};
const atLeast = (v: number[], min: number[]) => {
  for (let i = 0; i < 3; i++) if (v[i] !== min[i]) return v[i] > min[i];
  return true;
};
const VITE_PATCHED = [6, 4, 3]; // GHSA-4w7w-66w2-5vf9 · GHSA-v6wh-96g9-6wx3 · GHSA-fx2h-pf6j-xcff: <=6.4.2

describe("package.json overrides", () => {
  it("never uses a $reference — npm cannot resolve one during `npm install <pkg>` or `npm audit fix`", () => {
    const refs = Object.entries(overrides).filter(([, spec]) => spec.startsWith("$"));
    expect(refs).toEqual([]);
  });

  it("an override of a direct dependency carries exactly that dependency's spec", () => {
    for (const [name, spec] of Object.entries(overrides)) {
      if (name in direct) expect(`${name}@${spec}`).toBe(`${name}@${direct[name]}`);
    }
  });

  it("holds vite at or above the first patched release — in package.json and on disk", () => {
    const floor = floorOf(overrides.vite ?? "");
    expect(floor, "overrides.vite must be a plain ^x.y.z range").not.toBeNull();
    expect(atLeast(floor!, VITE_PATCHED)).toBe(true);

    const installed = floorOf(JSON.parse(readFileSync("node_modules/vite/package.json", "utf8")).version);
    expect(installed).not.toBeNull();
    expect(atLeast(installed!, VITE_PATCHED)).toBe(true);
  });
});
