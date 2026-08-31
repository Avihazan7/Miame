/**
 * The migration gate, locked as a test.
 *
 * `npm run migrations:check` is the CI gate; these tests assert the properties it
 * enforces so a rule cannot be quietly weakened — deleting a rule from the script
 * fails here, not six weeks later in production.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { selectPhase } from "../scripts/migrations-apply.mjs";

const DIR = "supabase/migrations";
const files = readdirSync(DIR).filter((f) => f.endsWith(".sql"));
const forward = files.filter((f) => !f.endsWith(".rollback.sql")).sort();
const manifest = JSON.parse(readFileSync("supabase/phases.json", "utf8"));

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

  it("accepts a pending phase", () => {
    const { phase, error } = selectPhase(manifest, "6-knowledge-column-reconcile");
    expect(error).toBeUndefined();
    expect(phase.status).toBe("pending");
  });

  it("leaves every foreign phase unreachable", () => {
    for (const p of manifest.phases) {
      if (p.status === "foreign") expect(selectPhase(manifest, p.id).phase).toBeUndefined();
    }
  });
});
