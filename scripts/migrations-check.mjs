#!/usr/bin/env node
/**
 * migrations-check — the static migration gate. NO DATABASE, NO SECRETS.
 *
 * Runs on every PR. Everything here is a rule that has already cost this repo
 * something real; nothing is a style preference.
 *
 *   M-01 naming        filename prefix IS the apply order, so it must parse
 *   M-02 phase cover   every migration sits in exactly one phase, and no phase
 *                      names a file that is not on disk
 *   M-03 ledger map    every `applied` phase records the version production
 *                      actually carries — the repo prefix is NOT always it
 *   M-04 rollback      every NEW migration ships a .rollback.sql (ratchet)
 *   M-05 idempotency   create table/index without `if not exists`, or a
 *                      `create policy` with no preceding `drop policy if exists`
 *   M-06 destructive   drop table · truncate · unqualified delete/update
 *   M-07 search_path   a created function must pin it; `reset` is banned
 *
 * Exit 0 = clean. Exit 1 = at least one ERROR. Warnings never fail the gate.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";
const PHASES = "supabase/phases.json";

/**
 * M-04 ratchet baseline. These migrations predate the rollback rule and are
 * already applied (or are foreign to this data plane), so writing a rollback for
 * them now would be fiction rather than a tested undo. The list may only SHRINK:
 * adding a name here needs a reason in the PR, never a green build.
 */
const ROLLBACK_BASELINE = new Set([
  "0001_crm.sql",
  "20260629_knowledge_seed_miame.sql",
  "20260629_vehicle_media_ultra.sql",
  "20260629_vehicle_media_ultra_glb.sql",
  "20260630_consolidate_vehicle_media_policies.sql",
  "20260701_catalog_2026_rls_hardening.sql",
  "20260704_harden_match_knowledge_search_path.sql",
  "20260707_harden_touch_updated_at_search_path.sql",
  "20260709_rental_fleet_os.sql",
  "20260714_knowledge_full_seed_from_crimson_lever.sql",
  // Recovered from the ledger, already live. It replaced `WITH CHECK (true)` on
  // the three anon INSERT policies with bounded checks; reverting would reopen
  // the rls_policy_always_true advisor. Undoing a hardening is a regression, not
  // a rollback, so this one has no undo by design.
  "20260624053746_harden_anon_insert_bounded_checks.sql",
]);

/** M-01 exemption: the single pre-convention filename. Not extensible. */
const NAMING_BASELINE = new Set(["0001_crm.sql"]);

// Six statuses, because three could not carry the decisions the file already
// documented in prose: phases marked HOLD and "replay path only" in their own
// `why` were still `pending`, and `pending` is the one status the applier
// accepts. The manifest described policy it did not enforce.
const VALID_STATUSES = new Set(["applied", "pending", "hold", "superseded", "replay-only", "foreign"]);

const errors = [];
const warnings = [];
const err = (rule, file, msg) => errors.push({ rule, file, msg });
const warn = (rule, file, msg) => warnings.push({ rule, file, msg });

/** Strip `-- line` and block comments before pattern matching, so a rule never
 *  fires on prose that merely describes the thing it forbids. */
function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n");
}

/**
 * Blank the CONTENTS of single-quoted literals, keeping the quotes so statement
 * shape survives. Without this the DML rules mis-parse: a Hebrew body such as
 * '… Mayer Electric Utilities; אחריות …' carries a semicolon, the statement looks
 * like it ends there, and a perfectly WHERE-qualified UPDATE reads as unqualified.
 *
 * Dollar-quoted bodies are deliberately NOT stripped — `do $tag$ … $tag$` blocks
 * hold real statements that these rules must still see.
 */
function stripStrings(sql) {
  return sql.replace(/'(?:[^']|'')*'/g, "''");
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".sql"));
const forward = files.filter((f) => !f.endsWith(".rollback.sql")).sort();
const rollbacks = new Set(files.filter((f) => f.endsWith(".rollback.sql")));

// ── M-01 · naming ────────────────────────────────────────────────────────────
// The filename prefix IS the apply order. A name that does not parse sorts
// somewhere nobody predicted — that is exactly how _vehicle_media_glb ended up
// sorting BEFORE the file that creates the table it writes to.
const NAME_RE = /^(\d{8}|\d{14})_[a-z0-9_]+\.sql$/;
for (const f of forward) {
  if (NAMING_BASELINE.has(f)) continue;
  if (!NAME_RE.test(f)) {
    err("M-01", f, "filename must be YYYYMMDD_slug.sql or YYYYMMDDHHMMSS_slug.sql (lowercase, underscores)");
    continue;
  }
  const d = f.slice(0, 8);
  const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  if (Number.isNaN(Date.parse(iso))) err("M-01", f, `prefix "${d}" is not a real date`);
}
// Sorting must be a total order — two files that sort equal have undefined order.
for (let i = 1; i < forward.length; i++) {
  if (forward[i] === forward[i - 1]) err("M-01", forward[i], "duplicate filename");
}

// ── M-02/M-03 · phase manifest ───────────────────────────────────────────────
let phases = null;
try {
  phases = JSON.parse(readFileSync(PHASES, "utf8"));
} catch (e) {
  err("M-02", PHASES, `unreadable or invalid JSON: ${e.message}`);
}

if (phases) {
  // Six statuses, because three could not carry the decisions the file already
  // documented in prose: phases marked HOLD and "replay path only" in their own
  // `why` were still `pending`, and `pending` is the one status the applier
  // accepts. The manifest described policy it did not enforce.
  const VALID = VALID_STATUSES;
  const seen = new Map(); // file -> phase id
  for (const p of phases.phases ?? []) {
    if (!p.id || !p.title) err("M-02", PHASES, `phase missing id or title: ${JSON.stringify(p).slice(0, 80)}`);
    if (!VALID.has(p.status)) err("M-02", PHASES, `phase ${p.id}: status must be applied|pending|foreign`);
    for (const m of p.migrations ?? []) {
      if (!forward.includes(m.file)) err("M-02", PHASES, `phase ${p.id} names "${m.file}" — not on disk`);
      if (seen.has(m.file)) err("M-02", PHASES, `"${m.file}" claimed by both ${seen.get(m.file)} and ${p.id}`);
      seen.set(m.file, p.id);
      // M-03: an applied phase must record the version production really carries.
      if (p.status === "applied" && !/^\d{14}$/.test(m.ledger ?? "")) {
        err("M-03", PHASES, `phase ${p.id} is applied but "${m.file}" has no 14-digit ledger version`);
      }
      if (p.status !== "applied" && m.ledger) {
        err("M-03", PHASES, `phase ${p.id} is ${p.status} but "${m.file}" carries a ledger version`);
      }
      // A `superseded` phase must name what replaced it. Without that the status
      // is an assertion nobody can check.
      if (p.status === "superseded" && !p.supersededBy) {
        err("M-02", PHASES, `phase ${p.id} is superseded but names no supersededBy`);
      }
      if (p.supersededBy && !forward.includes(p.supersededBy)) {
        err("M-02", PHASES, `phase ${p.id} supersededBy "${p.supersededBy}" — not on disk`);
      }
    }
    // A pending or foreign phase must say WHY — a phase with no rationale is a
    // phase the next reader has to reverse-engineer under time pressure.
    if (p.status !== "applied" && !(p.why?.length)) {
      err("M-02", PHASES, `phase ${p.id} is ${p.status} and carries no "why"`);
    }
  }
  for (const f of forward) {
    if (!seen.has(f)) err("M-02", f, "not claimed by any phase in supabase/phases.json");
  }
}

// ── M-08 · the manifest matches its own schema ───────────────────────────────
// `$schema` pointed at a file that did not exist, so nothing checked the shape.
// A hand-rolled structural check rather than a JSON-Schema dependency: this gate
// must keep running with no database, no secrets and no install beyond the repo.
if (phases) {
  let schema = null;
  try {
    schema = JSON.parse(readFileSync("supabase/phases.schema.json", "utf8"));
  } catch (e) {
    err("M-08", "supabase/phases.schema.json", `unreadable: ${e.message}`);
  }
  if (schema) {
    const allowedPhaseKeys = new Set(Object.keys(schema.properties.phases.items.properties));
    const requiredPhaseKeys = schema.properties.phases.items.required;
    const declaredStatuses = new Set(schema.properties.phases.items.properties.status.enum);
    for (const p of phases.phases ?? []) {
      for (const k of Object.keys(p)) {
        if (!allowedPhaseKeys.has(k)) err("M-08", PHASES, `phase ${p.id}: unknown key "${k}"`);
      }
      for (const k of requiredPhaseKeys) {
        if (!(k in p)) err("M-08", PHASES, `phase ${p.id}: missing required key "${k}"`);
      }
      if (!declaredStatuses.has(p.status)) {
        err("M-08", PHASES, `phase ${p.id}: status "${p.status}" is not in the schema enum`);
      }
    }
    // The gate's own list and the schema's enum must not drift apart.
    for (const st of VALID_STATUSES) {
      if (!declaredStatuses.has(st)) err("M-08", "supabase/phases.schema.json", `gate accepts "${st}" but the schema does not`);
    }
    for (const st of declaredStatuses) {
      if (!VALID_STATUSES.has(st)) err("M-08", PHASES, `schema allows "${st}" but the gate does not`);
    }
  }
}

// ── per-file body rules ──────────────────────────────────────────────────────
for (const f of forward) {
  const raw = readFileSync(join(DIR, f), "utf8");
  const commentless = stripComments(raw);
  const sql = stripStrings(commentless).toLowerCase();
  // What the string-strip removed, kept only to warn about dynamic SQL below.
  const literals = (commentless.match(/'(?:[^']|'')*'/g) ?? []).join("\n").toLowerCase();

  // M-04 · rollback ratchet
  if (!ROLLBACK_BASELINE.has(f) && !rollbacks.has(`${f.slice(0, -4)}.rollback.sql`)) {
    err("M-04", f, "no matching .rollback.sql (every new migration ships its undo)");
  }

  // M-05 · idempotency
  for (const m of sql.matchAll(/create\s+table\s+(?!if\s+not\s+exists)/g)) {
    err("M-05", f, `create table without "if not exists" (offset ${m.index})`);
  }
  for (const m of sql.matchAll(/create\s+(unique\s+)?index\s+(?!if\s+not\s+exists|concurrently\s+if)/g)) {
    err("M-05", f, `create index without "if not exists" (offset ${m.index})`);
  }
  // Postgres has no `create policy if not exists`, so the convention is a
  // preceding `drop policy if exists` for the same policy name.
  for (const m of sql.matchAll(/create\s+policy\s+("[^"]+"|'[^']+'|[a-z0-9_]+)/g)) {
    const name = m[1].replace(/^["']|["']$/g, "");
    const dropped = new RegExp(`drop\\s+policy\\s+if\\s+exists\\s+["']?${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?`).test(sql);
    if (!dropped) err("M-05", f, `create policy "${name}" with no preceding "drop policy if exists"`);
  }

  // M-06 · destructive DDL/DML. `drop policy|trigger|index if exists` is the
  // idempotency convention above and is NOT destructive; dropping a table is.
  if (/drop\s+table/.test(sql)) err("M-06", f, "drop table in a forward migration");
  if (/\btruncate\b/.test(sql)) err("M-06", f, "truncate in a forward migration");
  for (const m of sql.matchAll(/\bdelete\s+from\s+[a-z0-9_."]+\s*;/g)) {
    err("M-06", f, `unqualified DELETE (no WHERE) at offset ${m.index}`);
  }
  for (const m of sql.matchAll(/\bupdate\s+[a-z0-9_."]+\s+set\b[^;]*;/g)) {
    if (!/\bwhere\b/.test(m[0])) err("M-06", f, `unqualified UPDATE (no WHERE) at offset ${m.index}`);
  }

  // M-07 · search_path. A function created without a pin resolves object names
  // by whatever path the CALLER happens to carry.
  for (const m of sql.matchAll(/create\s+(or\s+replace\s+)?function\s+([a-z0-9_."]+)/g)) {
    // Read to the end of the routine body (the terminating $tag$ or the ';').
    const tail = sql.slice(m.index, m.index + 4000);
    const head = tail.split(/\$[a-z_]*\$/)[0];
    if (!/set\s+search_path/.test(head)) {
      err("M-07", f, `function ${m[2]} created without "set search_path"`);
    }
  }
  if (/alter\s+function[^;]*reset\s+search_path/.test(sql)) {
    err("M-07", f, "alter function ... reset search_path unpins the function");
  }

  // Advisory: SQL built inside a string literal is invisible to every rule above.
  // Not hypothetical — a sibling repo unpinned two functions' search_path through
  // `execute format(...)` and no static gate saw it. Flagged, never auto-failed:
  // deciding what dynamic SQL does is a reading job, not a regex job.
  if (/create\s+(or\s+replace\s+)?function|drop\s+table|\btruncate\b/.test(literals)) {
    warn("dynamic", f, "DDL inside a string literal — M-05..M-07 cannot see it; review by hand");
  }

  // Advisory: a migration with no header comment is one nobody can review later.
  if (!raw.trimStart().startsWith("--")) warn("style", f, "no header comment");
}

// ── report ───────────────────────────────────────────────────────────────────
const label = { "M-01": "naming", "M-02": "phase-cover", "M-03": "ledger-map",
  "M-04": "rollback", "M-05": "idempotency", "M-06": "destructive", "M-07": "search_path",
  "M-08": "schema" };

console.log(`migrations-check · ${forward.length} forward · ${rollbacks.size} rollback · ${phases?.phases?.length ?? 0} phases\n`);
for (const w of warnings) console.log(`  warn  ${w.rule.padEnd(11)} ${w.file}: ${w.msg}`);
if (warnings.length) console.log();
for (const e of errors) console.log(`  ERROR ${(label[e.rule] ?? e.rule).padEnd(11)} ${e.file}: ${e.msg}`);

if (errors.length) {
  console.log(`\n✗ ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`✓ clean${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
