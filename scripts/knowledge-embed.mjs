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
 * every row's embedding is NULL the brain runs entirely on the fallback — which
 * is accurate at 30 rows and quietly stops being accurate as the corpus grows.
 * The failure mode is SILENT: answers get vaguer, nothing turns red. Measured
 * 2026-08-31 on the MiaMe project: 30 of 30 rows carry no vector.
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
if (json.pending === 0) {
  console.log("\n✓ nothing to backfill.");
  process.exit(0);
}

console.log(`\nbackfilling ${json.pending} row(s) …`);
const post = await call("POST");
if (post.status !== 200 || !post.json.ok) {
  console.error(`✗ backfill failed (${post.status}): ${post.json.error ?? "unknown"}`);
  process.exit(1);
}
console.log(`✓ embedded ${post.json.embedded ?? 0} row(s).`);
if (post.json.failed?.length) {
  console.log(`⚠ ${post.json.failed.length} row(s) did not write: ${post.json.failed.join(", ")}`);
  console.log("  Re-run — the backfill only ever reads rows whose embedding is still NULL.");
  process.exit(1);
}
