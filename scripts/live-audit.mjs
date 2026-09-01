#!/usr/bin/env node
/**
 * scripts/live-audit.mjs — drive the REAL built site in a REAL browser.
 *
 * WHY THIS EXISTS. On 2026-08-31 a full static audit and 199 passing unit tests
 * all reported the site clean. Then the production build was served locally and
 * opened in headless Chromium, and seven of thirteen pages turned out to render a
 * "דילוג לתוכן הראשי" skip-link pointing at an id that did not exist — a WCAG 2.4.1
 * failure on a site that publicly commits to ת"י 5568.
 *
 * No file was wrong on its own: the link lives in app/layout.tsx and its target in
 * twenty other files. Only the assembled page is wrong, so only an assembled page
 * can show it. That is the entire class this script covers — defects that exist
 * between files rather than inside one.
 *
 * NO NETWORK REQUIRED. It serves 127.0.0.1, which bypasses the egress proxy, so it
 * runs anywhere the repo builds — including sandboxes where the public site is not
 * reachable. Third-party hosts (the YouTube poster CDN) may fail to load in such an
 * environment; those are reported separately as `externalAssets` and are NOT
 * failures, because they say more about the runner than about the site.
 *
 *   npm run build && npm run live:audit          # defaults to port 3333
 *   PORT=4000 npm run live:audit
 *
 * Exits non-zero on: a non-200 route, a same-origin 4xx/5xx subresource, an
 * uncaught page error, a dead #anchor, an unnamed control, an image with no alt,
 * horizontal overflow on mobile, or a page without exactly one <h1>.
 */
import { chromium } from "playwright";
import { existsSync } from "node:fs";

const PORT = process.env.PORT || "3333";
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTES = [
  "/", "/mia-four", "/klnoit-4-galgalim", "/klnoit-mitkapelet", "/klnoit-shetach",
  "/eligibility", "/partners", "/rent-eilat", "/thank-you", "/marketplace-preview",
  "/legal/terms", "/legal/privacy", "/legal/accessibility",
];

// Mobile first, because that is where this site's visitors are and where its worst
// regression to date (CLS 1.15) was invisible on desktop.
const VIEWPORT = { width: 390, height: 844 };

// Prefer whatever Playwright already manages; fall back to a preinstalled binary
// (CI images and sandboxes ship one and forbid `playwright install`). CHROMIUM_PATH
// overrides both.
const CHROMIUM =
  process.env.CHROMIUM_PATH ||
  (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, deviceScaleFactor: 3 });

const problems = [];
const external = [];
let links = 0, buttons = 0, images = 0;

for (const route of ROUTES) {
  const page = await ctx.newPage();
  const fail = (msg) => problems.push(`${route} :: ${msg}`);

  page.on("response", (res) => {
    if (res.status() < 400) return;
    const url = res.url();
    (url.startsWith(BASE) ? fail : (m) => external.push(`${route} :: ${m}`))(
      `${res.status()} ${url.replace(BASE, "")}`,
    );
  });
  // A blocked or offline host never produces a response, only a failed request. Without
  // this the tool stays silent about an asset that did not load at all — the exact
  // shape of quiet failure it exists to catch.
  page.on("requestfailed", (req) => {
    const url = req.url();
    const err = req.failure()?.errorText ?? "failed";
    const msg = `${err} ${url.replace(BASE, "")}`;
    // ERR_ABORTED is the browser CANCELLING a request, not the server refusing one:
    // a navigation that supersedes an in-flight fetch, a prefetch dropped when the
    // link scrolls away, a stylesheet raced by `networkidle`. It fired once here on a
    // stylesheet that was present in the build and did not reproduce on a clean run.
    // Failing on it would make this gate cry wolf, and a gate that cries wolf is a
    // gate people learn to ignore — so it is reported, never fatal.
    const bucket = url.startsWith(BASE) && err !== "net::ERR_ABORTED" ? fail : (m) => external.push(`${route} :: ${m}`);
    bucket(msg);
  });
  page.on("pageerror", (e) => fail(`uncaught: ${String(e).slice(0, 120)}`));

  const resp = await page
    .goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 })
    .catch((e) => { fail(`navigation failed: ${e.message.slice(0, 80)}`); return null; });
  if (!resp) { await page.close(); continue; }
  if (resp.status() !== 200) fail(`route returned ${resp.status()}`);

  await page.waitForTimeout(300); // let the intro gate settle before measuring
  const r = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && h.length > 1);
    return {
      dead: [...new Set(anchors)].filter((h) => !document.querySelector(h)),
      unnamed: [...document.querySelectorAll("button,[role=button]")]
        .filter((b) => !((b.innerText || "").trim() || b.getAttribute("aria-label") || b.getAttribute("aria-labelledby")))
        .length,
      noAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
      h1: document.querySelectorAll("h1").length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      links: document.querySelectorAll("a[href]").length,
      buttons: document.querySelectorAll("button,[role=button]").length,
      images: document.querySelectorAll("img").length,
    };
  });

  links += r.links; buttons += r.buttons; images += r.images;
  for (const h of r.dead) fail(`dead anchor ${h} — nothing on this page has that id`);
  if (r.unnamed) fail(`${r.unnamed} control(s) with no accessible name`);
  if (r.noAlt) fail(`${r.noAlt} image(s) with no alt attribute`);
  if (r.h1 !== 1) fail(`${r.h1} <h1> elements (must be exactly 1)`);
  if (r.overflow) fail(`horizontal overflow at ${VIEWPORT.width}px`);
  await page.close();
}
await browser.close();

console.log(`live-audit · ${ROUTES.length} routes · ${links} links · ${buttons} controls · ${images} images`);
if (external.length) {
  console.log(`\n${external.length} third-party asset(s) did not load — informational, not a failure:`);
  for (const e of external) console.log(`  ${e}`);
}
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("\n✓ clean.");
