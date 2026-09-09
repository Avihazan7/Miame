import Script from "next/script";
import { vercelAnalyticsEnabled } from "@/lib/marketing";

/**
 * Vercel Web Analytics — the measurement that survives a visitor saying "no".
 *
 * WHY THIS EXISTS. Measured 2026-09-09: Web Analytics was not enabled on the
 * `miame` Vercel project (the API answers `404 Web Analytics not found`), and
 * `@vercel/analytics` was not a dependency. So every number the owner had came
 * from GA4, Google Ads, Meta and TikTok — all four of which sit behind
 * <ConsentBanner /> and measure nothing until a visitor accepts. On a visitor who
 * declines, and on every visitor before they answer, the site was blind: not
 * "fewer numbers", none. That is the wrong shape of gap for the one page that has
 * to prove whether a campaign works.
 *
 * ── WHY NO `@vercel/analytics` PACKAGE ───────────────────────────────────────
 * Adding it fails to install here, and the reason is not this project's fault:
 * the package declares `@sveltejs/kit` as an OPTIONAL peer, npm tries to satisfy
 * it, SvelteKit drags in `@sveltejs/vite-plugin-svelte`, that requires vite ^8,
 * and `@vercel/toolbar` already pins vite 5 — ERESOLVE, on a Next.js app that will
 * never load a single line of Svelte. Both 1.x and 2.x declare the same
 * multi-framework peer set, so downgrading does not help, and `--force` /
 * `--legacy-peer-deps` would change how the whole lockfile resolves to buy one
 * script tag.
 *
 * The script below IS what that package renders. It is the platform's own
 * endpoint, and for THIS site the package buys nothing on top of it: its main
 * job is reporting the route PATTERN (`/blog/[slug]`) instead of the raw path on
 * client navigation, and this site has twelve static routes and no dynamic
 * segment a visitor can reach. Raw paths are the right answer here.
 *
 * ── WHY THE CSP DID NOT NEED OPENING, AND WHY THAT WAS CHECKED ───────────────
 * This repo has already paid for the opposite: the TikTok pixel shipped, the
 * banner appeared, visitors consented, the code reported the pixel active — and
 * `script-src` refused it, so zero events ever left the browser. A CSP violation
 * shows only in the visitor's console: not in a log, not in CI, not in the
 * Guardian (see the note in next.config.js).
 *
 * So the endpoints were read rather than assumed. Both are SAME-ORIGIN — Vercel
 * proxies them at the edge: the script is `/_vercel/insights/script.js` and the
 * beacon POSTs to `/_vercel/insights/view`. `script-src 'self'` and
 * `connect-src 'self'` already cover both, and next.config.js is deliberately
 * unchanged. A third-party host added "just in case" would weaken the policy for
 * nothing. Guarded by test/analyticsSafety.test.ts.
 *
 * ── WHY IT IS NOT BEHIND THE CONSENT BANNER ──────────────────────────────────
 * Because gating it would defeat the only reason it is here, AND because it does
 * not need the gate: Vercel Web Analytics sets no cookie, writes nothing to
 * localStorage, and reads nothing from the device. It is aggregate-only, and the
 * visitor hash is derived server-side and rotates daily. ePrivacy's consent rule
 * bites on storing or reading information on terminal equipment, which this does
 * not do. The marketing pixels, which do, stay behind the banner exactly as they
 * are.
 *
 * That is a real distinction and not a loophole, so it is DISCLOSED rather than
 * left implicit: app/legal/privacy/page.tsx §5 names this by product and says
 * plainly that it runs without consent and why.
 *
 * ⚠ ONE STEP IS NOT IN THIS REPO. The script only exists once Web Analytics is
 * enabled on the project (Vercel → miame → Analytics → Enable). Until then this
 * tag 404s silently — which is why it is gated to production below rather than
 * shipped everywhere and left to fail in three environments at once.
 */
export default function VercelAnalytics() {
  // The flag is derived in lib/marketing.ts, beside every other measurement flag.
  // .eslintrc.json bans `process.env` under components/** and app/** outright, and
  // it is right to: the rule does not try to guess which reads are safe, so the
  // env boundary lives in one place. An earlier draft read the variable here and
  // the BUILD failed on it — correctly.
  if (!vercelAnalyticsEnabled) return null;
  return <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />;
}
