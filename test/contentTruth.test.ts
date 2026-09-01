/**
 * The campaign's content contract, applied to every layer that can publish text
 * — the live components, the replay seed, the migrations and the assistant's
 * fallback corpus.
 *
 * Why it exists: a claim removed from the site can survive in three other places
 * and come back. The dealer network came back through the seed once already; the
 * balloon payment outlived the slider that offered it; the flagship address
 * outlived the store. Each was removed from the surface a visitor sees and left
 * standing where a rebuild, a rollback or the assistant would find it.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { FALLBACK } from "../brain/knowledge";
import { SPYQE, SPYQE_TOTAL, SPYQE_BALANCE } from "../lib/spyqe";
import { MIA_FOUR_DELIVERY_DAYS } from "../lib/content";
import { TRACKS } from "../lib/finance";

const MIG = "supabase/migrations";

/** SQL comments explain history, including the wording being removed. Only what
 *  the file would actually WRITE is in scope. */
const sql = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("--"))
    .join("\n");

const migrations = readdirSync(MIG)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => ({ file: f, body: sql(readFileSync(`${MIG}/${f}`, "utf8")) }));

const surfaces = [
  ...migrations,
  { file: "public/llms.txt", body: readFileSync("public/llms.txt", "utf8") },
  { file: "brain/knowledge.ts", body: readFileSync("brain/knowledge.ts", "utf8") },
  { file: "lib/home-faq.ts", body: readFileSync("lib/home-faq.ts", "utf8") },
];

describe("no layer republishes what the campaign removed", () => {
  const BANNED = [
    // The simulator has no balloon — components/Configurator.tsx pins balloonPct
    // to 0. Quoting one describes a term of the deal that does not exist.
    { label: "balloon payment", re: /בלון/ },
    // The store closed (owner, 2026-08-31). A stale address is worse than none.
    { label: "flagship store address", re: /אליעזר\s*קפלן/ },
    { label: "flagship store", re: /חנות\s*(ה)?דגל/ },
    // The dealer network was replaced by one WhatsApp route.
    { label: "dealer network", re: /רשת\s*משווקים\s*מורשים/ },
    { label: "branch cities", re: /הוד-השרון|אשקלון/ },
    // The three customer tracks collapsed into one.
    { label: "three simulator tracks", re: /פרטי\/עסקי\/שותף/ },
    // The battery weighs ~6.3 kg (manufacturer capture, live DB, Specs.tsx). The
    // June seed said 10 kg and, being first in replay order, would have resurrected
    // it on every fresh database while 20260714's correction stood by refusing to
    // overwrite (audit finding, verified 31.08.26).
    { label: "10 kg battery weight", re: /במשקל\s*10\s*ק["']?"?ג/ },
  ];

  // A rollback undoes a migration, so it legitimately restores the state that
  // migration replaced — the dealer network, the branch cities and the three
  // customer tracks were all real, and putting them back is what a rollback is
  // FOR. What it may never restore is something that was untrue when it was
  // written or has since become untrue: the balloon the simulator never offered,
  // the 26-payment term lib/finance.ts never allowed, the store that has closed.
  const FALSEHOODS = new Set(["balloon payment", "flagship store address", "flagship store", "10 kg battery weight"]);

  for (const { label, re } of BANNED) {
    it(`does not republish: ${label}`, () => {
      const scope = FALSEHOODS.has(label)
        ? surfaces
        : surfaces.filter((s) => !s.file.endsWith(".rollback.sql"));
      const hits = scope.filter((s) => re.test(s.body)).map((s) => s.file);
      expect(hits, `"${label}" still lives in: ${hits.join(", ")}`).toEqual([]);
    });
  }

  it("never offers more than the 18 payments the site sells", () => {
    for (const s of surfaces) {
      const m = s.body.match(/עד\s*(\d{1,3})\s*תשלומים/g) ?? [];
      for (const hit of m) {
        const n = Number(hit.match(/\d{1,3}/)![0]);
        expect(n, `${s.file} offers ${n} payments`).toBeLessThanOrEqual(18);
      }
    }
  });

  it("keeps MIA FOUR's figures out of every SPYQE row", () => {
    // Different vehicle, roughly half the price. A borrowed number is the worst
    // failure mode here because it reads as authoritative.
    const MIA_FOUR = ["1,800W", "1800W", "60V", "25/35Ah", "6.3", "21700", "136 ק\"ג", "42 ק\"ג"];
    for (const s of surfaces) {
      for (const line of s.body.split("\n")) {
        if (!/spyqe/i.test(line)) continue;
        for (const fig of MIA_FOUR) {
          expect(line, `${s.file}: MIA FOUR figure "${fig}" on a SPYQE line`).not.toContain(fig);
        }
      }
    }
  });
});

describe("no rollback restores a falsehood", () => {
  // A rollback exists to undo a change, but it must not reinstate something that
  // has since become untrue. The 20260831 rollback used to restore the closed
  // store's street address.
  it("no .rollback.sql writes the closed store or its address", () => {
    for (const m of migrations.filter((x) => x.file.endsWith(".rollback.sql"))) {
      expect(m.body, `${m.file} restores the flagship address`).not.toMatch(/אליעזר\s*קפלן/);
      expect(m.body, `${m.file} restores the flagship store`).not.toMatch(/חנות\s*(ה)?דגל/);
    }
  });
});

describe("the offline corpus answers the campaign, not last season's site", () => {
  // `fetchCorpus()` serves FALLBACK whenever Supabase is unreachable, answers
  // non-2xx, or returns zero rows. That path is invisible in every normal run —
  // which is precisely why it drifted: the live table carried SPYQE, the supply
  // commitment and the instalment cap, and the offline copy carried none of the
  // three. A visitor hitting the fallback would have got a confident answer built
  // on the previous campaign. Absence is the failure mode here, so absence is what
  // is asserted.
  const byId = new Map(FALLBACK.map((d) => [d.id, d.text]));
  const need = (id: string) => {
    const t = byId.get(id);
    expect(t, `the offline corpus has no "${id}" row`).toBeTruthy();
    return t!;
  };

  it("carries every campaign row", () => {
    for (const id of ["finance-terms", "delivery-four", "spyqe-offer", "spyqe-delivery", "spyqe-unpublished"]) {
      need(id);
    }
  });

  it("states the offer exactly as lib/spyqe.ts derives it", () => {
    // Derived, never typed. Changing a term in one place and not the other is the
    // only way these can disagree — so this is the assertion that makes the single
    // source of truth real rather than aspirational.
    const t = need("spyqe-offer");
    for (const n of [SPYQE.deposit, SPYQE_BALANCE, SPYQE_TOTAL, SPYQE.listPrice]) {
      expect(t, `offer row is missing ${n.toLocaleString("he-IL")}`).toContain(n.toLocaleString("he-IL"));
    }
    expect(t).toContain(`${SPYQE.months} תשלומים`);
    expect(t).toContain(`${SPYQE.monthlyPayment} ש"ח`);
    expect(t).toContain(`${SPYQE.slots} הזוכים הראשונים`);
    // The saving must be a consequence of the terms, never a fourth typed figure.
    expect(SPYQE.deposit + SPYQE.monthlyPayment * SPYQE.months).toBe(SPYQE_TOTAL);
  });

  it("keeps the two delivery times apart", () => {
    // One vehicle is in stock and one is a pre-order. Collapsing them is how a
    // 33-business-day estimate becomes a 3-day promise.
    expect(need("delivery-four")).toMatch(new RegExp(`עד ${MIA_FOUR_DELIVERY_DAYS} ימי עסקים`));
    expect(need("spyqe-delivery")).toMatch(new RegExp(`עד ${SPYQE.deliveryBusinessDays} ימי עסקים`));
    expect(MIA_FOUR_DELIVERY_DAYS).not.toBe(SPYQE.deliveryBusinessDays);
  });

  it("quotes the instalment cap lib/finance.ts actually allows", () => {
    expect(need("finance-terms")).toContain(`עד ${TRACKS.private.months.max} תשלומים`);
  });

  it("still refuses the specifications SPYQE has not published", () => {
    const t = need("spyqe-unpublished");
    for (const field of ["משקל", "עומס", "זמן טעינה", "מתח סוללה", "הספק מנוע"]) {
      expect(t, `the refusal row does not name "${field}"`).toContain(field);
    }
  });
});
