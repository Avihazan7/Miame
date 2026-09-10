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
// Every route that must answer 200. /partners and /rent-eilat are NOT here: they
// were removed by owner decision on 2026-09-02 and middleware.ts now answers 410
// for both. Leaving them in this list made the gate assert "200" against a
// deliberate 410, so `npm run live:audit` was guaranteed to exit non-zero on every
// run from that day — a gate that always fails is a gate nobody reads, which is
// how it survived a week unnoticed. They are asserted below as 410 instead, so the
// tombstones are still covered, and by the status they are actually meant to have.
const ROUTES = [
  "/", "/mia-four", "/klnoit-4-galgalim", "/klnoit-mitkapelet", "/klnoit-shetach",
  "/eligibility", "/thank-you", "/marketplace-preview",
  "/legal/terms", "/legal/privacy", "/legal/accessibility",
];

/** Paths a product decision deleted. They must answer 410 (not 404, not 200) and
 *  carry X-Robots-Tag: noindex — see the reasoning at the top of middleware.ts. */
const GONE_ROUTES = ["/partners", "/rent-eilat"];

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

// Every route this run saw as a link a phone could actually click. Static analysis
// can prove a class is `display:none`; only a real layout can prove the anchor ended
// up with a box. /partners spent its whole life failing this: its single anchor
// carried `hide-m`, which globals.css hides under 720px, so on the viewport below it
// was served, indexed, and unclickable.
const reachable = new Set();
// A route may be link-free only if it is not PROMOTED — that is the criterion, and
// "noindex" was too narrow a version of it. What stays a failure is the combination
// /partners had: submitted in the sitemap AND unclickable. Adding an entry here is a
// decision that a page is not promoted — take it out of app/sitemap.ts too, or link it.
//
// The /rent-eilat entry was removed on 2026-09-09 along with its ROUTES entry. It
// described a third state — "answers 200 on a direct URL, carries no in-site link,
// absent from the sitemap" — that stopped being true on 2026-09-02, when the page was
// deleted outright and middleware.ts began answering 410. It is now covered by
// GONE_ROUTES, which asserts the status it actually has.
const LINK_FREE = {
  "/thank-you": "noindex · the post-submit destination, reached by router.push",
  "/marketplace-preview": "noindex · internal demo surface, no live action",
};

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
      // Rendered, not merely present: a box with area, not hidden, not transparent.
      // `getClientRects()` alone would still count a `visibility:hidden` anchor.
      visibleLinks: [...document.querySelectorAll("a[href]")]
        .filter((a) => {
          if (!a.getClientRects().length) return false;
          const cs = getComputedStyle(a);
          return cs.visibility !== "hidden" && cs.opacity !== "0";
        })
        .map((a) => (a.getAttribute("href") || "").split(/[?#]/)[0])
        .filter((h) => h.startsWith("/")),
    };
  });

  links += r.links; buttons += r.buttons; images += r.images;
  for (const href of r.visibleLinks) reachable.add(href === "" ? "/" : href.replace(/(.)\/$/, "$1"));
  for (const h of r.dead) fail(`dead anchor ${h} — nothing on this page has that id`);
  if (r.unnamed) fail(`${r.unnamed} control(s) with no accessible name`);
  if (r.noAlt) fail(`${r.noAlt} image(s) with no alt attribute`);
  if (r.h1 !== 1) fail(`${r.h1} <h1> elements (must be exactly 1)`);
  if (r.overflow) fail(`horizontal overflow at ${VIEWPORT.width}px`);
  await page.close();
}
// The tombstones, by the status they are meant to have. A 410 that silently
// decays into a 200 (someone restores the page) or a 404 (someone deletes the
// middleware entry too early, restarting Google's retry clock) is exactly the kind
// of regression nothing else here would see: no page renders, so no per-page check
// above ever runs against them.
for (const route of GONE_ROUTES) {
  const res = await ctx.request.get(BASE + route, { maxRedirects: 0 });
  if (res.status() !== 410) {
    problems.push(
      `${route} :: answered ${res.status()}, must be 410 — it was removed by product ` +
        `decision (see middleware.ts). 404 restarts Google's retry clock; 200 means ` +
        `the page came back without the tombstone being removed deliberately.`,
    );
  } else if (!/noindex/i.test(res.headers()["x-robots-tag"] || "")) {
    problems.push(`${route} :: 410 without X-Robots-Tag: noindex (see middleware.ts).`);
  }
}
await browser.close();

console.log(
  `live-audit · ${ROUTES.length} routes + ${GONE_ROUTES.length} tombstones · ` +
    `${links} links · ${buttons} controls · ${images} images`,
);
if (external.length) {
  console.log(`\n${external.length} third-party asset(s) did not load — informational, not a failure:`);
  for (const e of external) console.log(`  ${e}`);
}
// Reachability is a property of the SITE, not of any one page, so it can only be
// judged once every route has been walked. A page nothing links to is invisible to
// every per-page check above: it loads perfectly, scores perfectly, and no visitor
// ever arrives.
for (const route of ROUTES) {
  if (reachable.has(route) || LINK_FREE[route]) continue;
  problems.push(
    `${route} :: no visible in-site link to it on any audited route at ${VIEWPORT.width}px — ` +
      `it is served and promoted but a phone visitor cannot click their way there. Link it ` +
      `(components/Footer.tsx renders on every content page and hides nothing), or stop ` +
      `promoting it — out of app/sitemap.ts — and add it to LINK_FREE with the reason.`,
  );
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("\n✓ clean.");
