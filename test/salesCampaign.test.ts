// Sales-campaign contract — the rules the focused MiaMe campaign is built on,
// made mechanical so a future edit that quietly undoes them fails CI instead of
// shipping. All read-only: source text + pure modules, no network, no DB.
//
// Two rules are enforced here:
//   1. ONE simulator track — no customer-type tabs, no regional price zone.
//   2. NO addresses, branches, dealers, importer phone numbers or map links on
//      any public marketing surface.
//
// The legal pages are deliberately EXEMPT from rule 2: Israeli accessibility
// regulations (תקנות שוויון זכויות לאנשים עם מוגבלות) require the accessibility
// coordinator's contact details, and consumer/distance-selling rules require the
// seller's identification. Those carry MiaMe's OWN line, never the importer's.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TRACKS, computeQuote } from "@/lib/finance";
import { MODELS } from "@/lib/models";
import * as content from "@/lib/content";
import { WA_CTA, waHref } from "@/lib/wa-cta";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

/** Every public marketing source file, excluding the legal pages (see above). */
function marketingFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(ROOT, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(ROOT, rel)).isDirectory()) {
        if (rel.startsWith("app/legal")) continue;
        walk(rel);
      } else if (/\.(tsx?|txt)$/.test(entry)) {
        out.push(rel);
      }
    }
  };
  walk("components");
  walk("app");
  walk("lib");
  out.push("public/llms.txt");
  return out;
}

describe("simulator runs exactly one track", () => {
  const src = read("components/Configurator.tsx");

  it("renders no customer-type tabs", () => {
    expect(src).not.toMatch(/role="tablist"/);
    expect(src).not.toMatch(/className=\{?["']?tabs/);
    expect(src).not.toContain("selectType");
  });

  it("renders no regional price-zone toggle", () => {
    expect(src).not.toContain("zone-toggle");
    expect(src).not.toContain("pricing-zones");
    expect(src).not.toContain("isEilat");
    expect(src).not.toContain("getZonePrice");
  });

  it("keeps exactly the two controls the campaign sells: down-payment + payments", () => {
    const ranges = src.match(/type="range"/g) || [];
    expect(ranges).toHaveLength(2);
    expect(src).toContain('aria-labelledby="down-label"');
    expect(src).toContain('aria-labelledby="months-label"');
  });

  it("the surviving track is 0%–50% down over 3–18 payments", () => {
    expect(TRACKS.private.down.min).toBe(0);
    expect(TRACKS.private.down.max).toBe(50);
    expect(TRACKS.private.months.min).toBe(3);
    expect(TRACKS.private.months.max).toBe(18);
    expect(TRACKS.private.months.default).toBe(18);
    expect(TRACKS.private.discountPct).toBe(0);
  });

  it("opens at the owner's 25% anchor, not at the top of the range", () => {
    // The default is what every visitor sees before touching anything, so it is
    // a commercial decision and not a UI default. At 50% the simulator opened on
    // the largest outlay the track allows. Asserting the RESULT, not just the
    // number: on the entry model 25% must land on 4,975 ₪ down and 829 ₪ a month.
    expect(TRACKS.private.down.default).toBe(25);

    const entry = MODELS.find((m) => m.price === 19_900);
    expect(entry, "the 19,900 ₪ entry model the anchor was chosen against").toBeDefined();
    const q = computeQuote({
      basePrice: entry!.price,
      type: "private",
      downPct: TRACKS.private.down.default,
      balloonPct: 0,
      months: TRACKS.private.months.default,
    });
    expect(q.downAmount).toBe(4_975);
    expect(q.monthlyPayment).toBe(829);
  });

  it("the quote contract is unchanged — no interest, no balloon, no discount", () => {
    for (const m of MODELS) {
      const q = computeQuote({
        basePrice: m.price,
        type: "private",
        downPct: 50,
        balloonPct: 0,
        months: 18,
      });
      expect(q.balloonAmount).toBe(0);
      expect(q.effectivePrice).toBe(m.price);
      // no interest: the instalments recover exactly the financed amount
      expect(q.monthlyPayment).toBe(Math.round(q.financedAmount / 18));
      expect(q.downAmount + q.financedAmount).toBe(m.price);
    }
  });

  it("never renders the brain's Deal Score reasons into the DOM", () => {
    // Rule 5: a public surface may show a 0–100 score and a grade label, never
    // the components, weights or thresholds behind them.
    expect(src).not.toMatch(/score\.reasons/);
  });
});

describe("no addresses, branches, dealers or importer phones on marketing surfaces", () => {
  const files = marketingFiles();

  const FORBIDDEN: { label: string; re: RegExp }[] = [
    { label: "street address (אליעזר קפלן)", re: /אליעזר\s*קפלן/ },
    { label: "street address (דרך הערבה)", re: /דרך\s*הערבה/ },
    { label: "flagship store claim", re: /חנות\s*(ה)?דגל/ },
    { label: "importer phone 077-8038321", re: /077-?8038321/ },
    { label: "importer phone 077-7296656", re: /077-?7296656/ },
    { label: "Waze deep link", re: /waze\.com/ },
    { label: "authorized-dealer network claim", re: /משווקים\s*מורשים/ },
  ];

  for (const { label, re } of FORBIDDEN) {
    it(`no ${label}`, () => {
      const hits = files.filter((f) => re.test(read(f)));
      expect(hits, `${label} still present in: ${hits.join(", ")}`).toEqual([]);
    });
  }

  it("no tel: link outside the legal pages", () => {
    const hits = files.filter((f) => /href="tel:/.test(read(f)));
    expect(hits, `tel: link outside app/legal in: ${hits.join(", ")}`).toEqual([]);
  });

  it("no Google-Maps embed or link", () => {
    const hits = files.filter((f) => {
      const src = read(f);
      // the CSP rationale comment in Service.tsx names the hosts it removed
      return /maps\.google\.com|google\.com\/maps/.test(src) && !src.includes("CSP drop");
    });
    expect(hits, `maps link in: ${hits.join(", ")}`).toEqual([]);
  });

  it("the commercial source of truth exposes the importer's NAME only", () => {
    expect(content.IMPORTER_NAME).toBe("MEU · Mayer Electric Utilities");
    expect(content.WARRANTY).toContain("אחריות יבואן רשמי");
    expect(content).not.toHaveProperty("DEALERS");
    expect(content).not.toHaveProperty("SERVICE");
    // MiaMe's own funnel must survive the sweep
    expect(content.SALES_WHATSAPP).toBe("972547477477");
  });

  it("the CSP no longer allows a map frame", () => {
    const cfg = read("next.config.js");
    const frameSrc = cfg.match(/"frame-src[^"]*"/)?.[0] ?? "";
    expect(frameSrc).not.toContain("maps.google.com");
    expect(frameSrc).not.toContain("https://www.google.com");
    expect(frameSrc).toContain("youtube-nocookie");
  });

  it("publishes no LocalBusiness node (no storefront is claimed)", () => {
    const layout = read("app/layout.tsx");
    expect(layout).not.toMatch(/"@type":\s*"LocalBusiness"/);
    expect(layout).not.toMatch(/streetAddress/);
  });
});

describe("delivery section is a promise strip, not a directory or a map", () => {
  const src = read("components/Service.tsx");

  it("carries the nationwide delivery heading", () => {
    expect(src).toContain("משלוח ומסירה בכל חלקי הארץ");
  });

  it("embeds no map at all — no iframe and no coverage illustration", () => {
    expect(src).not.toContain("<iframe");
    expect(src).not.toContain("<svg");
    expect(src).not.toContain("coverage");
  });

  it("names the importer and the warranty, and nothing else about them", () => {
    expect(src).toContain("IMPORTER_NAME");
    expect(src).toContain("אחריות יבואן רשמי");
  });

  it("offers the shared WhatsApp route", () => {
    expect(src).toContain('cta="delivery"');
  });
});

describe("one WhatsApp route, offered everywhere", () => {
  it("every CTA has a distinct section-specific prefilled message", () => {
    const messages = Object.values(WA_CTA).map((c) => c.message);
    expect(new Set(messages).size).toBe(messages.length);
    for (const c of Object.values(WA_CTA)) {
      expect(c.message.length, c.label).toBeGreaterThan(20);
      expect(c.label.length, c.label).toBeGreaterThan(4);
      expect(["inquiry", "order"]).toContain(c.intent);
    }
  });

  it("every href points at MiaMe's own wa.me line", () => {
    for (const key of Object.keys(WA_CTA) as (keyof typeof WA_CTA)[]) {
      const href = waHref(key);
      expect(href.startsWith("https://wa.me/972547477477?text=")).toBe(true);
    }
  });

  it("covers both a buying intent and an inquiry intent", () => {
    const intents = new Set(Object.values(WA_CTA).map((c) => c.intent));
    expect(intents.has("order")).toBe(true);
    expect(intents.has("inquiry")).toBe(true);
  });

  it("SPYQE takes pre-registration without promising a sale", () => {
    const src = read("components/Spyqe.tsx");
    expect(src).toContain('cta="spyqe"');
    expect(src).toContain("אינה מחייבת ברכישה");
  });

  it("the eligibility page keeps an inbound link from the homepage", () => {
    // Removing the entry-path grid took the homepage's only link to
    // /eligibility with it. The Tribute deep link replaces it; without this
    // guard the page silently orphans again the next time Tribute is edited.
    expect(read("app/page.tsx")).toContain("<Tribute deepLink />");
    expect(read("components/Tribute.tsx")).toContain('href="/eligibility"');
  });

  it("robots.txt names the AI answer engines explicitly", () => {
    const robots = read("public/robots.txt");
    for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      expect(robots, `robots.txt missing ${bot}`).toContain(bot);
    }
    expect(robots).toMatch(/Sitemap:\s*https:\/\/www\.miame\.co\.il\/sitemap\.xml/);
  });

  it("the four-route entry fork is gone from the homepage", () => {
    expect(read("app/page.tsx")).not.toContain("EntryPaths");
    expect(existsSync(resolve(ROOT, "components/EntryPaths.tsx"))).toBe(false);
  });
});
