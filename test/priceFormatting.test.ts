// test/priceFormatting.test.ts — a price renders as a price.
//
// FOUND BY THE TRIANGLE AUDIT, verified 2026-09-01. lib/seo-pages.ts carried
// "מ-27,900, ₪" — a stray comma between the amount and the currency — in TWO places:
// the off-road page's visible body copy (line 292) and, worse, its FAQ answer (316),
// which is serialised into the FAQPage JSON-LD. A malformed price in a rich result is
// read by machines that will not forgive it, and it reaches a buyer as a typo on the
// single most scrutinised number on the page.
//
// The class is wider than the instance: any amount followed by a separator and then ₪
// is malformed, wherever it is written. So the assertion is a shape, not a string.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Every .ts/.tsx under the source roots, plus the static text surfaces. */
function sources(dirs = ["lib", "components", "app", "brain"], acc: string[] = []): string[] {
  for (const d of dirs) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) sources([p], acc);
      else if (/\.tsx?$/.test(e.name)) acc.push(p);
    }
  }
  return acc;
}

describe("no surface writes a separator between an amount and ₪", () => {
  const files = [...sources(), "public/llms.txt"];

  it("scans the surfaces it is meant to police", () => {
    // A guard that silently stops finding files is worse than no guard.
    expect(files.length).toBeGreaterThan(40);
  });

  it("finds no malformed price anywhere", () => {
    // Matches a digit, then a comma or period, then whitespace, then ₪ — i.e. the
    // separator that belongs INSIDE the number leaking out to the right of it.
    // "27,900 ₪" is correct; "27,900, ₪" and "27,900. ₪" are not.
    const bad: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      src.split("\n").forEach((line, i) => {
        if (/\d[.,]\s+₪/.test(line)) bad.push(`${f}:${i + 1} — ${line.trim().slice(0, 90)}`);
      });
    }
    expect(bad, `a price is malformed on:\n${bad.join("\n")}`).toEqual([]);
  });
});
