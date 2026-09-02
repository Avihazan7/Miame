/**
 * Commercial truth — every number a buyer reads traces to exactly one source.
 *
 * The failure mode this file exists for is never a wrong number. It is the SAME
 * number written twice: the price in the Ministry of Defence worksheet and the
 * price in lib/models.ts, the instalment ceiling in five simulator strings and
 * the ceiling computeQuote() actually clamps against, the hourly rental rate in
 * lib/content.ts and the one in lib/rental.ts. Two copies agree on the day they
 * are written and disagree on the day one of them is edited, and nothing fails
 * in between — the site simply starts quoting two prices for one thing.
 *
 * So the assertions below are mostly ABSENCE assertions: the literal must not be
 * there. A test that checks the rendered number is right today would pass on the
 * day the copy drifts; a test that checks the number is not typed at all cannot.
 *
 * Read-only: source text plus pure modules. No network, no database.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { MODELS, getModel } from "@/lib/models";
import { TRACKS } from "@/lib/finance";
import { WARRANTY_MONTHS, WARRANTY_TERM } from "@/lib/content";
import { TRUST_SIGNALS } from "@/lib/deal-buzz";
import { HOME_FAQ } from "@/lib/home-faq";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

/**
 * Comments explain history, and history legitimately quotes the wording being
 * removed ("12 חודשים", "רשת MiaMe Hub"). Only what a file would actually RENDER
 * is in scope, so block comments, JSX comments and whole-line `//` comments come
 * out first. A line is only treated as a comment when it STARTS with `//` —
 * stripping every `//` would eat the `https://` in an href.
 */
const code = (src: string) =>
  src
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, " ")
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("//"))
    .join("\n");

/** Every source file that can put text in front of a buyer. */
function publicSources(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(ROOT, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.(tsx?|txt)$/.test(entry)) out.push(rel);
    }
  };
  walk("app");
  walk("components");
  walk("lib");
  walk("brain");
  out.push("public/llms.txt");
  return out;
}

const SOURCES = publicSources();

/**
 * The subset that CAN derive. public/llms.txt is plain text: it has no imports
 * and no interpolation, so "read it from the constant" is not a thing it can do.
 * It stays in scope for the rules about WORDING (a claimed network, a malformed
 * price) and out of scope for the rules about DERIVATION.
 */
const MODULES = SOURCES.filter((f) => /\.tsx?$/.test(f));

describe("the warranty term is defined once and read everywhere", () => {
  // A warranty term is a consumer-law statement, not a marketing adjective. It
  // was promised on five surfaces, defined on none, and denied by the terms page.
  it("lib/content.ts is the only place a warranty term is written", () => {
    // SCOPE, STATED SO IT IS NOT MISTAKEN FOR CLEARANCE: this scans TypeScript only.
    // supabase/migrations/20260629_knowledge_seed_miame.sql line 90 seeds a sixth
    // hand-typed copy — "אחריות יבואן רשמי 12 חודשים · MEU …" — and it is the row the
    // LIVE corpus serves, while brain/knowledge.ts FALLBACK is only the offline path.
    // A migration cannot import a constant, so it is not fixable here; it is known
    // remaining exposure, not an audited-and-cleared file.
    const hits = MODULES.filter(
      (f) => f !== "lib/content.ts" && /\d+\s*חודשים/.test(code(read(f))),
    );
    expect(hits, `a warranty term is typed in: ${hits.join(", ")}`).toEqual([]);
  });

  it("the phrase the surfaces render is derived from the number", () => {
    expect(WARRANTY_TERM).toContain(String(WARRANTY_MONTHS));
    // The trust bar renders the constant itself, not a copy that looks like it.
    expect(TRUST_SIGNALS.map((s) => s.label)).toContain(WARRANTY_TERM);
  });

  it("the terms page asserts no warranty period this repo cannot evidence", () => {
    // HELD, DELIBERATELY, AND THIS IS THE SHAPE OF THE HOLD.
    //
    // The original patch made §6 assert "תקופת אחריות היבואן הרשמי למיה פור היא 12
    // חודשים" in place of deferring the term to the point of sale. It is the only
    // change in this workstream that alters what a visitor READS, it does it on the
    // page with legal effect, and nothing in this repository evidences 12 months
    // against an importer document — the five marketing surfaces and the corpus seed
    // are the only sources, and they are exactly what §6 was hedging. Writing it into
    // the terms would turn marketing copy into a binding term by way of a refactor,
    // and the page still carries `UPDATED = "4 ביולי 2026"` and "גרסה 1.0": a
    // substantive edit needs a new version and date, which is the owner's act.
    //
    // So the guard asserts the SAFE direction instead of the pending one: the terms
    // page must not type a warranty period at all. If the owner confirms the figure,
    // this becomes `expect(terms).toContain("WARRANTY_MONTHS")` in the same commit
    // that bumps the version — and the assertion below still holds, because the term
    // will then be read rather than typed.
    const terms = code(read("app/legal/terms/page.tsx"));
    expect(
      terms,
      "the terms page now states a warranty period — it must be derived and version-bumped, not typed",
    ).not.toMatch(/\d+\s*חודשים/);
  });
});

describe("the simulator quotes the ceiling it actually enforces", () => {
  const src = read("components/Configurator.tsx");

  it("types no instalment count anywhere on the screen", () => {
    const typed = code(src).match(/עד\s*\d+\s*תשלומים/g) ?? [];
    expect(typed, `hand-typed instalment ceiling: ${typed.join(" | ")}`).toEqual([]);
  });

  it("all five strings read the same rule computeQuote clamps against", () => {
    expect(code(src)).toContain("const MAX_MONTHS = TRACKS[TRACK_ID].months.max;");
    const derived = code(src).match(/\{MAX_MONTHS\}\s*תשלומים/g) ?? [];
    expect(derived).toHaveLength(5);
    // TRACK_ID is the one surviving track, so the constant above resolves to the
    // private track's ceiling — the same value computeQuote() clamps `months` to.
    expect(code(src)).toContain('const TRACK_ID: CustomerType = "private";');
    expect(TRACKS.private.months.max).toBeGreaterThanOrEqual(TRACKS.private.months.min);
  });
});

describe("the Ministry of Defence worksheet reads the catalogue", () => {
  const src = read("components/Tribute.tsx");
  const entry = getModel("4x2");

  it("types no entry price", () => {
    expect(code(src)).not.toContain(entry.price.toLocaleString("he-IL"));
    expect(code(src)).toContain("entry.price.toLocaleString");
  });

  it("the model it reads is still the entry model the worksheet is built on", () => {
    // The whole calculator argues from the CHEAPEST card: 90% + 10% covering it
    // is what makes the "0 ₪" row true. Reading a different row would keep the
    // arithmetic and lose the argument.
    expect(entry.price).toBe(Math.min(...MODELS.map((m) => m.price)));
  });
});

describe("the site sells ONE thing, and offers nothing it does not sell", () => {
  // OWNER DECISION, 2026-09-02: MiaMe markets and sells MIA FOUR. No rental, no
  // business partners. What this replaced was not stale copy — it was live offers:
  // the homepage FAQ answered "how do I become a MiaMe Hub", the assistant quoted
  // ₪50/hour and a 13% success fee, /partners sat in the header nav, and the corpus
  // told a buyer about a rental fleet in Eilat. A visitor ACTS on an offer, so
  // publishing one that does not exist is worse than publishing nothing.
  //
  // These tests replace two that pinned the removed numbers to a single definition.
  // That was the right guard while the numbers existed; the guard that matters now
  // is that they cannot come back by accident — which is the shape below, because a
  // deletion with no gate is a deletion that gets undone by the next person who
  // finds an old component and wires it up again.

  it("no module defines rental or partner economics", () => {
    const hits = MODULES.filter((f) =>
      /\bRENTAL_FROM\b|\bRENTAL_PRICES\b|\bSUCCESS_FEE_PCT\b|\bRENTAL_HOURLY_FROM\b/.test(code(read(f))),
    );
    expect(hits, `rental/partner economics reappeared in: ${hits.join(", ")}`).toEqual([]);
  });

  it("no surface offers a rental, a fleet, or a partnership", () => {
    const hits = SOURCES.filter((f) =>
      /רשת\s*MiaMe|MiaMe\s*Hub|PARTNER\s+NETWORK|Success\s*Fee|Green\s*Extreme/i.test(code(read(f))),
    );
    expect(hits, `an offer we do not sell is published in: ${hits.join(", ")}`).toEqual([]);
  });

  it("no code writes to a table for a product we do not sell", () => {
    // THE GAP THIS CLOSES, found by the removal missing it. The two checks above
    // look for OFFER COPY — "MiaMe Hub", "Success Fee", a rate. They passed while
    // lib/supabase.ts still carried savePartner(), saveRentalLead(), their record
    // types and writes to `partners` and `rental_leads`: 48 lines of live write
    // path to two products that no longer exist, with zero callers.
    //
    // Dead plumbing is not harmless. It is the thing a future component imports
    // when someone decides to "bring the partner form back" — the copy would be
    // rewritten and reviewed, and the persistence would be picked up unread. So
    // the guard has to cover the pipe, not only the sign on it.
    const hits = MODULES.filter((f) =>
      /\brental_leads\b|\bsaveRentalLead\b|\bsavePartner\b|\bPartnerRecord\b|\bRentalLeadRecord\b|insertLenient\(\s*"partners"/.test(
        code(read(f)),
      ),
    );
    expect(hits, `a write path for a removed product survives in: ${hits.join(", ")}`).toEqual([]);
  });

  it("the homepage FAQ asks nothing about becoming a partner", () => {
    // It did, and the same entry fed the visible accordion AND the FAQPage JSON-LD,
    // so the offer was made twice: once to a reader and once to a machine.
    const hub = HOME_FAQ.find((f) => /Hub|שותפ/.test(f.q));
    expect(hub, `the FAQ still offers a partnership: ${hub?.q}`).toBeUndefined();
  });
});

describe("the assistant's offline answers name the model each number belongs to", () => {
  // AskBrain's FAQ is module-private and the component is a client component, so
  // this reads the source. What matters is structural and survives static
  // reading: no typed price, both models named, and the SPYQE row placed where
  // faqAnswer()'s first-wins tie-break can reach it.
  const src = read("components/AskBrain.tsx");

  it("types none of the MIA FOUR prices", () => {
    for (const m of MODELS) {
      expect(
        code(src),
        `${m.name}'s price is typed into the fallback instead of read from lib/models.ts`,
      ).not.toContain(m.price.toLocaleString("he-IL"));
    }
    expect(code(src)).toContain("MODELS.map");
  });

  it("answers the cost question for SPYQE too, from lib/spyqe.ts", () => {
    expect(code(src)).toContain("SPYQE_TOTAL");
    expect(code(src)).toContain("SPYQE_BALANCE");
    expect(code(src)).toContain("SPYQE.listPrice");
  });

  it("puts the SPYQE row where a tie resolves to it", () => {
    // faqAnswer() keeps the first row on an equal key count, so a question that
    // names ספייק and asks about טווח must meet the SPYQE row first — otherwise
    // it is answered with MIA FOUR's range, which is the leak the SPYQE corpus
    // rows exist to prevent.
    const spyqe = code(src).indexOf('"ספייק"');
    const range = code(src).indexOf('"טווח"');
    expect(spyqe, "the fallback has no SPYQE row at all").toBeGreaterThan(-1);
    expect(spyqe).toBeLessThan(range);
  });
});

describe("no price renders with a stray separator before the currency sign", () => {
  // A price is one token. "27,900, ₪" reached both the visible copy and the
  // FAQPage JSON-LD of the flagship model's page — and a malformed price in a
  // rich result is worse than one on the page, because it is republished by a
  // surface the owner cannot edit.
  it("nothing writes a comma between the amount and ₪", () => {
    const hits: string[] = [];
    for (const f of SOURCES) {
      for (const line of code(read(f)).split("\n")) {
        if (/\d\s*,\s+₪/.test(line)) hits.push(`${f}: ${line.trim().slice(0, 90)}`);
      }
    }
    expect(hits, `malformed price:\n${hits.join("\n")}`).toEqual([]);
  });
});
