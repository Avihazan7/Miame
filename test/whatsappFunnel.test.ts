// test/whatsappFunnel.test.ts — the WhatsApp funnel contract.
//
// MiaMe has no checkout. Every path a visitor can take ends in one WhatsApp chat,
// which makes three things load-bearing that nothing was guarding:
//
//  1. THE NUMBER. It lived as seven independent literals — pages, legal text,
//     JSON-LD, the commercial constants — and only the wa.me links honoured the
//     env var. A number change lands half-applied and nobody notices, because a
//     legal page printing an unanswered line looks exactly like one printing the
//     right one.
//  2. THE FORMAT. buildWhatsAppUrl neither normalised nor validated, so a value in
//     local form ("054…") produced https://wa.me/054… — a link that opens, reaches
//     nobody, and reports nothing anywhere.
//  3. THE MESSAGE. It is the only thing the rep actually reads. If the campaign is
//     not in the text, a paid lead is indistinguishable from an organic one at the
//     moment a human is deciding how to answer it.
//
// Static and pure: no network, no database, no browser.
import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  SALES_PHONE_DISPLAY,
  SALES_PHONE_E164,
  SALES_PHONE_TEL,
  WHATSAPP_NUMBER,
  buildCampaignWhatsAppUrl,
  buildWhatsAppUrl,
  isValidMsisdn,
  normalizeMsisdn,
} from "@/lib/whatsapp";
import { WA_CTA } from "@/lib/wa-cta";

const read = (rel: string) => readFileSync(rel, "utf8");

/** Every source file under the given roots (the funnel lives in .ts/.tsx only). */
function sources(dirs: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) out.push(p);
    }
  };
  for (const d of dirs) walk(d);
  return out;
}

describe("the sales number is normalised, validated and written down once", () => {
  it("collapses every human spelling of the line to the same MSISDN", () => {
    for (const raw of [
      "972547477477",
      "+972547477477",
      "+972-54-747-7477",
      "972 54 747 7477",
      "00972547477477",
      "054-747-7477",
      "054 747 7477",
      "0547477477",
      "547477477",
    ]) {
      expect(normalizeMsisdn(raw), raw).toBe("972547477477");
    }
  });

  it("rejects what cannot be dialled instead of building a link to it", () => {
    // The defect this closes: wa.me accepts any digit string, so an unnormalised
    // local number produced a link that opened a chat with nobody.
    expect(isValidMsisdn("0547477477")).toBe(false);
    expect(isValidMsisdn("")).toBe(false);
    expect(isValidMsisdn("12345")).toBe(false);
    expect(isValidMsisdn("9725474774771234")).toBe(false);
    expect(isValidMsisdn("972547477477")).toBe(true);
    // The edge that the generic E.164 rule alone lets through: nine digits that
    // happen to open with "972" normalise to themselves and pass 8-15 digits, so
    // wa.me would open a chat with a number belonging to nobody. The module-level
    // guard is stricter than isValidMsisdn for exactly this reason.
    expect(normalizeMsisdn("972123456")).toBe("972123456");
    expect(isValidMsisdn("972123456")).toBe(true);
  });

  it("fails loudly in development on a value that cannot be an MSISDN", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "call-us");
    await expect(import("@/lib/whatsapp")).rejects.toThrow(/valid international MSISDN/);
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("derives the printed number, the tel: href and the wa.me link from one value", () => {
    // Printing one number while linking to another is how a legal page ends up
    // naming a line that nobody answers.
    expect(WHATSAPP_NUMBER).toBe("972547477477");
    expect(SALES_PHONE_E164).toBe("+972547477477");
    expect(SALES_PHONE_TEL).toBe("tel:+972547477477");
    expect(SALES_PHONE_DISPLAY).toBe("054-747-7477");
    expect(buildWhatsAppUrl("היי")).toBe(`https://wa.me/972547477477?text=${encodeURIComponent("היי")}`);
  });

  it("is hardcoded in no file but the three still allowed to (shrink-only)", () => {
    // A RATCHET: this set may shrink, never grow. lib/whatsapp.ts is the source and
    // must appear; nothing else in app/, components/ or lib/ may spell the number
    // again. It started at three — lib/content.ts kept its own SALES_WHATSAPP literal
    // and app/layout.tsx printed a dashed third spelling inside the contactPoint
    // JSON-LD, the form search and answer engines read — and both now derive.
    //
    // ONE COPY SURVIVES OUTSIDE THIS SCAN, deliberately named so it is not forgotten:
    // public/llms.txt prints "+972-54-747-7477" and is a static asset with no import
    // mechanism. Closing it needs a generator, not a constant.
    const ALLOWED = ["lib/whatsapp.ts"];
    const LITERAL = /054[\s-]?747[\s-]?7477|\+?972[\s-]?54[\s-]?747[\s-]?7477|972547477477/;

    const hits = sources(["app", "components", "lib"]).filter((f) => LITERAL.test(read(f)));
    const strays = hits.filter((f) => !ALLOWED.includes(f));
    expect(strays, `the sales number is hardcoded again in: ${strays.join(", ")}`).toEqual([]);
    expect(hits).toContain("lib/whatsapp.ts");
  });
});

describe("the campaign reaches the human who answers the chat", () => {
  it("appends the campaign to the message TEXT and sends nothing off the device", () => {
    // The Utm is INJECTED rather than read. getUtm() reaches into localStorage, which
    // does not exist under vitest's node environment, so it returns {} — and a test
    // that let it do so would compare a plain URL with a plain URL and pass while
    // asserting nothing. Standing up a fake `window` would test the fake.
    const utm = { utm_source: "google", utm_medium: "cpc", utm_campaign: "launch", utm_term: "קלנועית" };
    const text = decodeURIComponent(
      new URL(buildCampaignWhatsAppUrl("היי MiaMe", utm)).searchParams.get("text") || "",
    );
    expect(text.startsWith("היי MiaMe")).toBe(true);
    expect(text).toContain("קמפיין: google / cpc / launch");
    expect(text).toContain("מילת מפתח: קלנועית");
    // And nothing but the message text moved: the URL carries one parameter.
    expect([...new URL(buildCampaignWhatsAppUrl("היי", utm)).searchParams.keys()]).toEqual(["text"]);
  });

  it("leaves the message untouched when there is no campaign", () => {
    expect(buildCampaignWhatsAppUrl("היי MiaMe")).toBe(buildWhatsAppUrl("היי MiaMe"));
  });
});

describe("one message registry, no dead entries and no competing copies", () => {
  const files = sources(["app", "components"]);
  const corpus = files.map(read).join("\n");

  it("every registry entry has a consumer", () => {
    // WA_CTA.hero and WA_CTA.models were dead while the floating button, the
    // sticky bar and the header hand-rolled their own wording — two vocabularies
    // for one funnel. An entry nobody renders is a message nobody maintains.
    for (const key of Object.keys(WA_CTA)) {
      const used = new RegExp(`cta="${key}"|waHref\\("${key}"\\)|WA_CTA\\.${key}\\b`).test(corpus);
      expect(used, `WA_CTA.${key} is never used — wire it up or delete it`).toBe(true);
    }
  });

  it("the site-wide CTAs report themselves like every other one", () => {
    for (const f of [
      "components/WaCta.tsx",
      "components/FloatingWa.tsx",
      "components/StickyCta.tsx",
      "components/Header.tsx",
      "components/AskBrain.tsx",
    ]) {
      expect(read(f), `${f} opens WhatsApp without firing an event`).toContain('track("WhatsAppClicked"');
    }
  });

  it("no WhatsApp entry point is unmeasured except the ones named here", () => {
    // File-level on purpose: a component may hold several links, and asserting
    // per-link would need a parser. The exemptions are decisions, not debt to be
    // silently carried — each says why, so removing one is a deliberate act.
    const EXEMPT: Record<string, string> = {
      "app/legal/accessibility/page.tsx":
        "statutory accessibility channel — a disability enquiry must not fire a paid-conversion event",
      "app/thank-you/page.tsx":
        "the conversion was already counted as LeadSubmitted before this page rendered; a second event double-counts the same lead",
    };
    const opensWhatsApp = /\bwaHref\(|buildWhatsAppUrl\(|buildCampaignWhatsAppUrl\(|https:\/\/wa\.me/;

    const unmeasured = files.filter(
      (f) => opensWhatsApp.test(read(f)) && !/\btrack\(/.test(read(f)) && !(f in EXEMPT),
    );
    expect(unmeasured, `WhatsApp entry point with no analytics: ${unmeasured.join(", ")}`).toEqual([]);

    for (const [f, why] of Object.entries(EXEMPT)) {
      expect(opensWhatsApp.test(read(f)), `${f} is exempt but no longer opens WhatsApp`).toBe(true);
      expect(why.length).toBeGreaterThan(20);
    }
  });
});