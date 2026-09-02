/**
 * The migration gate, locked as a test.
 *
 * `npm run migrations:check` is the CI gate; these tests assert the properties it
 * enforces so a rule cannot be quietly weakened — deleting a rule from the script
 * fails here, not six weeks later in production.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  selectPhase,
  corpusAwaitingEmbedding,
  touchesCorpus,
  embedInstructions,
} from "../scripts/migrations-apply.mjs";

const DIR = "supabase/migrations";
const files = readdirSync(DIR).filter((f) => f.endsWith(".sql"));
const forward = files.filter((f) => !f.endsWith(".rollback.sql")).sort();
const manifest = JSON.parse(readFileSync("supabase/phases.json", "utf8"));
const schema = JSON.parse(readFileSync("supabase/phases.schema.json", "utf8"));
const STATUSES: string[] = schema.properties.phases.items.properties.status.enum;

describe("migrations gate", () => {
  it("passes on the current tree", () => {
    // Throws (non-zero exit) if any rule fires. The assertion IS the run.
    const out = execFileSync("node", ["scripts/migrations-check.mjs"], { encoding: "utf8" });
    expect(out).toContain("✓ clean");
  });

  it("claims every migration in exactly one phase", () => {
    const claimed = manifest.phases.flatMap((p: { migrations: { file: string }[] }) =>
      p.migrations.map((m) => m.file)
    );
    expect([...claimed].sort()).toEqual(forward);
    expect(new Set(claimed).size).toBe(claimed.length);
  });

  it("records a live ledger version for every applied phase, and none for the rest", () => {
    for (const p of manifest.phases) {
      for (const m of p.migrations) {
        if (p.status === "applied") expect(m.ledger).toMatch(/^\d{14}$/);
        else expect(m.ledger).toBeUndefined();
      }
    }
  });

  it("keeps a stated reason on every phase that has not landed", () => {
    for (const p of manifest.phases) {
      if (p.status !== "applied") expect(p.why?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("M-06 can be made to fire, and can be made not to", () => {
  // A gate rule nobody has ever seen fire is a rule nobody has checked. Both halves
  // matter here, because the second one bit: `set body = $b$… עסקה; עד 18 …$b$ where
  // id = 'finance'` read to the scanner as a statement ENDING at the Hebrew semicolon,
  // so a WHERE-qualified UPDATE was reported unqualified. The tempting "fix" is to
  // rewrite correct SQL until the gate goes quiet. The real one is to blank
  // dollar-quoted VALUES before parsing — and then prove the rule still catches the
  // thing it exists for.
  const runOn = (files: Record<string, string>) => {
    const dir = mkdtempSync(join(tmpdir(), "mgate-"));
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    try {
      return execFileSync("node", ["scripts/migrations-check.mjs"], {
        encoding: "utf8",
        env: { ...process.env, MIGRATIONS_DIR: dir },
      });
    } catch (e) {
      return String((e as { stdout?: string }).stdout ?? "");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it("catches an UPDATE with no WHERE", () => {
    const out = runOn({
      "20260101_probe.sql": "do $p$ begin update public.knowledge set body = $b$x$b$; end $p$;",
    });
    expect(out).toContain("unqualified UPDATE");
  });

  it("does not fire on a WHERE-qualified UPDATE whose Hebrew body carries a semicolon", () => {
    const out = runOn({
      "20260101_probe.sql":
        "do $p$ begin update public.knowledge\n set body = $b$מסלולי תשלום; עד 18 תשלומים$b$\n where id = 'finance'; end $p$;",
    });
    expect(out).not.toContain("unqualified UPDATE");
  });

  it("still sees a destructive statement inside a function body", () => {
    // The value-position rule must not blank `as $fn$ … $fn$`: real statements live
    // there and the rules have to keep seeing them.
    const out = runOn({
      "20260101_probe.sql":
        "create or replace function f() returns void language sql as $fn$ drop table public.knowledge; $fn$;",
    });
    expect(out).toContain("drop table");
  });
});

describe("campaign truth survives a replay", () => {
  // The seed is the REPLAY path: on a fresh database it fills the corpus before
  // anything else runs. A seed still carrying the deleted dealer network would
  // resurrect it on every rebuild, restore or preview branch — the sales campaign
  // would regress through a path nobody looks at.
  const seed = readFileSync(`${DIR}/20260714_knowledge_full_seed_from_crimson_lever.sql`, "utf8");

  it("seeds no branch network and no address", () => {
    for (const banned of ["הוד-השרון", "אשקלון", "חנות הדגל", "רשת משווקים"]) {
      expect(seed).not.toContain(banned);
    }
  });

  it("seeds the real instalment cap, not the one the site never offered", () => {
    expect(seed).toContain("עד 18 תשלומים");
    expect(seed).not.toContain("עד 26 תשלומים");
  });

  it("the June seed cannot overwrite later corpus corrections", () => {
    // 20260629 is the OLDEST seed, so it runs first on a replay — and it used to
    // end in `on conflict do update`, which meant a manual re-run against a live
    // database would stamp June's wording over every later correction. Every
    // corpus seed must be `do nothing`: on a fresh database first-write wins by
    // ORDER, and against a live one a re-run is a no-op.
    const june = readFileSync(`${DIR}/20260629_knowledge_seed_miame.sql`, "utf8").toLowerCase();
    expect(june).toContain("on conflict (id) do nothing");
    expect(june).not.toMatch(/on conflict \(id\) do update/);
  });
});

describe("replay safety", () => {
  it("guards every ALTER FUNCTION against an absent target", () => {
    // A bare ALTER FUNCTION on a function that is not there does not degrade — it
    // throws, and takes the transaction with it. Measured: seo_touch_updated_at
    // and catalog_touch_updated_at do not exist on the MiaMe data plane.
    for (const f of forward) {
      const sql = readFileSync(`${DIR}/${f}`, "utf8");
      const bare = sql
        .split("\n")
        .filter((l) => !l.trimStart().startsWith("--"))
        .filter((l) => /^\s*alter\s+function/i.test(l));
      expect(bare, `${f} has an unguarded ALTER FUNCTION`).toHaveLength(0);
    }
  });

  it("never unpins a function's search_path", () => {
    for (const f of files) {
      const sql = readFileSync(`${DIR}/${f}`, "utf8").toLowerCase();
      expect(/alter\s+function[^;]*reset\s+search_path/.test(sql), f).toBe(false);
    }
  });
});

describe("applier refusals (decided by the manifest, before any connection)", () => {
  // These four refusals are pure functions of supabase/phases.json. Deciding them
  // before connecting is what makes them testable at all — and means a phase this
  // tool will never apply never opens a session against production.
  it("refuses a foreign phase and says which database it belongs to", () => {
    const { phase, error } = selectPhase(manifest, "F1-catalog-2026-rls");
    expect(phase).toBeUndefined();
    expect(error).toContain("foreign");
    expect(error).toContain("shared leasing database");
  });

  it("refuses an already-applied phase", () => {
    const { phase, error } = selectPhase(manifest, "5-sales-campaign-alignment");
    expect(phase).toBeUndefined();
    expect(error).toContain("already applied");
  });

  it("refuses an unknown phase and a missing --phase", () => {
    expect(selectPhase(manifest, "nope").error).toContain('no phase "nope"');
    expect(selectPhase(manifest, undefined).error).toContain("--phase <id> is required");
  });

  // `pending` is the one status the applier accepts, and that is a property of the
  // applier — not of whatever the manifest happens to hold today. The tree is now at
  // ZERO pending phases (every eligible one has landed), so a test that reached into
  // the real file for the accepting branch went red the moment the work finished, and
  // a test that merely looped over the pending phases would have gone SILENT instead:
  // passing while asserting nothing. A synthetic manifest keeps both directions of the
  // decision exercised no matter what the live tree looks like.
  const synth = (status: string) => ({
    phases: [{ id: "synthetic", status, why: ["synthetic"], migrations: [] }],
  });

  it("accepts a pending phase", () => {
    const { phase, error } = selectPhase(synth("pending"), "synthetic");
    expect(error).toBeUndefined();
    expect(phase.status).toBe("pending");
  });

  it("refuses each of the five non-pending statuses by name", () => {
    // Driven from the schema enum, so a seventh status cannot be introduced and
    // quietly fall through to the accepting branch — a new status with no refusal
    // fails here on the day it is declared.
    const blocked = STATUSES.filter((x) => x !== "pending");
    expect(blocked).toHaveLength(5);
    for (const status of blocked) {
      const { phase, error } = selectPhase(synth(status), "synthetic");
      expect(phase, `status "${status}" was NOT refused`).toBeUndefined();
      expect(error, `status "${status}" refused without saying which phase`).toContain("synthetic");
    }
  });

  it("leaves every foreign phase unreachable", () => {
    for (const p of manifest.phases) {
      if (p.status === "foreign") expect(selectPhase(manifest, p.id).phase).toBeUndefined();
    }
  });
});

describe("the manifest enforces the decisions it documents", () => {
  // The whole P0. Phase 9's own `why` said HOLD and phase 10's said "replay path
  // only", but both carried status `pending` — and `pending` is the one status
  // the applier accepts. The file described policy it did not enforce.
  it("declares six statuses, not three", () => {
    expect(STATUSES).toEqual(
      expect.arrayContaining(["applied", "pending", "hold", "superseded", "replay-only", "foreign"]),
    );
  });

  it("has a real schema behind its $schema pointer", () => {
    // It used to point at a file that did not exist, so nothing checked the shape.
    expect(manifest.$schema).toBe("./phases.schema.json");
    expect(schema.properties.phases.items.required).toContain("status");
  });

  it("puts every phase on a declared status", () => {
    for (const p of manifest.phases) expect(STATUSES).toContain(p.status);
  });

  it("makes a superseded phase name what replaced it", () => {
    for (const p of manifest.phases) {
      if (p.status !== "superseded") continue;
      expect(p.supersededBy, `${p.id} is superseded but names nothing`).toBeTruthy();
      expect(existsSync(`supabase/migrations/${p.supersededBy}`)).toBe(true);
    }
  });

  it("refuses every status except pending, before any connection", () => {
    // A phase the tool must never apply has to be refused by the manifest alone.
    // Today that is EVERY phase in the file — zero remain pending — so the second
    // loop below is empty on purpose. The accepting branch is proven synthetically
    // in "accepts a pending phase"; this test guards the live tree.
    const blocked = manifest.phases.filter((p: { status: string }) => p.status !== "pending");
    expect(blocked.length).toBeGreaterThan(0);
    for (const p of blocked) {
      const { phase, error } = selectPhase(manifest, p.id);
      expect(phase, `${p.id} (${p.status}) was NOT refused`).toBeUndefined();
      expect(error).toContain(p.id);
    }
    for (const p of manifest.phases.filter((x: { status: string }) => x.status === "pending")) {
      expect(selectPhase(manifest, p.id).error, `${p.id} is pending and should pass`).toBeUndefined();
    }
  });

  it("pins the three phases whose status IS the decision", () => {
    // Flipping any of these back to `pending` makes the applier accept it, and
    // nothing else in the suite would notice — that is precisely the defect this
    // whole model exists to close. Each is a product decision, not a free
    // variable, so each is named here and has to be changed on purpose.
    const DECIDED: Record<string, string> = {
      // superseded by 20260723115108, which is already live. Applying the older
      // file would roll the policy set BACKWARDS.
      "7-media-policy-consolidation": "superseded",
      // four tables with no reader: the campaign removed the rental surface.
      "9-rental-fleet-os": "hold",
      // fills an empty database; inert or wrong against a live one.
      "10-knowledge-full-seed": "replay-only",
    };
    for (const [id, status] of Object.entries(DECIDED)) {
      const p = manifest.phases.find((x: { id: string }) => x.id === id);
      expect(p, `phase ${id} disappeared`).toBeTruthy();
      expect(p.status, `${id} must stay "${status}" — see its own why[]`).toBe(status);
      expect(selectPhase(manifest, id).phase, `${id} became appliable`).toBeUndefined();
    }
  });

  it("keeps the recovered out-of-band migration mapped and evidenced", () => {
    // It exists in git only because the ledger stores each migration's SQL.
    const p0 = manifest.phases.find((x: { id: string }) => x.id === "0-baseline-crm");
    const rec = p0.migrations.find(
      (m: { file: string }) => m.file === "20260624053746_harden_anon_insert_bounded_checks.sql",
    );
    expect(rec, "the recovered migration is not claimed by phase 0").toBeTruthy();
    expect(rec.ledger).toBe("20260624053746");
    expect(existsSync(`supabase/migrations/${rec.file}`)).toBe(true);
    expect(p0.evidence).toContain("10a6ee346bdfa5983069f93676bff1e6");
  });
});

/**
 * THE SECOND HALF OF A CORPUS PHASE — applying it is not putting it in effect.
 *
 * MEASURED 2026-09-02, twice in one afternoon. Phase 21 (the tyre size) and phase 22
 * (dimensions, charging, legal status, the patent numbers) both landed, both were
 * verified live row-by-row, both reported success — and NEITHER was reachable by a
 * buyer. Every corpus migration sets `embedding = null` on the rows it writes, on
 * purpose: a vector of the old text must not outlive the text. But the retrieval side
 * is
 *
 *     match_knowledge:      where k.embedding is not null
 *     brain/knowledge.ts:   if (hits.length >= k) return hits
 *
 * so with 34 of 41 rows embedded, four hits come back from the 34 and the seven new
 * rows cannot be returned at all. The write was right; the operation was unfinished,
 * and nothing said so. These tests hold the thing that now says so.
 */
describe("a corpus phase is not finished until its rows carry vectors", () => {
  const MIG = "supabase/migrations";

  it("detects the corpus from the SQL, not from a list somebody has to keep", () => {
    // Both real files. The detector reads what the migration DOES.
    const corpus = readFileSync(join(MIG, "20260902_zzknowledge_site_truths.sql"), "utf8");
    const notCorpus = readFileSync(join(MIG, "20260902_partners_drop_orphan_table.sql"), "utf8");
    expect(touchesCorpus(corpus)).toBe(true);
    expect(touchesCorpus(notCorpus)).toBe(false);
  });

  it("misses no corpus migration in the repo", () => {
    // Every forward migration whose name says knowledge must also be recognised by
    // reading it. A detector that agrees with the filenames on the files we have is
    // the weaker half of the claim; the stronger half is that it does not NEED them.
    const named = readdirSync(MIG).filter(
      (f) => f.endsWith(".sql") && !f.endsWith(".rollback.sql") && f.includes("knowledge"),
    );
    expect(named.length).toBeGreaterThan(5);
    for (const f of named) {
      const sql = readFileSync(join(MIG, f), "utf8");
      // A migration may create the index/RPC rather than write rows; those name the
      // table too. What must never happen is a row-writer going undetected.
      if (/insert\s+into\s+public\.knowledge|update\s+public\.knowledge/i.test(sql)) {
        expect(touchesCorpus(sql), `${f} writes corpus rows and was not detected`).toBe(true);
      }
    }
  });

  it("reports the count when the corpus is readable", async () => {
    const fake = { query: async () => ({ rows: [{ n: 7 }] }) };
    expect(await corpusAwaitingEmbedding(fake)).toBe(7);
  });

  it("reports -1, NOT 0, when the corpus cannot be read", async () => {
    // The failure mode this exists for: a query that throws returning "0 pending"
    // would print "fully embedded" and set a green exit code on no evidence at all.
    // Unknown has to be distinguishable from none.
    const broken = { query: async () => { throw new Error("permission denied"); } };
    expect(await corpusAwaitingEmbedding(broken)).toBe(-1);
  });

  it("the instruction names the mechanism, not just the chore", async () => {
    const msg = embedInstructions(7);
    expect(msg).toContain("7");
    expect(msg, "an operator who is not told WHY will not believe the warning").toContain(
      "embedding is not null",
    );
    expect(msg).toContain("match_knowledge");
    // The route needs an x-admin-token header, which a browser cannot send. The
    // workflow is the path that works with no terminal and no secret on the device.
    expect(msg, "the no-terminal path is the one most likely to be used").toContain(
      "Knowledge Embed (backfill)",
    );
  });

  it("the applier acts on it after the commit, and does not call it a rollback", () => {
    // Comments stripped: an assertion that passes on the prose explaining the code is
    // the exact defect this repo has already paid for three times.
    const src = readFileSync("scripts/migrations-apply.mjs", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
    const afterCommit = src.slice(src.indexOf('await client.query("commit")'));
    expect(afterCommit, "the corpus check does not run after a successful apply").toContain(
      "touchesCorpus",
    );
    expect(afterCommit).toContain("corpusAwaitingEmbedding");
    // Its own exit code: the transaction committed, so this must not be mistaken for
    // the rollback path (exit 1) — but it must still be non-zero, or an automated
    // caller reads an unfinished operation as a finished one.
    expect(afterCommit, "an unfinished corpus phase exits 0").toContain("process.exitCode = 3");
    expect(afterCommit).not.toContain("process.exit(3)");
  });

  it("the standing status command reports it too", () => {
    // The apply-time warning is one minute long. Drift that outlives the terminal
    // window has to be visible in the command that gets run again tomorrow.
    const src = readFileSync("scripts/migrations-apply.mjs", "utf8");
    const status = src.slice(src.indexOf("async function status("), src.indexOf("export function selectPhase"));
    expect(status, "status() never asks whether the corpus is embedded").toContain(
      "corpusAwaitingEmbedding",
    );
    expect(status).toContain("process.exitCode = 1");
  });
});
