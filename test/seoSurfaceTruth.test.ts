/**
 * What the SEO surface DECLARES must be what it SERVES.
 *
 * Every defect this file guards had the same shape: a number, an answer or a
 * card that lives in one module and was copied by hand into a second surface
 * nothing read back. The extreme case is public/llms.txt — a static file, so
 * nothing type-checks it, nothing renders it, and no test bound a single one of
 * its commercial figures to the module it came from. Answer engines quote that
 * file verbatim, which makes a stale figure there worse than a stale figure on
 * a page a human would eventually notice.
 *
 * Read-only throughout: source text and pure modules. No network, no DB.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { MODELS } from "@/lib/models";
import { MIA_FOUR_DELIVERY_DAYS, SALES_WHATSAPP } from "@/lib/content";
import { TRACKS } from "@/lib/finance";
import {
  SPYQE,
  SPYQE_TOTAL,
  SPYQE_BALANCE,
  SPYQE_SPEC,
  spyqeProductJsonLd,
} from "@/lib/spyqe";
import { FROM_MODEL_BY_SLUG, SEO_PAGES, seoPageFromPrice } from "@/lib/seo-pages";
import { HOME_FAQ, HOME_FAQ_JSONLD } from "@/lib/home-faq";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

const llms = read("public/llms.txt");
const layout = read("app/layout.tsx");
const homePage = read("app/page.tsx");

/** ₪ figures, written the way the site writes them: 19,900 — never 19900. */
const ils = (n: number) => n.toLocaleString("he-IL");

/** Money-shaped tokens: 19,900 · 1,225. A bare 555 or 248 is not one of these,
 *  which is why those are asserted by name below instead. */
const THOUSANDS = /\d{1,3}(?:,\d{3})+/g;

describe("a landing page publishes its own price or no price at all", () => {
  // The Offer used to be Math.min(...MODELS.map(m => m.price)) for EVERY landing page,
  // so /klnoit-shetach — whose own copy quotes the 4×4 at 27,900 ₪ — advertised
  // 19,900 ₪ in its structured data. A page and its own rich result disagreeing about
  // the price is a merchant-data violation, not a cosmetic one.
  it("an unmapped slug yields no price rather than somebody else's", () => {
    expect(seoPageFromPrice({ ...SEO_PAGES[0], slug: "no-such-slug" })).toBeNull();
  });

  it("every slug in the map names a model that actually exists", () => {
    // THIS is the assertion that matters, and my first attempt at it was worthless:
    // seoPageFromPrice("no-such-slug") bails on the FIRST branch (the slug is not in
    // the map) and never reaches the model lookup, so a mutation restoring the
    // fail-open `?? MODELS[0]` passed it. The reachable hazard is a slug that IS
    // mapped, to an id that no longer exists — a rename in lib/models.ts — and the
    // only way to catch that is to check the map itself.
    const ids = new Set(MODELS.map((m) => m.id));
    const broken = Object.entries(FROM_MODEL_BY_SLUG).filter(([, id]) => !ids.has(id));
    expect(broken, `slug→model map names models that do not exist: ${JSON.stringify(broken)}`).toEqual([]);
  });

  it("the landing page's Offer reads the price and never types one", () => {
    // The gap my earlier assertions left, found by mutation: they all checked
    // seoPageFromPrice's RETURN VALUE, and every one of them still passed with
    // `price: 19900` hardcoded back into the component that renders the Offer. The
    // helper being right buys nothing if the consumer stops calling it. Source-level,
    // because the number that reaches Google is emitted at render time and this suite
    // runs in node with no DOM: the same technique test/commercialTruth.test.ts uses.
    const src = readFileSync("components/seo/SeoLanding.tsx", "utf8").replace(/\/\/.*$/gm, "");
    expect(src, "the Offer no longer reads seoPageFromPrice").toContain("price: seoPageFromPrice(page)");
    const typed = src.match(/price:\s*[0-9][0-9_,]*/g) || [];
    expect(typed, `a price literal is typed into the Offer: ${typed.join(", ")}`).toEqual([]);
  });

  it("every landing page that quotes a price is in the map", () => {
    // The other direction: a page whose copy names a price but whose slug is unmapped
    // publishes no Offer at all — safe, but silently invisible to a rich result.
    const unmapped = SEO_PAGES.filter((p) => seoPageFromPrice(p) === null).map((p) => p.slug);
    expect(unmapped, `landing pages publishing no Offer: ${unmapped.join(", ")}`).toEqual([]);
  });

  it("a slug mapped to a model that does not exist yields no price either", () => {
    // getModel() fails OPEN — `MODELS.find(...) ?? MODELS[0]` — so resolving through it
    // would turn a typo in the slug→model map into a silent 19,900 on that page: the
    // same defect, re-entering through the back door. seoPageFromPrice resolves against
    // MODELS directly for exactly this reason, and this is the assertion that keeps it.
    const cheapest = Math.min(...MODELS.map((m) => m.price));
    const price = seoPageFromPrice({ ...SEO_PAGES[0], slug: "no-such-slug" });
    expect(price).not.toBe(cheapest);
    expect(price).toBeNull();
  });
});

describe("the three hardcoded origins cannot drift apart", () => {
  // lib/home-faq.ts adds a THIRD copy of "https://www.miame.co.il" beside the ones in
  // app/layout.tsx and components/seo/SeoLanding.tsx, and there is no shared module to
  // hold it. That matches the repo's precedent, so it is not worth a refactor here —
  // but three copies with nothing comparing them is how an @id ends up pointing at a
  // host the page is not served from, which silently voids the rich result.
  it("layout, the home FAQ and the SEO landing all name the same site", () => {
    const origins = ["app/layout.tsx", "lib/home-faq.ts", "components/seo/SeoLanding.tsx"].map(
      (f) => [f, (readFileSync(f, "utf8").match(/https:\/\/www\.[a-z0-9.-]+\.co\.il/) || [])[0]],
    );
    const found = origins.map(([, o]) => o);
    expect(found.every(Boolean), `no origin found in: ${origins.filter(([, o]) => !o).map(([f]) => f).join(", ")}`).toBe(true);
    expect(new Set(found).size, `origins disagree: ${JSON.stringify(origins)}`).toBe(1);
  });
});

describe("public/llms.txt quotes the modules, not a memory of them", () => {
  // Nine commercial figures plus the four that frame them. Each row is the
  // DERIVATION, so editing lib/models.ts or lib/spyqe.ts and forgetting the
  // static file fails here instead of shipping two prices to answer engines.
  const bound: [label: string, expected: string][] = [
    ["entry price (lib/models.ts)", ils(Math.min(...MODELS.map((m) => m.price)))],
    ["top price (lib/models.ts)", ils(Math.max(...MODELS.map((m) => m.price)))],
    ["MIA FOUR delivery (lib/content.ts)", `${MIA_FOUR_DELIVERY_DAYS} ימי עסקים`],
    ["SPYQE deposit (lib/spyqe.ts)", `${ils(SPYQE.deposit)} ₪`],
    ["SPYQE financed balance", `${ils(SPYQE_BALANCE)} ₪`],
    ["SPYQE term", `${SPYQE.months} תשלומים`],
    ["SPYQE monthly payment", `${SPYQE.monthlyPayment} ₪`],
    ["SPYQE pre-order total", `${ils(SPYQE_TOTAL)} ₪`],
    ["SPYQE importer list price", `${ils(SPYQE.listPrice)} ₪`],
    ["SPYQE allocation", `${SPYQE.slots} הזוכים`],
    ["SPYQE delivery estimate", `${SPYQE.deliveryBusinessDays} ימי עסקים`],
  ];

  for (const [label, expected] of bound) {
    it(`states the derived ${label}`, () => {
      expect(llms, `llms.txt no longer says "${expected}"`).toContain(expected);
    });
  }

  it("counts the models the catalogue actually has", () => {
    // "שלושה מסלולים" is a claim about MODELS.length. A fourth model added to
    // the catalogue leaves this sentence quietly wrong.
    expect(MODELS.length).toBe(3);
    expect(llms).toContain("שלושה מסלולים");
  });

  it("publishes the sales line lib/content.ts holds, digit for digit", () => {
    const d = SALES_WHATSAPP;
    expect(llms).toContain(`+${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5, 8)}-${d.slice(8)}`);
  });

  it("offers no more instalments than lib/finance.ts allows", () => {
    expect(SPYQE.months).toBeLessThanOrEqual(TRACKS.private.months.max);
    for (const hit of llms.match(/עד\s*(\d{1,3})\s*תשלומים/g) ?? []) {
      expect(Number(hit.match(/\d{1,3}/)![0])).toBeLessThanOrEqual(TRACKS.private.months.max);
    }
  });

  it("carries every number the captured SPYQE spec prints, and no other money", () => {
    // Two directions, because drift runs both ways. (a) every figure in the
    // manufacturer's table must survive into the file an answer engine reads;
    // (b) every money-shaped figure IN the file must be derivable from a module
    // — an unbound one is a number nobody owns.
    const tokens = (s: string) => s.match(/\d{1,3}(?:,\d{3})+|\d+/g) ?? [];
    const inFile = new Set(tokens(llms));
    for (const row of SPYQE_SPEC) {
      for (const t of tokens(row.value)) {
        expect(inFile, `llms.txt lost "${t}" from the "${row.label}" spec row`).toContain(t);
      }
    }

    const derived = new Set<string>([
      ...MODELS.map((m) => ils(m.price)),
      ils(SPYQE.deposit),
      ils(SPYQE_BALANCE),
      ils(SPYQE_TOTAL),
      ils(SPYQE.listPrice),
      ...SPYQE_SPEC.flatMap((r) => r.value.match(THOUSANDS) ?? []),
    ]);
    const unbound = [...new Set(llms.match(THOUSANDS) ?? [])].filter((n) => !derived.has(n));
    expect(unbound, `llms.txt carries figures no module owns: ${unbound.join(", ")}`).toEqual([]);
  });
});

describe("the FAQPage ships only from the page that renders the answers", () => {
  // Google's FAQPage guidance requires the markup to mirror content visible on
  // the SAME page. Emitted from the root layout it reached all thirteen routes,
  // twelve of which render none of these six answers.
  it("the root layout no longer carries the homepage FAQ", () => {
    expect(layout, "the root layout renders on every route").not.toContain("@/lib/home-faq");
  });

  it("the homepage emits it, beside the accordion", () => {
    expect(homePage).toContain("HOME_FAQ_JSONLD");
    expect(homePage).toContain("<FaqHome />");
  });

  it("the emitted node says exactly what the accordion shows", () => {
    const doc = JSON.parse(HOME_FAQ_JSONLD) as {
      "@type": string;
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(doc["@type"]).toBe("FAQPage");
    expect(doc.mainEntity.map((q) => q.name)).toEqual(HOME_FAQ.map((f) => f.q));
    expect(doc.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(HOME_FAQ.map((f) => f.a));
  });
});

describe("every route serves its own share card", () => {
  /** Routes are discovered, not listed: a page shipped without its own card
   *  must fail this, and a hard-coded list would never see it. */
  const routeFiles = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(resolve(ROOT, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(resolve(ROOT, rel)).isDirectory()) {
        if (entry !== "api") out.push(...routeFiles(rel));
      } else if (entry === "page.tsx") {
        out.push(rel);
      }
    }
    return out;
  };
  const routes = routeFiles("app");

  it("the root layout pins the card TYPE and nothing else", () => {
    // A title or description here is inherited whole by every route that does
    // not declare its own — which is how twelve pages shipped the homepage's X
    // card. With only `card` set, Next fills twitter:title/description per route
    // from that route's openGraph (postProcessMetadata), and the homepage still
    // resolves to the same two strings via its own openGraph.
    const block = layout.match(/twitter:\s*\{[\s\S]*?\},/)?.[0] ?? "";
    expect(block).toContain('card: "summary_large_image"');
    expect(block, "a title here overrides every child route").not.toMatch(/\btitle:/);
    expect(block, "a description here overrides every child route").not.toMatch(/\bdescription:/);
  });

  it("finds the whole app-router surface", () => {
    // Baseline 13 → 12 on 2026-09-02: /partners and /rent-eilat were REMOVED by
    // owner decision (MiaMe sells MIA FOUR and nothing else) and now answer 410.
    // This number is a vacuity guard — it exists to catch a walk that stopped
    // finding files, not to pin a count — so it tracks reality rather than
    // holding a number the site no longer has.
    expect(routes.length, "12 routes measured 02.09.26").toBeGreaterThanOrEqual(12);
    expect(routes).toContain("app/page.tsx");
  });

  for (const file of routeFiles("app")) {
    if (file === "app/page.tsx") continue; // the homepage's card IS the root layout's
    it(`${file} defines the openGraph the card is built from`, () => {
      const src = read(file);
      expect(src, "no openGraph ⇒ inherits the homepage's card").toMatch(/openGraph:\s*\{/);
      expect(src).toMatch(/openGraph:\s*\{[\s\S]{0,800}?title:/);
      expect(src).toMatch(/openGraph:\s*\{[\s\S]{0,800}?description:/);
    });
  }
});

describe("a landing page's Offer quotes a price that page actually offers", () => {
  for (const page of SEO_PAGES) {
    it(`${page.slug}`, () => {
      // Every ₪ figure the page puts in front of a buyer, read out of the same
      // content model that renders it. "1,800W" is not one of these — one digit
      // before the comma — so the motor rating cannot be mistaken for a price.
      const copy = [
        page.h1,
        page.title,
        page.description,
        page.lede,
        ...(page.specs ?? []).map((s) => `${s.k} ${s.v}`),
        ...page.sections.flatMap((s) => [s.h, ...s.body]),
        ...page.faq.flatMap((f) => [f.q, f.a]),
      ].join(" ");
      const quoted = [...new Set(copy.match(/\d{2},\d{3}/g) ?? [])].map((n) =>
        Number(n.replace(/,/g, ""))
      );
      expect(quoted.length, `${page.slug} quotes no price at all`).toBeGreaterThan(0);

      const from = seoPageFromPrice(page);
      expect(from, `${page.slug} maps to no model, so its Offer has no price`).not.toBeNull();
      // The Offer price must be one the page shows, and specifically its cheapest
      // — every one of these pages sells on "החל מ-". The off-road page shipped
      // 19,900 ₪ in schema while every price on it read 27,900 ₪.
      expect(quoted, `${page.slug} never shows ${from}`).toContain(from);
      expect(from).toBe(Math.min(...quoted));
      expect(MODELS.map((m) => m.price), "not a catalogue price").toContain(from);
    });
  }
});

describe("the SPYQE Offer says which of its two prices is which", () => {
  const ld = spyqeProductJsonLd("https://www.miame.co.il");

  it("prices the pre-order and types the list price as the list price", () => {
    expect(ld.offers.price).toBe(SPYQE_TOTAL);
    // Without priceType the node is two bare numbers and a guess. The subtype is
    // what carries it: priceType does not exist on PriceSpecification.
    expect(ld.offers.priceSpecification["@type"]).toBe("UnitPriceSpecification");
    expect(ld.offers.priceSpecification.priceType).toBe("https://schema.org/ListPrice");
    expect(ld.offers.priceSpecification.price).toBe(SPYQE.listPrice);
    expect(ld.offers.price).toBeLessThan(ld.offers.priceSpecification.price);
  });
});
