#!/usr/bin/env node
/**
 * knowledge-embed — the operational driver for the RAG embedding backfill.
 *
 *   npm run knowledge:status              is the corpus embedded, and can it be?
 *   npm run knowledge:embed -- --yes      run the backfill
 *
 * WHY THIS IS A DRIVER AND NOT AN ENGINE. The embedding logic already lives in
 * one place — brain/embeddings.ts behind POST /api/embed, admin-gated, with the
 * service-role write. A script that re-implemented Voyage calls and pgvector
 * literals would be a SECOND embedding engine with its own drift. This one only
 * drives the route that exists, so there is nothing to keep in step.
 *
 * WHY IT MATTERS. Retrieval is vector-first with a Hebrew keyword fallback. While
 * a row's embedding is NULL the brain answers it from the fallback — accurate on a
 * small corpus and quietly less accurate as it grows. The failure mode is SILENT:
 * answers get vaguer, nothing turns red.
 *
 * MEASURED 2026-09-10 on the MiaMe project: 41 rows, 41 with a vector, 0 without —
 * after the backfill below was run. Before it: 4 without.
 *
 * THE FOUR, AND WHY THEY ARE THE SHAPE OF THE PROBLEM. They were `contact`,
 * `subsidy-bereaved`, `subsidy-disabled` and `spyqe-spec-missing` — exactly the rows
 * rewritten by the last three phases to land (23-knowledge-one-cta ·
 * 24-subsidy-no-figures · 25-spyqe-warranty-unpublished). Each phase rewrote a body
 * and dropped that row's vector in the same statement, which is RIGHT: a vector built
 * from wording the site no longer renders is worse than no vector at all. And then
 * nobody ran the backfill. Two of the four were the Ministry of Defence subsidy rows,
 * so the most sensitive content on the site sat invisible to the vector path.
 *
 * A PHASE THAT REWRITES A BODY IS HALF AN OPERATION. The other half is this script.
 * Since 2026-09-10 the workflow that drives it (.github/workflows/knowledge-embed.yml)
 * also runs a read-only GET daily and FAILS while any row is pending, so the second
 * half can no longer be forgotten silently. The run itself is still manual, because
 * it spends money and writes with the service role.
 *
 *   (This header has now been wrong twice. It once read "30 of 30 rows carry no
 *    vector" (2026-08-31) and then "40 with a vector, 1 without" (2026-09-09) — the
 *    second was already off by three when it was read. A measurement carries its date
 *    for exactly this reason: re-measure before quoting it. The daily gate exists
 *    because a comment cannot.)
 *
 * ENVIRONMENT
 *   MIAME_SITE_URL      default https://www.miame.co.il
 *   EMBED_ADMIN_TOKEN   the route is fail-closed; without it the route is 503
 * Values are never printed — only whether each is present.
 */
const argv = process.argv.slice(2);
const CONFIRMED = argv.includes("--yes");
const MODE = argv.includes("--embed") ? "embed" : "status";

const BASE = (process.env.MIAME_SITE_URL || "https://www.miame.co.il").replace(/\/+$/, "");
const TOKEN = process.env.EMBED_ADMIN_TOKEN;

if (!TOKEN) {
  console.error(
    "EMBED_ADMIN_TOKEN is not set.\n" +
      "  The route is fail-closed by design: without the token it answers 503 for\n" +
      "  everyone, so there is nothing this script can do. Set it in the shell (and\n" +
      "  in Vercel, for the deployment being driven)."
  );
  process.exit(2);
}

const headers = { "x-admin-token": TOKEN };

async function call(method) {
  const res = await fetch(`${BASE}/api/embed`, { method, headers });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // A non-JSON body means the request never reached the route — a login wall, a
    // CDN error page, a deployment-protection redirect. Say which, don't guess.
    console.error(`${method} ${BASE}/api/embed → ${res.status}, non-JSON body:`);
    console.error(`  ${text.slice(0, 200).replace(/\s+/g, " ")}`);
    process.exit(1);
  }
  return { status: res.status, json };
}

console.log(`target ${BASE}/api/embed`);

const { status, json } = await call("GET");
if (status !== 200) {
  console.error(`status check failed (${status}): ${json.error ?? "unknown"}`);
  process.exit(1);
}

console.log(`  provider key (VOYAGE_API_KEY)     ${json.embeddingsReady ? "present" : "MISSING"}`);
console.log(`  write key (SUPABASE_SERVICE_ROLE) ${json.hasServiceKey ? "present" : "MISSING"}`);
console.log(
  `  rows awaiting an embedding        ${json.pending < 0 ? "unreadable" : json.pending}`
);

if (MODE === "status") {
  if (json.pending === 0) console.log("\n✓ corpus fully embedded — retrieval is vector-first.");
  else if (json.pending > 0) {
    const blocked = !json.embeddingsReady || !json.hasServiceKey;
    console.log(
      blocked
        ? "\n· backfill is BLOCKED on the missing key(s) above; retrieval stays on the keyword fallback."
        : `\n· ready to backfill:  npm run knowledge:embed -- --yes`
    );
  }
  process.exit(0);
}

if (!CONFIRMED) {
  console.error("\n--yes is required: the backfill spends provider credit and writes with the service role.");
  process.exit(2);
}
if (json.pending < 0) {
  // -1 is the route saying it could not read the corpus at all. POSTing anyway
  // would print "backfilling -1 row(s) …" and then fail on the same read, so say
  // what actually happened instead of starting a run that has no work list.
  console.error(
    "\n✗ the corpus could not be read, so there is no work list to act on.\n" +
      "  Nothing was spent. Check that the Supabase project is reachable and that\n" +
      "  public.knowledge is readable by the key this deployment carries."
  );
  process.exit(1);
}
if (json.pending === 0) {
  console.log("\n✓ nothing to backfill.");
  process.exit(0);
}

console.log(`\nbackfilling ${json.pending} row(s) …`);
const post = await call("POST");
// A PARTIAL run is a 200 whose `ok` is false: the route sets ok = (failed.length === 0),
// so ONE row that did not write turns the whole answer falsy. Testing `!post.json.ok`
// first therefore swallowed the exact case this script exists to report — it printed
// "backfill failed (200): unknown", hid how many rows DID land, and never reached the
// resumability advice below, which was unreachable code. The two are now separated:
// a route/transport failure carries an `error` and no counts, a partial run carries
// both counts and the list of ids.
const partial = Array.isArray(post.json.failed) && post.json.failed.length > 0;
if (post.status !== 200 || (!post.json.ok && !partial)) {
  console.error(`✗ backfill failed (${post.status}): ${post.json.error ?? "unknown"}`);
  process.exit(1);
}
console.log(`✓ embedded ${post.json.embedded ?? 0} of ${post.json.total ?? json.pending} row(s).`);
if (partial) {
  console.log(`⚠ ${post.json.failed.length} row(s) did not write: ${post.json.failed.join(", ")}`);
  console.log("  Re-run — the backfill only ever reads rows whose embedding is still NULL,");
  console.log("  so the rows that landed are neither embedded twice nor paid for twice.");
  process.exit(1);
}
