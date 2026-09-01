#!/usr/bin/env node
/**
 * scripts/a11y-audit.mjs — axe-core over the built site, in a real mobile browser.
 *
 * WHY IT EXISTS, AND WHY IT USES axe RATHER THAN ARITHMETIC. On 2026-09-01 a
 * hand-rolled contrast check on this site reported 113 failures — including the hero
 * headline as "white on white". Every one of those was wrong: the checker walked the
 * DOM for `background-color`, and the hero's ground is a gradient `background-image`,
 * so it fell back to white and inverted the answer. axe-core composites what is
 * actually painted — gradients, overlays, opacity — and found the truth: THREE
 * elements, on ONE unlisted page. The lesson is in the file: a contrast number
 * computed from styles instead of pixels is a guess wearing a decimal point.
 *
 * NO NETWORK. It drives 127.0.0.1, so it runs anywhere the repo builds — including
 * sandboxes where the public site is unreachable.
 *
 *   npm run build && npm run a11y:audit          # defaults to port 4444
 *   PORT=3000 npm run a11y:audit
 *
 * Exits non-zero on any WCAG 2.1 A/AA violation, naming the rule, the route and the
 * selector. The site's accessibility statement commits publicly to ת"י 5568 / WCAG
 * 2.1 AA, so this is a promise the code has to keep, not a preference.
 */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";

const PORT = process.env.PORT || "4444";
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTES = [
  "/", "/mia-four", "/klnoit-4-galgalim", "/klnoit-mitkapelet", "/klnoit-shetach",
  "/eligibility", "/partners", "/rent-eilat", "/thank-you", "/marketplace-preview",
  "/legal/terms", "/legal/privacy", "/legal/accessibility",
];

// Mobile first: this site's visitors are there, and its worst regression to date
// (CLS 1.15) was invisible on desktop.
const VIEWPORT = { width: 390, height: 844 };
const CHROMIUM =
  process.env.CHROMIUM_PATH ||
  (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, deviceScaleFactor: 3 });

const found = new Map();
for (const route of ROUTES) {
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(600); // let the intro gate settle before measuring
  await page.addScriptTag({ content: axe });
  const res = await page.evaluate(async () =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      resultTypes: ["violations"],
    }),
  );
  for (const v of res.violations) {
    if (!found.has(v.id)) found.set(v.id, { impact: v.impact, help: v.help, hits: [] });
    for (const n of v.nodes) {
      found.get(v.id).hits.push(
        `${route} :: ${n.target.join(" ")} :: ${(n.failureSummary || "").split("\n").filter(Boolean).slice(-1)[0]?.slice(0, 120)}`,
      );
    }
  }
  await page.close();
}
await browser.close();

console.log(`a11y-audit · axe-core WCAG 2.1 A+AA · ${ROUTES.length} routes at ${VIEWPORT.width}px`);
if (!found.size) {
  console.log("\n✓ zero violations.");
  process.exit(0);
}
const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
console.error(`\n✗ ${found.size} violation type(s):`);
for (const [id, v] of [...found].sort((a, b) => order[a[1].impact] - order[b[1].impact])) {
  console.error(`\n  [${String(v.impact).toUpperCase()}] ${id} — ${v.help}`);
  for (const h of v.hits.slice(0, 6)) console.error(`    ${h}`);
  if (v.hits.length > 6) console.error(`    …and ${v.hits.length - 6} more`);
}
process.exit(1);
