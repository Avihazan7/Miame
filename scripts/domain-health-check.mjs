#!/usr/bin/env node
// Double-triangle domain health check.
//
// Probes every public host of the ULease / Leasing / MiaMe triangle and reports
// the first-hop status (so an apex→www 308 is visible as a redirect, not hidden)
// plus the final status after following redirects (so a broken target behind a
// healthy redirect is still caught). Exits non-zero if any host fails, which lets
// it gate a deploy or run in CI.
//
//   node scripts/domain-health-check.mjs
//   npm run health:domains

const domains = [
  'https://miame.co.il',
  'https://www.miame.co.il',
  'https://leasing.co.il',
  'https://www.leasing.co.il',
  'https://ulease.co.il',
  'https://www.ulease.co.il'
];

const TIMEOUT_MS = 20000;
const ok = (status) => status >= 200 && status < 400; // 2xx + 3xx (redirects are healthy)

async function fetchStatus(url, redirect) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect, signal: ctrl.signal });
    return { status: res.status, location: res.headers.get('location'), finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

async function check(url) {
  const started = Date.now();
  try {
    // First hop (manual): surfaces the redirect itself.
    const hop = await fetchStatus(url, 'manual');
    // Final hop (follow): confirms the chain ends at a live page, not a 502.
    let finalStatus = hop.status;
    let finalUrl = hop.location ?? url;
    if (hop.status >= 300 && hop.status < 400) {
      const followed = await fetchStatus(url, 'follow');
      finalStatus = followed.status;
      finalUrl = followed.finalUrl;
    }
    return {
      url,
      ok: ok(hop.status) && ok(finalStatus),
      status: hop.status,
      redirect: hop.location ?? '',
      final: finalStatus,
      finalUrl,
      ms: Date.now() - started
    };
  } catch (error) {
    return { url, ok: false, status: 'ERR', error: error?.message ?? String(error), ms: Date.now() - started };
  }
}

const results = await Promise.all(domains.map(check));
console.table(results);

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error('\nDomain health FAILED: ' + failed.map((r) => r.url).join(', '));
  process.exit(1);
}
console.log('\nAll domains healthy.');
