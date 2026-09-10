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
import { TRUST_SIGNALS, LAUNCH_OFFER } from "@/lib/deal-buzz";
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
    // THE HEBREW HALF, ADDED 2026-09-09. This gate already scanned brain/masters.ts —
    // publicSources() walks brain/ — and it still missed the live offer sitting there:
    // the concierge system prompt told the model to help the visitor choose
    // "רכישה, זכאות כוחות הביטחון, השכרה באילת או שותפות". Every term in the pattern
    // above is English or a brand name, so the Hebrew wording sailed through. The
    // corpus rows for both products were deleted by
    // supabase/migrations/20260902_knowledge_zzzzzzz_sell_one_thing.sql, which even
    // RAISES if a row still offers one — so the model was being instructed to sell
    // something it had no grounding for, which is the definition of the hallucination
    // condition, and /partners and /rent-eilat both answer 410 (middleware.ts:25).
    //
    // "השכרה" alone is NOT bannable and is deliberately absent — but the ORIGINAL
    // version of this comment got the reason wrong, and the error cost a live defect.
    // It read: "it is legitimate in app/legal/terms (rental and service of the
    // product), app/manifest.ts, and the fleet language in lib/seo-pages.ts."
    // Two of those three were false. app/manifest.ts had "והשכרה" REMOVED as a defect
    // — its own comment says it "offered a rental the business does not run" — and
    // app/legal/terms carried "תהליך הרכישה, ההשכרה והשירות של מוצרי מיה דיינמיקס"
    // until 2026-09-10, in the one document that binds, while public/llms.txt told
    // answer engines "MiaMe אינה משכירה". A named whitelist entry is why nobody
    // looked: the file was cleared by assertion, not by reading it.
    //
    // The line that IS correct is WHOSE rental it is. lib/seo-pages.ts writes
    // "עסקים שמפעילים צי השכרה" — that describes a BUYER who runs a rental fleet, and
    // is a legitimate B2B segment. app/legal/terms wrote about MiaMe's own process,
    // which is an OFFER. First person is banned; third person is not. The clause
    // after this one applies that rule to the legal pages, where everything written
    // is first-person by construction.
    // The two terms below measure zero across every published surface, so they are
    // precise rather than broad.
    const hits = SOURCES.filter((f) =>
      /רשת\s*MiaMe|MiaMe\s*Hub|PARTNER\s+NETWORK|Success\s*Fee|Green\s*Extreme|שותפות|באילת/i.test(code(read(f))),
    );
    expect(hits, `an offer we do not sell is published in: ${hits.join(", ")}`).toEqual([]);

    // …AND THE HUB UNDER ANY OTHER NAME. The clause above names the BRANDED forms
    // ("רשת MiaMe", "MiaMe Hub"), and on 2026-09-09 three live surfaces were found
    // offering the same dead product without either of them — they wrote "השכרה Hub":
    //   brain/masters.ts     the Match-Master SYSTEM PROMPT, on every conversation
    //   brain/knowledge.ts   the offline FALLBACK row, served when Supabase is down
    //   app/manifest.ts      the PWA description, a published surface
    // The owner settled rental out of the business on 2026-09-02 (phases.json,
    // 9-rental-fleet-os) and phase 18 removed its surfaces; these three survived
    // because the gate matched the brand, not the offer. An offer is what it DOES.
    const renting = SOURCES.filter((f) => {
      const src = code(read(f));
      // "השכרה"/"להשכיר" next to Hub, or a track list that still carries a rental leg
      // (?![א-ת]) and NOT \b — for the THIRD time today. JavaScript defines \b on
      // \w = [A-Za-z0-9_], so there is no word boundary beside a Hebrew letter and
      // /השכרה\b/ never matches. The first version of this very clause ended in \b
      // and passed the mutation that put "· השכרה" back with no "Hub" at all. Two
      // other gates in this repo had the same defect and were fixed hours earlier;
      // writing it a third time is why the rule is spelled out here rather than
      // remembered. Hebrew rules need Hebrew terminators.
      return /(?:השכרה|להשכיר|השכרת)\s*(?:Hub|האב)/i.test(src) || /·\s*(?:השכרה|השכרת)(?![א-ת])/.test(src);
    });
    expect(
      renting,
      `a rental track is offered in: ${renting.join(", ")} — the business does not rent ` +
        `(supabase/phases.json, 9-rental-fleet-os)`,
    ).toEqual([]);

    // THE LEGAL PAGES, THE ONE PLACE A STALE OFFER BINDS. Everything under
    // app/legal/ is written in the first person — it describes what MiaMe does, not
    // what a customer does — so there is no legitimate reading of a rental verb
    // there, and no whitelist is needed to tell the two apart. That is exactly why
    // this is a separate clause from the two above rather than a wider regex on
    // SOURCES: broadening those would have fired on lib/seo-pages.ts, whose
    // "עסקים שמפעילים צי השכרה" describes a BUYER operating a rental fleet.
    //
    // Prefixed forms matter. "ההשכרה" is what actually shipped, and any pattern
    // anchored on a bare word start would miss it — as would \b, which JavaScript
    // defines on [A-Za-z0-9_] and which therefore never matches beside a Hebrew
    // letter. This scans for the stem anywhere, which in a first-person document is
    // the correct bluntness.
    const legalPages = readdirSync("app/legal", { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => `app/legal/${e.name}/page.tsx`);
    expect(legalPages.length, "app/legal has no pages — this gate guards nothing").toBeGreaterThanOrEqual(3);
    const legalRenting = legalPages.filter((f) => /השכרה|להשכיר|השכרת|משכירה/.test(code(read(f))));
    expect(
      legalRenting,
      `the binding legal text still describes a rental MiaMe does not operate: ${legalRenting.join(", ")} ` +
        `— public/llms.txt tells answer engines "MiaMe אינה משכירה"`,
    ).toEqual([]);
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

// ── the footnote marker and its resolution travel together ──────────────────
//
// Added 2026-09-08, when the launch strip's two paragraphs were deleted for
// saying what the page already said. `.hero-v2-legal` is the next line that
// LOOKS like the same kind of excess — eleven words, small type — and it is the
// one that must not go: it is the sole resolution of the `*` in the Hero's
// "עד 18 תשלומים ללא ריבית והצמדה*", and with the strip's disclaimer retired it
// is now the only disclosure above the simulator. Cutting it would leave a
// dangling footnote marker AND a real disclosure gap. Nothing in test/ asserted
// it existed; now something does.
describe("a payments asterisk in the Hero resolves in the Hero", () => {
  const hero = code(read("components/Hero.tsx"));

  it("is reading the Hero this test thinks it is", () => {
    expect(hero, "components/Hero.tsx renders no payments claim — this guard is now blind").toMatch(/תשלומים/);
  });

  it("carries its own conditions line whenever it stars a payments claim", () => {
    if (!/תשלומים[^*\n]*\*/.test(hero)) return; // no marker, nothing to resolve
    expect(
      hero,
      'components/Hero.tsx marks a payments claim with "*" but no longer resolves it. ' +
        'The Hero\'s legal line is the only thing that does, and after the launch strip\'s ' +
        "disclaimer was retired it is the page's only disclosure above the simulator — " +
        "restore it, or drop the asterisk it belongs to.",
    ).toContain("בכפוף לאישור עסקה");
    expect(hero, "the same line is what promises stock is not guaranteed").toContain("זמינות מלאי");
  });
});

// ── the campaign label is written once ──────────────────────────────────────
//
// "מבצע השקה" renders twice on the home page — the launch strip's badge and the
// DealBuzz section kicker — and until 2026-09-08 the second was a hard-typed
// literal. Two copies of a promotional label agree on the day they are written
// and disagree on the day the campaign is renamed, which is this file's whole
// subject. An absence assertion, per the doctrine at the top: the literal must
// not be in the components at all.
describe("the launch campaign has one label", () => {
  const LABEL = LAUNCH_OFFER.kicker;

  it("is a label worth guarding", () => {
    expect(LABEL.length).toBeGreaterThan(3);
  });

  it("is never re-typed in a component — every render reads LAUNCH_OFFER.kicker", () => {
    const offenders = publicSources()
      .filter((rel) => rel.startsWith("components/") || rel.startsWith("app/"))
      .filter((rel) => code(read(rel)).includes(LABEL));
    expect(
      offenders,
      `these files type "${LABEL}" instead of reading LAUNCH_OFFER.kicker from ` +
        "lib/deal-buzz.ts. Rename the campaign once and they keep the old name.",
    ).toEqual([]);
  });
});

// ── no published surface asserts a regulatory exemption ─────────────────────
//
// THE DEFECT THIS CLOSES (measured 2026-09-09). public/llms.txt shipped this:
//
//   "אין צורך ברישיון נהיגה, ברישוי כלי או בביטוח חובה"
//
// No page on this site says that. lib/seo-pages.ts:240 is asked the licence
// question directly and deliberately declines to answer it — "דרישות הרישוי
// והשימוש כפופות לחוקי התעבורה והוראות הדין הרלוונטיות" — and
// components/LegalStatus.tsx makes only the narrow claims it can stand behind:
// no licence PLATE, no registration FEE, everything subject to the regulations,
// and an explicit "this is not legal advice".
//
// The repo had already reasoned this through. test/corpusFixtureFidelity.test.ts
// carries `it("makes no claim about a licence, insurance or a minimum age")`,
// whose comment names the exact trap: "`רישוי` — registration — is a different
// word from `רישיון`, and only the first is on the page." That gate reads ONE
// file: the corpus SQL. The claim was published on a different surface, and the
// gate's file-scoped slice is why nothing caught it — the same shape as the
// FAQPage-in-layout and brand-in-landing defects this repo has hit before.
//
// llms.txt is the worst possible surface for it: robots.txt advertises it as
// LLM-Content and GPTBot/ClaudeBot/PerplexityBot/Google-Extended are all Allowed,
// so an answer engine quotes it verbatim and attributes the claim to the seller.
//
// WHY PHRASES AND NOT WORDS. The corpus gate can ban the bare word "ביטוח"
// because it is scoped to one legal-status row. Here the scope is every public
// surface, and the bare words have honest homes — measured, not assumed:
//   ביטוח   → lib/marketplace-preview.ts:280,295 · brain/masters.ts:36
//             (what a lease quote includes; all hedged)
//   רישיון  → lib/seo-pages.ts:240 (the FAQ QUESTION, answered with a hedge)
//             brain/knowledge.ts:200 (a synonym map entry)
// Banning the topic would forbid asking the question. So this bans the
// ASSERTION SHAPES instead. Adding a phrase here is cheap; widening to a bare
// word would fire on all four legitimate lines above.
describe("no published surface asserts a regulatory exemption", () => {
  // Each entry is a claim the site does not make anywhere a lawyer has seen.
  const FORBIDDEN = ["רישיון נהיגה", "ביטוח חובה", "גיל מינימלי"];

  it.each(FORBIDDEN)('no public surface claims "%s"', (claim) => {
    const offenders = SOURCES.filter((rel) => read(rel).includes(claim));
    expect(
      offenders,
      `these surfaces assert "${claim}", which no page on the site states. ` +
        "Ground the wording in components/LegalStatus.tsx and the approved corpus row " +
        "(supabase/migrations/20260902_zzknowledge_site_truths.sql), or get the claim onto " +
        "the visible page first — llms.txt must mirror the site, never lead it.",
    ).toEqual([]);
  });

  // The gate above is an absence assertion, and an absence assertion passes just
  // as happily when it is looking at nothing. Pin that it is really reading the
  // file the defect shipped in.
  it("actually scans llms.txt, the surface the claim shipped on", () => {
    expect(SOURCES).toContain("public/llms.txt");
    expect(read("public/llms.txt")).toMatch(/מעמד חוקי/);
  });

  // And pin the positive half: having removed the invented exemption, the line
  // must still carry the hedge the visible page ends on, or the fix would have
  // been "say less" rather than "say what the site says".
  it("llms.txt carries the same not-legal-advice hedge the page does", () => {
    expect(read("public/llms.txt"), "llms.txt states a legal status with no disclaimer").toContain(
      "אינו ייעוץ משפטי",
    );
  });
});
