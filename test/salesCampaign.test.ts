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
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TRACKS, computeQuote } from "@/lib/finance";
import { MODELS } from "@/lib/models";
import * as content from "@/lib/content";

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

describe("delivery section is a map and nothing else", () => {
  const src = read("components/Service.tsx");

  it("carries the nationwide delivery heading", () => {
    expect(src).toContain("משלוח ומסירה בכל חלקי הארץ");
  });

  it("renders an inline SVG map, not a third-party iframe", () => {
    expect(src).not.toContain("<iframe");
    expect(src).toContain("<svg");
    expect(src).toContain('role="img"');
  });

  it("the illustration is labelled as an illustration, not a geographic map", () => {
    expect(src).toContain("איור להמחשה");
    expect(src).toContain("אינו מפה גאוגרפית");
  });

  it("names the importer and the warranty, and nothing else about them", () => {
    expect(src).toContain("IMPORTER_NAME");
    expect(src).toContain("אחריות יבואן רשמי");
  });
});
