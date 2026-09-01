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

  it("the alignment migration is present and sorts last among the corpus seeds", () => {
    // Order is the whole mechanism: the seeds insert, "zz" adds the Hebrew SPYQE
    // name, "zzz" aligns the catalogue. If this file stops sorting last, a replay
    // ends on someone else's wording.
    const corpusSeeds = readdirSync(MIG)
      .filter((f) => f.endsWith(".sql") && !f.endsWith(".rollback.sql") && f.includes("knowledge"));
    expect(corpusSeeds).toContain(ALIGN);
    expect([...corpusSeeds].sort().at(-1)).toBe(ALIGN);
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

  it("the rollback restores the pre-alignment bodies and says what that costs", () => {
    // A rollback that quietly reinstates a measured defect is a trap.
    const rb = readFileSync(`${MIG}/${ALIGN.replace(".sql", ".rollback.sql")}`, "utf8");
    expect(rb).toMatch(/REINSTATES A MEASURED DEFECT/);
    expect(rb).toMatch(/delete from public\.knowledge where id = 'price-spyqe'/);
  });
});
