// test/utmConsent.test.ts — attribution reaches the funnel; the device waits for an answer.
//
// MEASURED on a production build, 2026-09-10, first load, zero interaction:
//
//   goto('/?utm_source=tiktok&gclid=ABC123&fbclid=FB999')
//   → localStorage.miame_utm = {"utm_source":"tiktok","gclid":"ABC123","fbclid":"FB999",…}
//
// gclid and fbclid are Google's and Meta's click identifiers — their entire purpose is
// to tie a visitor back to an ad profile — and they were written to the visitor's
// device before any question was asked. In the current configuration NO question is
// asked at all: components/ConsentBanner.tsx renders only when a pixel id is set, none
// is, so the banner never appeared while this write happened on every ad landing.
//
// The standard is the site's own. app/legal/privacy/page.tsx argues Vercel Analytics
// needs no consent precisely because "חובת ההסכמה בדין חלה על שמירה או קריאה של מידע
// במכשיר שלכם, ופעולות אלה אינן מתבצעות כאן" — and this write is that act.
//
// So capture was split from persistence, and the two halves are BOTH load-bearing:
// dropping the write loses attribution across a reload, and dropping the memory would
// lose it on the converting visit itself. This file holds both.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

/** A window with just the surface lib/utm.ts and lib/marketing.ts touch. */
function stubWindow(search: string) {
  store.clear();
  vi.stubGlobal("window", {
    location: { search, pathname: "/" },
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
  vi.stubGlobal("document", { referrer: "" });
}

const LANDING = "?utm_source=tiktok&utm_medium=cpc&utm_campaign=launch&gclid=ABC123&fbclid=FB999";

/** Fresh module instances per test — lib/utm.ts holds the captured attribution in a
 *  module-level variable, which is exactly the state under test. */
async function load() {
  vi.resetModules();
  return {
    utm: await import("@/lib/utm"),
    marketing: await import("@/lib/marketing"),
  };
}

beforeEach(() => {
  stubWindow(LANDING);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("without consent", () => {
  it("writes nothing to the device", async () => {
    const { utm } = await load();
    utm.captureUtm();
    expect(store.get("miame_utm"), "attribution was persisted before consent").toBeUndefined();
    expect([...store.keys()]).toEqual([]);
  });

  it("still hands the funnel the campaign it arrived with", async () => {
    // The half that must NOT be lost. The lead is built and saved on the same document
    // the visitor landed on, so in-memory capture is what a converting visit reads —
    // a fix that quietly dropped attribution would trade a privacy defect for a
    // revenue-attribution one.
    const { utm } = await load();
    utm.captureUtm();
    const u = utm.getUtm();
    expect(u.utm_source).toBe("tiktok");
    expect(u.gclid).toBe("ABC123");
    expect(u.fbclid).toBe("FB999");
    expect(utm.hasUtm()).toBe(true);
    expect(utm.utmTag()).toContain("tiktok");
  });
});

describe("with consent", () => {
  it("persists what was captured, in both orders", async () => {
    // Landing precedes the answer, always — so granting has to reach back for the
    // attribution already in memory, not just arm future captures.
    const { utm, marketing } = await load();
    utm.captureUtm();
    expect(store.get("miame_utm")).toBeUndefined();

    marketing.setConsent("granted");
    utm.persistUtm();

    const persisted = JSON.parse(store.get("miame_utm") ?? "{}");
    expect(persisted.utm_source).toBe("tiktok");
    expect(persisted.gclid).toBe("ABC123");
  });

  it("a later capture writes straight through", async () => {
    const { utm, marketing } = await load();
    marketing.setConsent("granted");
    utm.captureUtm();
    expect(JSON.parse(store.get("miame_utm") ?? "{}").fbclid).toBe("FB999");
  });
});

describe("withdrawal removes what the grant stored", () => {
  it('setConsent("denied") clears the persisted attribution', async () => {
    // Otherwise "withdraw" only stops future writes and leaves the click ids sitting
    // on the device, which is not a withdrawal.
    const { utm, marketing } = await load();
    marketing.setConsent("granted");
    utm.captureUtm();
    expect(store.get("miame_utm")).toBeDefined();

    marketing.setConsent("denied");
    expect(store.get("miame_utm"), "the click ids survived a withdrawal").toBeUndefined();
  });
});
