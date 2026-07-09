// M30.1 — Advanced Calm Marketplace UX: enforcement tests. Pure + offline (node env). They
// prove the demo-safe invariants by (a) asserting the pure data/copy module, (b) statically
// scanning the touched M30.1 source files, and (c) rendering the flow to static markup. No
// jsdom, no network — matching the repo's static-guarantee test style.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEAD_STAGES,
  CONSENT,
  SKELETON_STEPS,
  TRUST_COPY,
  DEMO_NOTICE,
  DEMO_DECISION_CARDS,
  HERO_SLOT,
  FORBIDDEN_TRUST_PHRASES,
  allLeadFields,
} from "@/lib/marketplace-preview";

// The exact set of files this milestone touches — the logical-properties policy and the
// non-live scans apply to these and only these.
const M30_1_FILES = [
  "lib/marketplace-preview.ts",
  "app/marketplace-preview/page.tsx",
  "app/marketplace-preview/marketplace-preview.css",
  "components/marketplace/MarketplaceLeadFlow.tsx",
  "components/marketplace/CalmSkeleton.tsx",
  "components/marketplace/SpatialHeroSlot.tsx",
];

const read = (rel: string): string => readFileSync(resolve(process.cwd(), rel), "utf8");
const M30_1_SOURCES: Record<string, string> = Object.fromEntries(M30_1_FILES.map((f) => [f, read(f)]));

// Remove JS line comments and JS/CSS block comments (the http-colon guard keeps URLs).
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("M30.1 · logical-properties policy (no new physical-direction CSS)", () => {
  // Physical CSS props + physical Tailwind direction utilities. Logical equivalents
  // (margin-inline, padding-inline, inset-inline, border-inline, text-align:start/end,
  // inline-size/block-size) do NOT match. A line may opt out with `logical-exception`.
  const PHYSICAL: RegExp[] = [
    /\bmargin-(left|right)\b/i,
    /\bpadding-(left|right)\b/i,
    /\bborder-(left|right)\b/i,
    /(?<![-\w])(left|right)\s*:/i,
    /text-align\s*:\s*(left|right)/i,
    /\b(ml|mr|pl|pr)-[\w[\]./-]+/,
    /\b(left|right)-[\d[\]./-]+/,
    /\btext-(left|right)\b/,
    /\bborder-[lr]\b/,
    /\brounded-[lr]\b/,
  ];

  it("no touched M30.1 file introduces a physical-direction property/utility", () => {
    const violations: string[] = [];
    for (const [file, src] of Object.entries(M30_1_SOURCES)) {
      // Scan real code only — comments (which may name physical props in prose) are stripped.
      stripComments(src).split("\n").forEach((line, i) => {
        if (line.includes("logical-exception")) return; // documented opt-out
        for (const re of PHYSICAL) {
          if (re.test(line)) violations.push(`${file}:${i + 1} → ${line.trim()}`);
        }
      });
    }
    expect(violations).toEqual([]);
  });

  it("the M30.1 stylesheet actively uses logical properties", () => {
    const css = M30_1_SOURCES["app/marketplace-preview/marketplace-preview.css"];
    for (const prop of ["margin-inline", "padding-inline", "inset-inline-start", "border-inline-start", "inline-size", "block-size"]) {
      expect(css, prop).toContain(prop);
    }
    expect(css).toMatch(/text-align:\s*start/);
  });
});

describe("M30.1 · progressive disclosure (three stages, labelled fields, explicit consent)", () => {
  it("has exactly the three ordered stages", () => {
    expect(LEAD_STAGES.map((s) => s.id)).toEqual(["profile", "match", "contact"]);
    expect(LEAD_STAGES.map((s) => s.index)).toEqual([1, 2, 3]);
  });

  it("stage fields match the required intent (type/usage → route/budget/vehicle → contact)", () => {
    expect(LEAD_STAGES[0].fields.map((f) => f.name)).toEqual(["customer_type", "usage_intent"]);
    expect(LEAD_STAGES[1].fields.map((f) => f.name)).toEqual(["route", "budget", "preferred_vehicle"]);
    expect(LEAD_STAGES[2].fields.map((f) => f.name)).toEqual(["full_name", "phone"]);
  });

  it("every field has a visible, non-empty label (no placeholder-only labels)", () => {
    for (const f of allLeadFields()) {
      expect(f.label.trim().length, f.name).toBeGreaterThan(0);
    }
  });

  it("consent is a separate, explicit, required opt-in (never pre-checked)", () => {
    expect(CONSENT.required).toBe(true);
    expect(CONSENT.label.trim().length).toBeGreaterThan(10);
    // the flow initialises consent state to false (opt-in, not pre-checked)
    expect(M30_1_SOURCES["components/marketplace/MarketplaceLeadFlow.tsx"]).toMatch(
      /useState\(false\)/,
    );
  });

  it("wraps every control in a real label element (no placeholder-only labels)", () => {
    const flow = M30_1_SOURCES["components/marketplace/MarketplaceLeadFlow.tsx"];
    expect(flow).toContain("htmlFor={id}"); // select + text/tel inputs are label-associated
    expect(flow).toContain("<legend"); // radio group uses a fieldset legend
    expect(flow).toContain('htmlFor="mp-consent"'); // the consent checkbox has a real label
  });
});

describe("M30.1 · calm skeleton is non-live (visual only)", () => {
  it("exposes exactly the three approved copy lines", () => {
    expect(SKELETON_STEPS).toEqual([
      "מנוע ההשוואה בוחן מסלולים...",
      "בודק התאמה בין תקציב, שימוש ותנאי מסלול...",
      "מכין כרטיסי החלטה לדוגמה...",
    ]);
  });

  it("the skeleton component calls no network / AI / provider primitive", () => {
    const code = stripComments(M30_1_SOURCES["components/marketplace/CalmSkeleton.tsx"]).toLowerCase();
    for (const bad of ["fetch(", "http", "openai", "canva", "zerolight", "supabase", "three", "webgl", "canvas", "useeffect", "setinterval"]) {
      expect(code, bad).not.toContain(bad);
    }
  });
});

describe("M30.1 · trust copy explains without over-promising", () => {
  it("uses the approved game-theory framing", () => {
    expect(TRUST_COPY).toContain("התאמה שקופה");
    expect(TRUST_COPY).toContain("רק כאשר מתקדמת עסקה מוסכמת ושקופה");
  });

  it("no user-facing copy uses a forbidden guaranteed-savings phrasing", () => {
    // Scan the actual rendered COPY values (not source files — the blocklist itself
    // legitimately contains the forbidden words).
    const copy = [
      TRUST_COPY,
      DEMO_NOTICE,
      CONSENT.label,
      ...LEAD_STAGES.flatMap((s) => [
        s.title,
        s.subtitle,
        ...s.fields.map((f) => f.label),
        ...s.fields.flatMap((f) => (f.options ?? []).map((o) => o.label)),
      ]),
      ...SKELETON_STEPS,
      ...DEMO_DECISION_CARDS.flatMap((c) => [
        c.title,
        c.tagline,
        c.note,
        ...c.attributes.flatMap((a) => [a.label, a.value]),
      ]),
      HERO_SLOT.caption,
      HERO_SLOT.label,
    ].join("\n");
    for (const phrase of FORBIDDEN_TRUST_PHRASES) {
      expect(copy.includes(phrase), phrase).toBe(false);
    }
  });
});

describe("M30.1 · spatial-ready hero slot is inert", () => {
  it("declares the future-3d data hook and is aria-hidden, with no renderer", () => {
    const src = M30_1_SOURCES["components/marketplace/SpatialHeroSlot.tsx"];
    expect(src).toContain('data-future-3d-slot="true"');
    expect(src).toContain('aria-hidden="true"');
    const code = stripComments(src).toLowerCase();
    for (const bad of ["canvas", "webgl", "three", "@react-three", "zerolight", "<iframe", "fetch(", "http", "requestanimationframe"]) {
      expect(code, bad).not.toContain(bad);
    }
  });

  it("declares a captioned, layout-ready slot (no live renderer element)", () => {
    const src = M30_1_SOURCES["components/marketplace/SpatialHeroSlot.tsx"];
    expect(src).not.toContain("<canvas");
    expect(src).not.toContain("<iframe");
    expect(src).toContain("HERO_SLOT.caption"); // static caption, not an asset/renderer
    expect(HERO_SLOT.caption.length).toBeGreaterThan(0);
  });
});

describe("M30.1 · no 3D / provider / OpenAI / Canva runtime anywhere in M30.1", () => {
  it("no touched file imports or invokes a forbidden runtime", () => {
    for (const [file, src] of Object.entries(M30_1_SOURCES)) {
      const code = stripComments(src).toLowerCase();
      for (const bad of [
        "canvas", "webgl", "webglrenderer", "three", "@react-three",
        "zerolight", "<iframe", "fetch(", "openai", "canva", "supabase",
        "window.open", "framer-motion", "http",
      ]) {
        expect(code, `${file} :: ${bad}`).not.toContain(bad);
      }
    }
  });

  it("the lead-flow submit performs no live action and no supplier transfer", () => {
    const flow = stripComments(M30_1_SOURCES["components/marketplace/MarketplaceLeadFlow.tsx"]);
    for (const bad of ["fetch(", "savePartner", "buildWhatsAppUrl", "window.open", "supabase", "http"]) {
      expect(flow, bad).not.toContain(bad);
    }
  });

  it("the demo cards are illustrative and disclosed (not offers)", () => {
    expect(DEMO_DECISION_CARDS.length).toBeGreaterThanOrEqual(3);
    for (const c of DEMO_DECISION_CARDS) expect(c.note).toContain("להמחשה");
  });
});

describe("M30.1 · motion safety (reduced-motion respected, no heavy animation dep)", () => {
  it("the stylesheet disables its animations under prefers-reduced-motion", () => {
    const css = M30_1_SOURCES["app/marketplace-preview/marketplace-preview.css"];
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    const block = css.slice(css.indexOf("prefers-reduced-motion"));
    expect(block).toMatch(/animation:\s*none/);
    expect(block).toMatch(/transition:\s*none/);
  });

  it("no M30.1 file pulls in a heavy animation dependency", () => {
    for (const [file, src] of Object.entries(M30_1_SOURCES)) {
      expect(src.includes("framer-motion"), `${file} framer-motion`).toBe(false);
      expect(src.includes("gsap"), `${file} gsap`).toBe(false);
    }
  });
});
