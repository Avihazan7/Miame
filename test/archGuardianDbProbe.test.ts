// test/archGuardianDbProbe.test.ts — arch-guardian must go red when the MiaMe DB is down.
//
// The MiaMe Supabase project has been paused since 14.09.26 at the latest, and
// arch-guardian ran against it ten times (runs 487–496, 28–30.09.26) and stayed
// green: its live checks probe pages and /api/lead, and none of those touch the
// database. The verdict below reads GET /api/embed, whose `pending` is -1
// exactly when public.knowledge could not be read. Every case is a way the check
// could look healthy while the database is not — or hand its admin token to
// something that is not MiaMe.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
// A plain .mjs module, pure and dependency-free; TypeScript reads its JSDoc.
import { classifyDbProbe, tokenMayGoTo } from "../scripts/miame-db-probe.mjs";

type Probe = Parameters<typeof classifyDbProbe>[0]["probe"];

const answered = (body: unknown, status = 200) => ({ ok: true, status, body: JSON.stringify(body) });
const ran = (probe: Probe) => classifyDbProbe({ tokenPresent: true, hostAllowed: true, probe });

describe("only a readable corpus proves the database answered", () => {
  it("fails on pending=-1 — the exact body production served while the project was paused", () => {
    // knowledge-embed.yml runs 29–30 (29–30.09.26), verbatim:
    const v = ran(answered({ ok: true, service: "brain/embed", embeddingsReady: true, hasServiceKey: true, pending: -1 }));
    expect(v.status).toBe("fail");
    expect(v.detail).toContain("Supabase");
  });

  it("fails when the count is missing, not an integer, or the body is not JSON", () => {
    for (const body of [JSON.stringify({ ok: true }), JSON.stringify({ pending: "0" }), JSON.stringify({ pending: 1.5 }), "<html>502</html>", ""]) {
      expect(ran({ ok: true, status: 200, body }).status).toBe("fail");
    }
  });

  it("fails on any non-200 — a redirect included, since the token is never sent after one", () => {
    for (const status of [308, 401, 500, 503]) {
      const v = ran(answered({ pending: 0 }, status));
      expect(v.status).toBe("fail");
      expect(v.detail).toContain(String(status));
    }
  });

  it("fails when the site does not answer at all", () => {
    expect(ran({ ok: false, status: 0, error: "AbortError" }).status).toBe("fail");
    expect(ran(null).status).toBe("fail");
  });

  it("passes on a readable count, zero or not — completeness is the daily embed gate's job", () => {
    expect(ran(answered({ pending: 0 })).status).toBe("pass");
    expect(ran(answered({ pending: 3 })).status).toBe("pass");
  });
});

describe("a check that did not run is never reported as passing", () => {
  it("warns without the token", () => {
    expect(classifyDbProbe({ tokenPresent: false, hostAllowed: true, probe: null }).status).toBe("warn");
  });

  it("warns when the configured host may not receive the token", () => {
    expect(classifyDbProbe({ tokenPresent: true, hostAllowed: false, probe: null }).status).toBe("warn");
  });
});

describe("the admin token only ever travels to MiaMe, over https", () => {
  it.each([
    ["https://www.miame.co.il", true],
    ["https://miame.co.il", true],
    ["http://www.miame.co.il", false],
    ["https://miame.co.il.example.com", false],
    ["https://evilmiame.co.il", false],
    ["https://preview.miame.co.il", false],
    ["not a url", false],
  ])("%s → %s", (base, allowed) => {
    expect(tokenMayGoTo(base)).toBe(allowed);
  });
});

describe("arch-guardian is wired to the verdict", () => {
  const guardian = readFileSync("scripts/arch-guardian.mjs", "utf8");
  const workflow = readFileSync(".github/workflows/arch-guardian.yml", "utf8");

  it("records live.miame.db as critical, from /api/embed, without following redirects", () => {
    const at = guardian.indexOf("id: 'live.miame.db'");
    expect(at).toBeGreaterThan(-1);
    const block = guardian.slice(guardian.lastIndexOf("const hostAllowed", at), at + 300);
    expect(block).toContain("/api/embed");
    expect(block).toContain("redirect: 'manual'");
    expect(block).toContain("'x-admin-token'");
    expect(block).toContain("severity: 'critical'");
    expect(block).toContain("classifyDbProbe(");
  });

  it("takes the token out of process.env before any gate spawns a child process", () => {
    const removed = guardian.indexOf("delete process.env.EMBED_ADMIN_TOKEN");
    expect(removed).toBeGreaterThan(-1);
    expect(removed).toBeLessThan(guardian.indexOf("if (DOMAINS.includes('code')) checkCode();"));
  });

  it("hands the secret to the guardian step only — not to the job, not to the autofix step", () => {
    expect(workflow.match(/secrets\.EMBED_ADMIN_TOKEN/g) ?? []).toHaveLength(1);
    expect(step(workflow, "Run Architecture Guardian")).toContain(
      "EMBED_ADMIN_TOKEN: ${{ secrets.EMBED_ADMIN_TOKEN }}"
    );
    expect(step(workflow, "Attempt autofix PR (npm audit)")).not.toContain("EMBED_ADMIN_TOKEN");
    const jobEnv = workflow.slice(workflow.indexOf("\n    env:"), workflow.indexOf("\n    steps:"));
    expect(jobEnv).toContain("MIAME_SITE");
    expect(jobEnv).not.toContain("EMBED_ADMIN_TOKEN");
  });
});

/** One step of a workflow: from its `- name:` line to the next one. */
function step(yaml: string, name: string): string {
  const start = yaml.indexOf(`- name: ${name}`);
  expect(start).toBeGreaterThan(-1);
  const next = yaml.indexOf("- name:", start + 1);
  return yaml.slice(start, next === -1 ? undefined : next);
}
