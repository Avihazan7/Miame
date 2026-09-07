// test/corpusFixtureFidelity.test.ts — the ranking fixture is the MIGRATIONS' end-state.
//
// THE GAP THIS CLOSES, measured 2026-09-02. test/retrievalRanking.test.ts holds the
// most valuable property in the brain — that a buyer's question reaches the row that
// answers it — and it does so against a hand-transcribed fixture whose header says
// "verbatim from the live corpus". Nothing checked that claim. Phase 21 shipped
// `spec-tyres` to production and the string "14.5X4.8-7" appeared in exactly ONE file
// under test/: the fixture line itself. So the corpus migrations were unguarded in
// both directions —
//
//   · edit a body in a migration and the fixture keeps ranking the OLD text, so the
//     ranking suite stays green while production answers differently; and
//   · edit the fixture to make a stubborn case pass and no migration has to change,
//     which is the same thing as writing the answer key.
//
// This file makes the fixture a DERIVATIVE of the SQL rather than a parallel copy: for
// every row the corpus migrations write, the fixture must carry that migration's final
// body, byte for byte, in replay order.
//
// ONE LIMITATION, STATED RATHER THAN PAPERED OVER. This compares BODIES; it does not
// model DELETES. `rental` is the live example: the seed writes it, PR #162 removed the
// product and a later migration deleted the row, and the fixture still carries it — so
// this file is satisfied while production has no such row. That is deliberate. The case
// it feeds ("כמה עולה להשכיר" must not be answered with a purchase price) guards a real
// mechanism — a different product line outranking the right one — and deleting the
// fixture row would delete the guard with it. It is a HISTORICAL row, kept for the
// mechanism, and this sentence is what stops the next reader from reading the fixture
// as a mirror of production in every particular.
//
// WHAT IT DOES NOT DO. It does not read the database. A guard that silently skips when
// it cannot connect protects nothing, and this suite runs with no credentials in CI.
// It compares the repo against the repo; the phase manifest is what records that the
// repo and production agree.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIG = "supabase/migrations";

/** Forward corpus migrations, in the order the applier replays them. */
const files = readdirSync(MIG)
  .filter((f) => f.endsWith(".sql") && !f.endsWith(".rollback.sql") && f.includes("knowledge"))
  .sort();

/**
 * id → the LAST body any forward migration writes for it.
 *
 * THREE write shapes, and the third is the one a first draft of this file missed —
 * which is worth recording, because missing it is how a fidelity guard silently covers
 * only the recent half of the corpus:
 *   1. insert … values ('id', 'source', 'category', $b$body$b$        (the 2026-09 files)
 *   2. update … set body = $b$body$b$ … where id = 'id'               (corrections)
 *   3. ('id', 'source', 'category', 'body'),                          (the 2026-07 seed)
 * The seed writes a multi-row VALUES list in plain single quotes, and it is where nine
 * of the fixture's rows still come from. A parser that only knows the dollar-quoted
 * forms reports "20 of 33 covered" and calls it a pass.
 */
function endState(): Map<string, { body: string; file: string }> {
  const out = new Map<string, { body: string; file: string }>();
  for (const f of files) {
    const sql = readFileSync(join(MIG, f), "utf8");
    // 3 · the seed's plain-quoted tuples, first so a later dollar-quoted write wins.
    for (const m of sql.matchAll(/\(\s*'([a-z0-9-]+)',\s*'[^']*',\s*'[^']*',\s*'((?:[^']|'')*)'\s*\)/g)) {
      out.set(m[1], { body: m[2].replace(/''/g, "'"), file: f });
    }
    for (const m of sql.matchAll(/values\s*\(\s*'([a-z0-9-]+)'[\s\S]*?\$b\$([\s\S]*?)\$b\$/g)) {
      out.set(m[1], { body: m[2], file: f });
    }
    for (const m of sql.matchAll(/set\s+body\s*=\s*\$b\$([\s\S]*?)\$b\$[\s\S]*?where\s+id\s*=\s*'([a-z0-9-]+)'/g)) {
      out.set(m[2], { body: m[1], file: f });
    }
  }
  return out;
}

/** The fixture, read as text so this never imports a 40-row array into memory twice. */
const RANKING = readFileSync("test/retrievalRanking.test.ts", "utf8");

/**
 * The rows of the `const CORPUS = [ … ]` array, and ONLY those.
 *
 * Scoped deliberately: the same file carries synthetic fixtures further down — `tight`,
 * `two-common`, `n1`…`n4` — that exist to exercise length normalisation and IDF and are
 * NOT corpus rows. A whole-file scan pulled them in and then reported them as fixture
 * rows no migration writes, which is true and meaningless.
 */
function fixtureRows(): { id: string; body: string }[] {
  const start = RANKING.indexOf("const CORPUS = [");
  const block = RANKING.slice(start, RANKING.indexOf("\n];", start));
  const out: { id: string; body: string }[] = [];
  for (const m of block.matchAll(/\{\s*id:\s*"([a-z0-9-]+)",\s*source:\s*"[^"]*",\s*body:\s*"((?:[^"\\]|\\.)*)"\s*\}/g)) {
    // The fixture is TypeScript source: \" is a quote, \\ is a backslash.
    out.push({ id: m[1], body: m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\") });
  }
  return out;
}

describe("the ranking fixture carries what the migrations write", () => {
  const written = endState();
  const rows = fixtureRows();

  it("parsed both sides — neither is empty, and the parser is not matching nothing", () => {
    // A regex that stops matching turns every assertion below into a no-op. Both
    // counts are asserted against a floor rather than an exact number so adding a
    // corpus row does not fail this, while a broken parser does.
    expect(files.length, "no corpus migrations found").toBeGreaterThan(5);
    expect(written.size, "no bodies parsed out of the migrations").toBeGreaterThan(15);
    expect(rows.length, "no rows parsed out of the ranking fixture").toBeGreaterThan(15);
  });

  it("covers most of the fixture — a parser that matched two rows would pass vacuously", () => {
    const covered = rows.filter((r) => written.has(r.id));
    expect(
      covered.length,
      `only ${covered.length} of ${rows.length} fixture rows were found in any migration — ` +
        "either the fixture invented ids or the SQL parser stopped working",
    ).toBeGreaterThanOrEqual(rows.length - 2);
  });

  for (const row of fixtureRows()) {
    const w = endState().get(row.id);
    if (!w) continue;
    it(`${row.id} matches ${w.file}`, () => {
      expect(
        row.body,
        `test/retrievalRanking.test.ts ranks a body for "${row.id}" that no migration writes.\n` +
          `  fixture:   ${row.body.slice(0, 120)}\n` +
          `  ${w.file}: ${w.body.slice(0, 120)}\n` +
          "The fixture is not a place to edit an answer — change the migration, or the\n" +
          "ranking suite is grading production against text production does not have.",
      ).toBe(w.body);
    });
  }
});

describe("phase 22 writes what the site publishes, and nothing more", () => {
  const sql = readFileSync(join(MIG, "20260902_zzknowledge_site_truths.sql"), "utf8");

  // Each figure, and the live surface it is quoted from. A number here that is not on
  // one of those surfaces would make the corpus a second source of truth.
  const PUBLISHED: [string, string][] = [
    ["689 × 1,244 × 1,190", "components/Specs.tsx"],
    ["8 שעות", "components/Specs.tsx"],
    ["US 11,878,763 B2", "components/Patents.tsx"],
    ["US 12,097,926 B2", "components/Patents.tsx"],
    ["IL 280339", "components/Patents.tsx"],
    ["IL 285336", "components/Patents.tsx"],
    ["EN17128", "components/LegalStatus.tsx"],
    ["שילדה", "components/LegalStatus.tsx"],
  ];

  it.each(PUBLISHED)("%s is quoted from %s, not invented here", (figure, surface) => {
    expect(sql, `the migration no longer carries ${figure}`).toContain(figure);
    expect(
      readFileSync(surface, "utf8"),
      `${surface} does not publish "${figure}" — the corpus would be the only place it exists`,
    ).toContain(figure);
  });

  it("does not borrow SPYQE's folded height", () => {
    // 439mm is SPYQE's. MIA FOUR has no published folded height, and the silence is
    // exactly what a dimensions row is tempted to fill.
    const body = sql.match(/'spec-dimensions'[\s\S]*?\$b\$([\s\S]*?)\$b\$/)?.[1] ?? "";
    expect(body, "spec-dimensions was not found in the migration").not.toBe("");
    expect(body, "spec-dimensions quotes a folded height").not.toContain("439");
    expect(body, "the row must SAY the folded height is unpublished, not just omit it").toContain("טרם פורסם");
  });

  it("makes no claim about a licence, insurance or a minimum age", () => {
    // The site makes no such determination (components/LegalStatus.tsx is explicit that
    // it is not legal advice), so the corpus must not either. `רישוי` — registration —
    // is a different word from `רישיון`, and only the first is on the page.
    const body = sql.match(/'legal-status'[\s\S]*?\$b\$([\s\S]*?)\$b\$/)?.[1] ?? "";
    expect(body, "legal-status was not found in the migration").not.toBe("");
    for (const claim of ["רישיון נהיגה", "ביטוח", "גיל מינימלי"]) {
      expect(body, `legal-status makes a claim the site does not: ${claim}`).not.toContain(claim);
    }
    expect(body, "the page's own disclaimer did not come across").toContain("אינו ייעוץ משפטי");
  });
});
