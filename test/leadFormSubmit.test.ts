// test/leadFormSubmit.test.ts — the lead capture is a real <form>, so Enter submits.
//
// FOUND BY DRIVING THE BUILT SITE, NOT BY READING IT (2026-09-10). The production
// build was served and opened in a real mobile Chromium at 390×844. Name and phone
// were filled, focus was put in the phone field, and Enter was pressed. Measured:
//
//     api requests after Enter: (none)
//     new windows/tabs after Enter: 0
//     success message rendered after Enter: false
//
// Nothing happened at all. The ancestor chain of the phone input was
// `div.lead-row > div.lead > div.sim-result > …` — there was no <form> anywhere, so
// the two inputs and two onClick buttons had no implicit submission at all.
//
// That key is not a nicety here. On a phone it is the "אישור" key on the numeric
// keyboard the visitor is already looking at, one thumb-width from the digits they
// just typed, and this site's buyer is typically 58+ and finishing the form
// one-handed. The single most valuable keystroke on the site was inert, on the one
// interaction the whole funnel exists to capture.
//
// After the fix, the same script measured: one POST /api/deal, one new tab, and a
// navigation to /thank-you. A click still fires EXACTLY ONCE (no onClick alongside
// type="submit"), the secondary button does not drag the deal path along with it,
// and an invalid phone still blocks with role="alert" and fires nothing.
//
// This gate is static so it runs in milliseconds on every push. It guards the shape
// the browser's behaviour depends on — the element, and the explicit `type` on every
// button inside it, because an untyped <button> inside a <form> silently defaults to
// submit and would turn "דברו איתי בוואטסאפ" into a second deal path.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/** This file's own prose contains `<form>` and `type="submit"`. Matching raw source
 *  would find THOSE and score a false green — the same trap test/skipLinkTarget.ts
 *  documents. Only what the component actually renders is in scope. */
const code = (src: string) =>
  src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

const src = code(readFileSync("components/Configurator.tsx", "utf8"));

/** The lead block, from its opening tag to its closing tag. Anchored on the
 *  `className="lead"` that the stylesheet (.lead in app/globals.css) targets, so
 *  renaming the class breaks this test loudly instead of silently un-guarding. */
const LEAD_BLOCK = /<(form|div)\s[^>]*className="lead"[\s\S]*?<\/\1>/;

describe("the lead capture submits on Enter", () => {
  const block = src.match(LEAD_BLOCK);

  it("the lead block is still findable, so this gate has something to guard", () => {
    expect(block).not.toBeNull();
    // The two fields the funnel cannot work without. If these move out of the block,
    // the assertions below would pass while guarding an empty shell.
    expect(block![0]).toContain('placeholder="שם מלא"');
    expect(block![0]).toContain('placeholder="טלפון"');
  });

  it("is a <form>, not a <div>", () => {
    expect(block![1]).toBe("form");
  });

  it("declares an onSubmit handler", () => {
    // Without this the form does a native GET navigation on Enter, which would wipe
    // the built quote and be worse than doing nothing.
    expect(block![0]).toMatch(/onSubmit=\{/);
  });

  it("every button inside it declares an explicit type", () => {
    const buttons = block![0].match(/<button[\s\S]*?>/g) ?? [];
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    const untyped = buttons.filter((b) => !/\stype="(submit|button|reset)"/.test(b));
    expect(untyped).toEqual([]);
  });

  it("has exactly one submit button, and it is the first one", () => {
    // Enter triggers the FIRST submit button in DOM order. Two of them, or a
    // secondary one placed first, silently changes which path Enter takes.
    const buttons = block![0].match(/<button[\s\S]*?>/g) ?? [];
    const submits = buttons.filter((b) => /\stype="submit"/.test(b));
    expect(submits).toHaveLength(1);
    expect(buttons[0]).toBe(submits[0]);
  });

  it("the submit button carries no onClick of its own", () => {
    // type="submit" AND onClick both fire on a click, which would run the deal path
    // twice: two /api/deal posts, two WhatsApp tabs, two conversion events.
    const buttons = block![0].match(/<button[\s\S]*?>/g) ?? [];
    expect(buttons[0]).not.toMatch(/onClick=/);
  });
});
