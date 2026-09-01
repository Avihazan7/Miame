// test/catalogAlignment.test.ts — the corpus catalogue agrees with the real catalogue.
//
// MEASURED ON THE LIVE CORPUS, 2026-09-01, before this was fixed:
//     rows containing "4x2"        3
//     rows containing "2×4 City"   0      ← the name every rendered surface uses
//     rows containing "Pro Max"    0      ← the flagship's actual name
//     pricing rows / SPYQE         3 / 0
//
// lib/models.ts names the models "2×4 City", "2×4 City Long Range" and "4×4 Pro Max".
// The corpus was using the INTERNAL IDS — 4x2 / 2x4 / 4x4 — which appear on no surface
// a visitor has ever seen. Retrieval is the Hebrew keyword path and matches on body
// text, so a buyer typing either name the storefront showed them matched NOTHING; and
// "2x4" matched the Long Range row, answering a question about the entry model with
// the dearer one.
//
// THE CONTRACT THIS FILE HOLDS: lib/models.ts and lib/spyqe.ts remain the single
// source of truth — compile-checked, and already guarded by a dozen derivation tests.
// The corpus must AGREE with them; it must never become a second source. So this file
// reads the source modules and asserts the replay end-state carries what they say.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { MODELS } from "../lib/models";
import { SPYQE, SPYQE_TOTAL, SPYQE_BALANCE } from "../lib/spyqe";

const MIG = "supabase/migrations";

/** The corpus end-state = every forward migration that writes catalogue rows,
 *  concatenated in replay order. A later file may correct an earlier one, so what
 *  matters is what the LAST writer says — hence "the alignment file". */
const ALIGN = "20260901_knowledge_zzz_catalog_alignment.sql";

describe("the corpus catalogue answers to the storefront's names", () => {
  const align = readFileSync(`${MIG}/${ALIGN}`, "utf8");

  it("is the last word on every catalogue row, whatever sorts after it", () => {
    // Order is the whole mechanism: the seeds insert, "zz" adds the Hebrew SPYQE name,
    // "zzz" aligns the catalogue. What must hold is not that this file sorts LAST —
    // corpus migrations that touch other rows may and do land after it — but that
    // nothing landing after it writes a CATALOGUE row. That is the property "sorts
    // last" was standing in for, and it is the one worth asserting: a later file
    // rewriting price-4x2 would end the replay on someone else's wording, and a later
    // file rewriting `finance` would not.
    const corpusSeeds = readdirSync(MIG)
      .filter((f) => f.endsWith(".sql") && !f.endsWith(".rollback.sql") && f.includes("knowledge"))
      .sort();
    expect(corpusSeeds).toContain(ALIGN);

    const CATALOGUE_ROWS = ["price-4x2", "price-2x4lr", "price-4x4", "price-spyqe"];
    const after = corpusSeeds.slice(corpusSeeds.indexOf(ALIGN) + 1);
    for (const f of after) {
      const sql = readFileSync(`${MIG}/${f}`, "utf8").replace(/^\s*--.*$/gm, "");
      for (const row of CATALOGUE_ROWS) {
        expect(
          sql.includes(`'${row}'`),
          `${f} sorts after the alignment and writes ${row} — the replay would end on its wording, not the storefront's`,
        ).toBe(false);
      }
    }
  });

  for (const m of MODELS) {
    it(`names "${m.name}" and prices it at ${m.price.toLocaleString("he-IL")}`, () => {
      expect(
        align.includes(m.name),
        `the catalogue does not name "${m.name}" — the buyer sees that name on every surface`,
      ).toBe(true);
      expect(
        align.includes(m.price.toLocaleString("he-IL")),
        `the catalogue does not carry ${m.name}'s price from lib/models.ts`,
      ).toBe(true);
    });
  }

  it("covers SPYQE in the pricing category, on SPYQE's own terms", () => {
    // A buyer asking "what do you sell and for how much" reaches `pricing`. SPYQE was
    // absent from it, so the answer silently described one of the two products.
    expect(align).toMatch(/'price-spyqe'/);
    expect(align).toMatch(/category = 'pricing'[\s\S]*spyqe/i);
    for (const n of [SPYQE_TOTAL, SPYQE.listPrice, SPYQE_BALANCE, SPYQE.deposit]) {
      expect(align.includes(n.toLocaleString("he-IL")), `missing ${n}`).toBe(true);
    }
    expect(align).toContain(`${SPYQE.months} תשלומים`);
    expect(align).toContain(String(SPYQE.slots));
  });

  it("keeps the internal id as an alias, never as the product name", () => {
    // "4x2" is an id, not a name. It stays searchable — someone may have seen it in
    // an old message — but it must never be what the row calls the machine.
    for (const line of align.split("\n")) {
      if (!line.includes("מיה פור")) continue;
      const namesById = /מיה פור\s+4x2|מיה פור\s+4x4|מיה פור\s+2x4\s/.test(line);
      expect(namesById, `a catalogue row leads with an internal id: ${line.trim().slice(0, 80)}`).toBe(false);
    }
  });

  // ── The corpus END STATE, not one file's four named rows ────────────────────
  //
  // WHY THIS EXISTS. Everything above checks the ALIGNMENT FILE, against a hardcoded
  // list of four catalogue rows. That list was right about the catalogue and wrong
  // about the invariant: naming a model is not the catalogue's privilege. TWO rows
  // outside the list — `model-choose` (the row that answers "איך לבחור דגם") and
  // `spec-weight` — kept the internal ids through the entire alignment phase, because
  // nothing looked at rows nobody had thought to list. Measured live 2026-09-01.
  //
  // So this replays the corpus instead of trusting a list: every forward migration
  // that writes a knowledge body, in filename order, later writer wins. The checks
  // then run on what the replay ENDS on — which is what a buyer is actually answered
  // with — and they are shape checks, so a row added tomorrow is covered without
  // anyone remembering to register it.

  /** id → body, as the replay leaves it. Writers here always write whole bodies. */
  function corpusEndState(): Map<string, string> {
    const files = readdirSync(MIG)
      .filter((f) => f.endsWith(".sql") && !f.endsWith(".rollback.sql") && f.includes("knowledge"))
      .sort();
    const out = new Map<string, string>();
    for (const f of files) {
      const sql = readFileSync(`${MIG}/${f}`, "utf8");
      // `update … set body = $b$…$b$ … where id = 'x'`
      for (const m of sql.matchAll(
        /update\s+public\.knowledge\s+set\s+body\s*=\s*\$b\$([\s\S]*?)\$b\$[\s\S]*?where\s+id\s*=\s*'([^']+)'/g,
      )) out.set(m[2], m[1]);
      // `insert … values ('id', 'source', 'category', $b$…$b$)`
      for (const m of sql.matchAll(
        /\(\s*'([^']+)'\s*,\s*'[^']*'\s*,\s*'[^']*'\s*,\s*\$b\$([\s\S]*?)\$b\$\s*\)/g,
      )) out.set(m[1], m[2]);
      // seed tuples — four columns (id, source, category, body) and three (id, source, body)
      for (const m of sql.matchAll(/\(\s*'([a-z0-9-]+)'\s*,\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'((?:[^']|'')*)'\s*\)/g))
        out.set(m[1], m[2]);
      for (const m of sql.matchAll(/\(\s*'([a-z0-9-]+)'\s*,\s*'[^']*'\s*,\s*'((?:[^']|'')*)'\s*\)/g))
        out.set(m[1], m[2]);
    }
    return out;
  }

  const END = corpusEndState();

  it("the replay actually reconstructs a corpus", () => {
    // A guard over an empty map passes forever. Every check below depends on this.
    expect(END.size, "the migration replay extracted no bodies — the checks below are vacuous").toBeGreaterThan(25);
    for (const id of ["model-choose", "spec-weight", "price-4x2", "price-4x4"])
      expect(END.has(id), `the replay never saw ${id}`).toBe(true);
  });

  it('no row ends the replay carrying "4×2" — a designation from no source', () => {
    // Not the name ("2×4 City") and not even the internal id (`4x2`): the digits are
    // reversed. It appeared on no surface a visitor ever saw, and in no source file.
    const bad = [...END].filter(([, b]) => b.includes("4×2")).map(([id]) => id);
    expect(bad, `rows still carrying "4×2": ${bad.join(", ")}`).toEqual([]);
  });

  it("no row DESIGNATES a model by its internal id", () => {
    // ASCII `x` is the whole tell: the real names use the multiplication sign
    // ("2×4 City"), the internal ids use a letter ("4x2"). So "דגם" followed by a
    // letter-x form is always an id standing where the product's name belongs, while
    // "דגם 2×4 City" — the corrected text — is never matched. The ids stay legitimate
    // as ALIASES ("הידוע גם כ-4x2"), which is why the pattern is anchored on "דגם".
    const bad = [...END].filter(([, b]) => /דגם\s+[0-9]x[0-9]/.test(b)).map(([id]) => id);
    expect(bad, `rows designating a model by internal id: ${bad.join(", ")}`).toEqual([]);
  });

  it("names every model from lib/models.ts somewhere in the corpus", () => {
    // The mirror of the two checks above: they forbid the wrong name, this requires
    // the right one. Without it, deleting the names entirely would pass.
    const all = [...END.values()].join("\n");
    for (const m of MODELS)
      expect(all.includes(m.name), `no row names "${m.name}" — the name on every surface`).toBe(true);
  });

  it("the comparison row names all three, as the buyer is shown them", () => {
    // `model-choose` answers "איך לבחור דגם" — asked BEFORE picking a model, which is
    // exactly when the names have to match the storefront.
    const body = END.get("model-choose") ?? "";
    for (const m of MODELS)
      expect(body.includes(m.name), `model-choose does not name "${m.name}": ${body}`).toBe(true);
  });

  it("the rollback restores the pre-alignment bodies and says what that costs", () => {
    // A rollback that quietly reinstates a measured defect is a trap.
    const rb = readFileSync(`${MIG}/${ALIGN.replace(".sql", ".rollback.sql")}`, "utf8");
    expect(rb).toMatch(/REINSTATES A MEASURED DEFECT/);
    expect(rb).toMatch(/delete from public\.knowledge where id = 'price-spyqe'/);
  });
});
