// test/threeDContract.test.ts — the 3D stage is BUILT; the only thing between it
// and a visitor is one environment variable, and this file keeps that variable
// findable and its documentation honest.
//
// TWO DEFECTS THIS CLOSES, both measured on 2026-09-02:
//   1. lib/content.ts has read NEXT_PUBLIC_MIA_GLB_URL since launch and
//      .env.example never named it. That is the VOYAGE_API_KEY lesson exactly —
//      a variable the code reads and the contract omits is a variable the
//      operator cannot know to set — and here it meant a finished 3D viewer sat
//      dark with no way to discover the switch.
//   2. public/models/README.md said the committed placeholder GLB "is served by
//      default". lib/content.ts says the opposite in a comment ten lines long.
//      Documentation that contradicts the code sends the next person to wire up
//      a fallback that was removed on purpose.
//
// WHAT THIS FILE DOES NOT DO: assert that a model is configured. An unset
// variable is the correct production state until a genuine GLB exists.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const ENV_VAR = "NEXT_PUBLIC_MIA_GLB_URL";

describe("the 3D switch is documented where an operator will look", () => {
  it("the code still reads the variable this file is about", () => {
    // Guards the guard: if the resolution moves, everything below is asserting
    // about a variable nothing consumes.
    expect(read("lib/content.ts"), "lib/content.ts no longer reads the 3D source").toContain(ENV_VAR);
  });

  it("the env contract names it", () => {
    expect(read(".env.example"), `${ENV_VAR} is read by the code and absent from .env.example`).toContain(
      ENV_VAR,
    );
  });

  it("the contract says what UNSET does, because unset is the shipping default", () => {
    const env = read(".env.example");
    const block = env.slice(env.indexOf("Ultra Vehicle Vision"));
    // "hidden" is the whole point: an operator who reads only the variable name
    // reasonably assumes a missing value degrades to the committed placeholder.
    expect(block.toLowerCase(), "the contract does not say the tab is hidden when unset").toMatch(
      /hidden|hides/,
    );
  });
});

describe("the model README does not contradict the code", () => {
  const readme = read("public/models/README.md");

  it("no longer claims the committed placeholder is served by default", () => {
    expect(
      readme,
      "README.md claims the site serves the committed GLB — lib/content.ts explicitly does not fall back to it",
    ).not.toMatch(/serves the committed .*by default/);
  });

  it("says the placeholder is a placeholder", () => {
    expect(readme.toLowerCase()).toContain("placeholder");
  });

  it("names the CSP constraint on where a real model may be hosted", () => {
    // A GLB on a third-party CDN is blocked by connect-src and fails SILENTLY —
    // no error the operator can see, just a tab that never appears.
    expect(readme).toContain("connect-src");
  });
});
