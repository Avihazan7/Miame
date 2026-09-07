#!/usr/bin/env node
/**
 * migrations-apply — the ONE approved path from git to the MiaMe database.
 *
 *   npm run migrations:status                  what has landed, what has not
 *   npm run migrations:plan -- --phase <id>    read-only plan for one phase
 *   npm run migrations:apply -- --phase <id> --yes
 *
 * DOCTRINE, and why each rule is here rather than in a README:
 *
 *  · ONE PHASE PER RUN. A run that lands three phases and fails on the fourth
 *    leaves a state nobody planned for. `--phase` is mandatory for an apply.
 *  · DRY-RUN IS THE DEFAULT. Writing needs `--yes`, typed on purpose.
 *  · A PHASE IS ATOMIC. Every file in the phase runs inside ONE transaction with
 *    its ledger row. Half a phase is worse than none.
 *  · `foreign` PHASES ARE REFUSED. They target the shared leasing database and
 *    abort here — see supabase/phases.json.
 *  · AN `applied` PHASE IS REFUSED. Re-running a landed phase is how a live plan
 *    and an approved plan diverge.
 *  · THE LEDGER IS supabase_migrations.schema_migrations — the same table the
 *    Supabase CLI writes, so this tool and the CLI never disagree about state.
 *
 * Connection: DATABASE_URL (the pooler/session string from the Supabase
 * dashboard). Nothing is read from NEXT_PUBLIC_* — those are anon-key values and
 * cannot run DDL. No secret is ever printed; the host is shown, never the auth.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const DIR = "supabase/migrations";
const manifest = JSON.parse(readFileSync("supabase/phases.json", "utf8"));

// `selectPhase` is exported for the test suite; the CLI below runs only when
// this file is the entry point, so importing it never opens a connection.
const IS_CLI = process.argv[1] && process.argv[1].endsWith("migrations-apply.mjs");
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const value = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const MODE = flag("apply") ? "apply" : flag("plan") ? "plan" : "status";
const PHASE_ID = value("phase");
const CONFIRMED = flag("yes");

/** Redact everything but the host — the connection string carries a password. */
function safeTarget(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || 5432}/${u.pathname.replace(/^\//, "") || "postgres"}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set.\n" +
        "  Supabase dashboard → Project Settings → Database → Connection string → URI.\n" +
        "  Never use NEXT_PUBLIC_SUPABASE_* here — those are anon values and cannot run DDL."
    );
    process.exit(2);
  }
  const client = new pg.Client({
    connectionString: url,
    // Supabase terminates TLS with a public CA. `require` keeps the channel
    // encrypted; certificate verification is left to the platform default and is
    // never disabled here (a `rejectUnauthorized:false` would make the encryption
    // decorative).
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : { require: true },
  });
  await client.connect();
  return client;
}

/** Read the live ledger. Returns a Map<version, name>. */
async function readLedger(client) {
  const { rows } = await client.query(
    `select version, name from supabase_migrations.schema_migrations order by version`
  );
  return new Map(rows.map((r) => [r.version, r.name]));
}

/**
 * Rows the VECTOR path cannot see, or -1 if the corpus is unreadable from here.
 *
 * WHY THIS BELONGS IN THE MIGRATION TOOL. Applying a corpus phase is not the end of
 * the operation, and on 2026-09-02 that gap bit twice in one afternoon. Every corpus
 * migration sets `embedding = null` on the rows it writes — deliberately, because a
 * vector of the old text must not outlive the text. But `match_knowledge` is
 * `where k.embedding is not null`, and brain/knowledge.ts returns from the vector
 * path the moment it fills k:
 *
 *     const hits = await vectorRetrieve(query, k);
 *     if (hits.length >= k) return hits;      // the keyword path never runs
 *
 * So with 34 of 41 rows embedded, four hits come back from the 34 and the seven
 * freshly-written rows are UNREACHABLE. Phases 21 and 22 both landed, both were
 * verified live, both reported success — and neither was in effect for a buyer. The
 * apply is not wrong; it is INCOMPLETE, and nothing said so.
 */
export async function corpusAwaitingEmbedding(client) {
  try {
    const { rows } = await client.query(
      `select count(*)::int as n from public.knowledge where embedding is null`
    );
    return rows[0].n;
  } catch {
    // No table, or no permission to read it. Report that rather than claim zero:
    // "0 pending" from a failed query is the silent green this whole tool avoids.
    return -1;
  }
}

/** Does this phase write to the corpus? Read from the SQL, not from a list to keep. */
export const touchesCorpus = (sql) => /public\.knowledge/i.test(sql);

/** The one instruction that closes the gap, printed wherever the gap is detected. */
export function embedInstructions(pending) {
  return [
    `⚠ ${pending} corpus row(s) carry no embedding — the phase is APPLIED but NOT IN EFFECT.`,
    `  public.match_knowledge filters \`embedding is not null\`, and brain/knowledge.ts`,
    `  returns from the vector path as soon as it fills k. A row without a vector cannot`,
    `  be retrieved at all while the rest of the corpus has one.`,
    ``,
    `  Run the backfill — no terminal needed, and the secret never leaves the runner:`,
    `    GitHub → Actions → "Knowledge Embed (backfill)" → Run workflow → mode: embed`,
    `  or, with EMBED_ADMIN_TOKEN in the shell:`,
    `    npm run knowledge:embed -- --yes`,
  ].join("\n");
}

/** Repo filename → the 14-digit version this tool writes for a NEW apply. */
function versionFor(file) {
  const m = file.match(/^(\d{14}|\d{8})/);
  if (!m) throw new Error(`cannot derive a version from "${file}"`);
  return m[1].length === 14 ? m[1] : `${m[1]}000000`;
}
const nameFor = (file) => file.replace(/^\d+_/, "").replace(/\.sql$/, "");

const phaseById = (id) => manifest.phases.find((p) => p.id === id);

// ── status ───────────────────────────────────────────────────────────────────
async function status(client) {
  const ledger = await readLedger(client);
  console.log(`target   ${safeTarget(process.env.DATABASE_URL)}`);
  console.log(`project  ${manifest.project.ref} (${manifest.project.role})`);
  console.log(`ledger   ${ledger.size} row(s)\n`);

  const drift = [];
  for (const p of manifest.phases) {
    const mark = { applied: "✓", pending: "·", foreign: "⊘" }[p.status];
    console.log(`${mark} ${p.status.padEnd(7)} ${p.id}`);
    console.log(`             ${p.title}`);
    for (const m of p.migrations) {
      const live = p.status === "applied" ? ledger.has(m.ledger) : ledger.has(versionFor(m.file));
      const note =
        p.status === "applied"
          ? live
            ? `ledger ${m.ledger}`
            : `⚠ MANIFEST SAYS APPLIED — ledger has no ${m.ledger}`
          : live
            ? `⚠ LEDGER HAS ${versionFor(m.file)} — manifest says ${p.status}`
            : "not in ledger";
      if (note.startsWith("⚠")) drift.push(`${p.id} · ${m.file}: ${note.slice(2)}`);
      console.log(`             ${m.file}  [${note}]`);
    }
    console.log();
  }

  // A ledger row no repo file explains is the out-of-band class of problem: DDL
  // that landed without a reviewable artifact, and that a restore point erases.
  const claimed = new Set();
  for (const p of manifest.phases)
    for (const m of p.migrations) claimed.add(p.status === "applied" ? m.ledger : versionFor(m.file));
  const orphans = [...ledger].filter(([v]) => !claimed.has(v));
  if (orphans.length) {
    console.log("⚠ ledger rows with no migration in this repo (out-of-band):");
    for (const [v, n] of orphans) console.log(`    ${v}  ${n}`);
    console.log("  Recover the SQL into git before it is lost to a restore point.\n");
    // An orphan is the WORST of the two findings this function reports — DDL that
    // landed with no reviewable artifact, which a restore point then erases without
    // anyone noticing — and it was the one that exited 0. Any scheduled check built
    // on this command therefore reported green on exactly the drift it exists to
    // catch. It fails now, like manifest/ledger drift does.
    process.exitCode = 1;
  }
  if (drift.length) {
    console.log("⚠ manifest/ledger drift:");
    for (const d of drift) console.log(`    ${d}`);
    process.exitCode = 1;
  }

  // The corpus half of "is the database where the repo says it is". A landed phase
  // whose rows have no vector is a phase that is live in the TABLE and dead in the
  // ANSWER, and until this check existed the only way to notice was to go looking.
  // It belongs in the standing status command for the same reason ledger drift does.
  const pending = await corpusAwaitingEmbedding(client);
  if (pending > 0) {
    console.log(embedInstructions(pending));
    console.log();
    process.exitCode = 1;
  } else if (pending === 0) {
    console.log("✓ corpus fully embedded — the vector path can see every row.\n");
  } else {
    console.log("· corpus not readable from this connection — embedding state unknown.\n");
  }
}

// ── plan / apply ─────────────────────────────────────────────────────────────
/**
 * Every refusal that the manifest alone can decide. Deliberately runs BEFORE the
 * database connection: a phase this tool will never apply should be rejected
 * without opening a session against production, and a pure decision is one that
 * can be tested without a database.
 *
 * Returns the phase, or an { error } to print. Never exits — the caller decides.
 */
export function selectPhase(manifestArg, phaseId) {
  if (!phaseId) return { error: "--phase <id> is required. `npm run migrations:status` lists them." };
  const phase = manifestArg.phases.find((p) => p.id === phaseId);
  if (!phase) return { error: `no phase "${phaseId}" in supabase/phases.json.` };
  // `pending` is the ONLY status that may be applied. Everything else is refused
  // by name, so a phase whose prose says HOLD cannot be applied merely because
  // its status was never updated to match — which is exactly what used to happen.
  const REFUSALS = {
    applied:
      `is already applied. Re-running a landed phase is how the live plan and the\n` +
      `approved plan diverge.`,
    foreign:
      `is marked foreign — it targets the shared leasing database, not the MiaMe\n` +
      `data plane.`,
    hold:
      `is on HOLD — the schema is real but no product decision has authorised it,\n` +
      `so applying it would create structure with no reader.`,
    superseded:
      `is superseded: a later migration already does this, and applying the older\n` +
      `file would roll the database BACKWARDS.`,
    "replay-only":
      `is replay-only — it exists to rebuild an empty database and is inert or\n` +
      `wrong against a live one.`,
  };
  if (phase.status !== "pending") {
    const why = (phase.why ?? []).join("\n  ");
    const by = phase.supersededBy ? `\n  superseded by: ${phase.supersededBy}` : "";
    return {
      error:
        `phase "${phaseId}" ${REFUSALS[phase.status] ?? `has status "${phase.status}", which is not applicable.`}\n` +
        `Refusing.${by}${why ? `\n  ${why}` : ""}`,
    };
  }
  return { phase };
}

async function run(client, phase, write) {
  const ledger = await readLedger(client);
  const steps = [];
  for (const m of phase.migrations) {
    const version = versionFor(m.file);
    if (ledger.has(version)) {
      console.error(
        `"${m.file}" is already in the ledger as ${version}, but supabase/phases.json says\n` +
          `the phase is ${phase.status}. Reconcile the manifest before applying. Refusing.`
      );
      process.exit(2);
    }
    steps.push({ ...m, version, name: nameFor(m.file), sql: readFileSync(join(DIR, m.file), "utf8") });
  }

  console.log(`phase    ${phase.id} — ${phase.title}`);
  console.log(`target   ${safeTarget(process.env.DATABASE_URL)}`);
  console.log(`risk     ${phase.risk ?? "(not stated)"}`);
  console.log(`mode     ${write ? "APPLY (writes)" : "PLAN (read-only)"}\n`);
  for (const s of steps) {
    console.log(`  ${s.file}`);
    console.log(`    version ${s.version} · name ${s.name} · ${s.sql.split("\n").length} lines`);
  }
  console.log();

  if (!write) {
    console.log("Read-only plan. To apply:");
    console.log(`  npm run migrations:apply -- --phase ${phase.id} --yes`);
    return;
  }
  if (!CONFIRMED) {
    console.error("--yes is required to write. Nothing was applied.");
    process.exit(2);
  }

  // One transaction for the whole phase, ledger rows included. A phase either
  // lands completely or not at all.
  await client.query("begin");
  try {
    for (const s of steps) {
      process.stdout.write(`  applying ${s.file} … `);
      await client.query(s.sql);
      await client.query(
        `insert into supabase_migrations.schema_migrations (version, name) values ($1, $2)`,
        [s.version, s.name]
      );
      console.log("ok");
    }
    await client.query("commit");
    console.log(`\n✓ phase ${phase.id} applied (${steps.length} migration(s)).`);
    console.log(`  Now set its status to "applied" in supabase/phases.json and record`);
    console.log(`  ledger: ${steps.map((s) => `"${s.version}"`).join(", ")} — a landed phase left`);
    console.log(`  pending makes the next run's plan disagree with the database.`);

    // THE SECOND HALF OF A CORPUS PHASE. The write committed; that is not the same as
    // the phase being in effect. Checked here rather than left to the operator because
    // "remember to run the backfill" is exactly the kind of step that gets remembered
    // right up until the afternoon it does not.
    if (steps.some((s) => touchesCorpus(s.sql))) {
      const pending = await corpusAwaitingEmbedding(client);
      if (pending > 0) {
        console.log(`\n${embedInstructions(pending)}`);
        // NOT a failure of the apply — the transaction committed and the ledger rows
        // are in. Its own code so no wrapper can read this as a rollback, and non-zero
        // so nothing downstream can read the OPERATION as finished.
        process.exitCode = 3;
      } else if (pending === 0) {
        console.log(`\n✓ corpus fully embedded — the vector path can see every row.`);
      } else {
        console.log(`\n· corpus not readable from this connection — embedding state unknown.`);
      }
    }
  } catch (e) {
    await client.query("rollback");
    console.error(`\n✗ FAILED — rolled back, nothing was applied.\n  ${e.message}`);
    process.exit(1);
  }
}

if (IS_CLI) {
// Entry point. `--plan`/`--apply` resolve the phase from the manifest FIRST, so a
// foreign or already-applied phase is refused without touching the database.
let selected = null;
if (MODE !== "status") {
  const { phase, error } = selectPhase(manifest, PHASE_ID);
  if (error) {
    console.error(error);
    process.exit(2);
  }
  selected = phase;
}

const client = await connect();
try {
  if (MODE === "status") await status(client);
  else await run(client, selected, MODE === "apply");
} finally {
  await client.end();
}
}
