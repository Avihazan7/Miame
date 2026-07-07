// Deal Buzz content contract — the honest-urgency guarantee, enforced in CI.
//
// The whole point of lib/deal-buzz.ts is that urgency is REAL: a launch offer +
// honest availability language, never a fabricated countdown / stock counter /
// "N people watching" widget / guaranteed approval. These tests fail the build
// if a future edit sneaks fake scarcity into the buzz copy.
import { describe, expect, it } from "vitest";
import {
  LAUNCH_OFFER,
  TRUST_SIGNALS,
  DEAL_BUZZ_CARDS,
  BUZZ_DISCLAIMER,
  FORBIDDEN_BUZZ_PATTERNS,
  type BuzzItem,
} from "@/lib/deal-buzz";

// Everything a visitor can read from the buzz layer, concatenated.
const allBuzzCopy = [
  LAUNCH_OFFER.kicker,
  LAUNCH_OFFER.title,
  LAUNCH_OFFER.text,
  LAUNCH_OFFER.cta,
  BUZZ_DISCLAIMER,
  ...TRUST_SIGNALS.map((s) => s.label),
  ...DEAL_BUZZ_CARDS.flatMap((c) => [c.title, c.text, c.cta, c.waMessage ?? ""]),
].join(" ");

describe("deal buzz · no fake scarcity", () => {
  it("matches none of the forbidden fake-scarcity patterns", () => {
    for (const rx of FORBIDDEN_BUZZ_PATTERNS) {
      expect(allBuzzCopy, `forbidden pattern matched: ${rx}`).not.toMatch(rx);
    }
  });

  it("does not contain any hard-deadline or guarantee wording", () => {
    for (const banned of ["מובטח", "אישור מיידי", "רק היום בלבד", "נשארו", "נותרו", "צופים עכשיו"]) {
      expect(allBuzzCopy).not.toContain(banned);
    }
  });
});

describe("deal buzz · required launch disclaimer", () => {
  it("uses the exact mandated wording concept", () => {
    expect(BUZZ_DISCLAIMER).toContain("כפופים לעדכון ולאישור החברה/היבואן");
    expect(BUZZ_DISCLAIMER).toContain("אינו מהווה התחייבות לאישור מימון או זמינות מלאי");
  });
});

describe("deal buzz · allowed honest phrases are present", () => {
  it("keeps the launch-offer + availability language", () => {
    expect(LAUNCH_OFFER.kicker).toBe("מבצע השקה");
    expect(allBuzzCopy).toContain("מלאי מוגבל לפי זמינות");
    expect(allBuzzCopy).toContain("בדיקת התאמה מהירה");
  });
});

describe("deal buzz · every CTA has a valid action", () => {
  const isValid = (c: BuzzItem) =>
    (c.action === "sim" || c.action === "wa") && c.cta.trim().length > 0 && c.title.trim().length > 0;

  it("all cards resolve to a real action (scroll to sim or open WhatsApp)", () => {
    expect(DEAL_BUZZ_CARDS.length).toBeGreaterThanOrEqual(4);
    for (const c of DEAL_BUZZ_CARDS) {
      expect(isValid(c), `invalid buzz card: ${c.id}`).toBe(true);
      if (c.action === "wa") {
        expect(c.waMessage, `wa card ${c.id} missing message`).toBeTruthy();
      }
    }
  });

  it("card ids are unique", () => {
    const ids = DEAL_BUZZ_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("deal buzz · trust signals", () => {
  it("are non-empty, real facts with labels", () => {
    expect(TRUST_SIGNALS.length).toBeGreaterThanOrEqual(3);
    for (const s of TRUST_SIGNALS) expect(s.label.trim().length).toBeGreaterThan(0);
  });
});
