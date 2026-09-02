// test/warrantyTruth.test.ts — the warranty term is one fact, stated everywhere.
//
// MEASURED 2026-09-02: the site displayed 12 months in three places — the Hero
// strip, the Importer block and the Configurator's spec table, all derived from
// WARRANTY_MONTHS — and the knowledge corpus stated the period in ZERO rows. A
// buyer asking the assistant the most common question after price got "אחריות
// יבואן רשמי" and no number, while that number sat on the page behind them.
//
// That is the failure this file pins: not a missing keyword, but the answer being
// withheld at the moment it is asked for — and, worse, the two surfaces being free
// to disagree once both DO state it. WARRANTY_MONTHS is the source; everything
// else quotes it.
//
// It also pins the instruction that has nothing to do with SEO: MEU is named as the
// official importer and as the party behind the warranty, and its phone number is
// never published. The site's only contact channel is the one it already runs on.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { WARRANTY_MONTHS, WARRANTY_TERM, IMPORTER_NAME } from "../lib/content";

const MIG = "supabase/migrations";
const read = (f: string) => readFileSync(f, "utf8");

/**
 * The forward corpus migrations, in replay order — the corpus as git builds it,
 * WITH COMMENTS STRIPPED.
 *
 * The stripping is the point, not tidiness. A migration header explains the defect
 * it fixes, and to do that it quotes the row text — so the prose above a change
 * contains the same strings as the change. Without this, an assertion that "the
 * corpus says X" passes on a comment that merely mentions X, and would keep passing
 * after the row itself was deleted. Mutation caught exactly that here.
 */
const corpus = readdirSync(MIG)
  .filter((f) => f.endsWith(".sql") && !f.endsWith(".rollback.sql") && f.includes("knowledge"))
  .sort()
  .map((f) =>
    read(join(MIG, f))
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .split("\n")
      .map((l) => l.replace(/--.*$/, ""))
      .join("\n"),
  )
  .join("\n");

describe("the warranty term has one source and every surface quotes it", () => {
  it("is a year, and the constant says so", () => {
    // The owner states the term as "שנה"; the code states 12 months. If those ever
    // stop being the same fact, every assertion below is quoting the wrong number.
    expect(WARRANTY_MONTHS).toBe(12);
    expect(WARRANTY_TERM).toContain(String(WARRANTY_MONTHS));
  });

  it("the rendered surfaces derive the period, never type it", () => {
    for (const f of ["components/Hero.tsx", "components/Importer.tsx", "components/Configurator.tsx"]) {
      const src = read(f).replace(/^\s*\/\/.*$/gm, "");
      expect(src, `${f} no longer derives the warranty term`).toMatch(/WARRANTY_(MONTHS|TERM)/);
      expect(src, `${f} types the period instead of deriving it`).not.toMatch(/12\s*חודשים/);
    }
  });

  it("the corpus states the period, in both the word and the number", () => {
    // Both forms on purpose: a buyer types "שנה" as often as "12 חודשים", and
    // retrieval here matches on body text.
    expect(corpus, "no corpus row states the period as a number").toContain(`${WARRANTY_MONTHS} חודשים`);
    expect(corpus, "no corpus row states the period in words").toMatch(/אחריות[^$]{0,40}שנה|שנה[^$]{0,40}אחריות/);
  });

  it("the corpus says who actually sells, not only who imports", () => {
    // Three parties are easy to confuse: MIA Dynamics makes it, MEU imports it and
    // backs the warranty, MiaMe.co.il sells it. The corpus named the first two.
    expect(corpus, "no row says where the online sale happens").toContain("MiaMe.co.il");
    expect(corpus).toContain(IMPORTER_NAME);
  });
});

describe("the importer is named, never dialled", () => {
  it("no corpus row carries a phone number", () => {
    // Owner instruction: MEU is credited as the official importer and as the party
    // behind the warranty, and nothing more. The corpus is the surface most likely
    // to leak one, because a row is written as prose and never reviewed as a page.
    const bodies = [...corpus.matchAll(/\$b\$([\s\S]*?)\$b\$/g)].map((m) => m[1]);
    expect(bodies.length, "no corpus bodies parsed — this guard would be vacuous").toBeGreaterThan(10);
    const withPhone = bodies.filter((b) => /0[2-9]\d?[- ]?\d{7}/.test(b));
    expect(withPhone, `a phone number is published in a corpus row: ${withPhone.join(" | ")}`).toEqual([]);
  });

  it("the site still states it has no extra phone lines", () => {
    // The sentence that keeps the claim true. If a phone path is ever added, this
    // row has to change in the same commit — which is the point of pinning it.
    expect(corpus).toContain("אין סניפים ואין קווי טלפון נוספים");
  });
});
