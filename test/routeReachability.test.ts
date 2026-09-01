// test/routeReachability.test.ts — every route a human is meant to find, findable.
//
// THE DEFECT THIS CLOSES (audit, verified 2026-09-01). /partners — the B2B partner
// form, an indexable page with its own OG image — had exactly ONE anchor pointing at
// it in the whole tree: components/Header.tsx, carrying `hide-m`, which
// app/globals.css sets to `display:none` under 720px. There is no hamburger menu and
// the footer did not carry it. So on a portrait phone — where this site's visitors
// are — the page existed, was served, was indexed, and could not be clicked. The
// homepage's own comment explains how it got there: the four-route entry grid was
// deliberately removed to sell ONE thing, and /partners lost its only mobile link
// with it. Nothing failed. No test, no build, no gate: a link that is present in the
// markup and hidden by a stylesheet is invisible to every check that reads one file.
//
// The rule this file enforces is deliberately not "every route must be linked":
//
//     A route that Next.js will let a search engine index MUST have at least one
//     in-site anchor that no stylesheet hides at any viewport. A route may be
//     link-free only if it declares `robots: { index: false }` — published to
//     nobody, so orphaned by design rather than by accident.
//
// That leaves exactly two honest ways to resolve a failure — link the page, or stop
// publishing it — and no third way to quiet the test. There is no hand-maintained
// exemption list here on purpose: a list of "known orphans" is where this defect
// would come back to live.
//
// SCOPE, HONESTLY. This reads source, so it knows about `display:none` and nothing
// else — not `visibility:hidden`, not a zero-size box, not an element scrolled out of
// reach. `npm run live:audit` drives the built site in a real mobile Chromium and
// measures what is actually painted; this test is the millisecond version that runs
// on every commit without a build. They are meant to be read together.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const CSS_FILES = [
  "app/globals.css",
  "app/miame-hero-v2.css",
  "app/miame-ultra.css",
  "styles/tokens.miame.css",
];

/** Class sets that a stylesheet hides somewhere — base rule or media query alike.
 *  Each entry is the class list of ONE selector's subject: `.nav-link.hide-m` yields
 *  ["nav-link","hide-m"], so only an element carrying BOTH is treated as hidden.
 *  Any `display:none` counts, whatever the condition — a class the site hides under
 *  some circumstance is not a class a required link may depend on. */
function hiddenClassSets(): { selector: string; classes: string[] }[] {
  const sets: { selector: string; classes: string[] }[] = [];
  for (const file of CSS_FILES) {
    const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/display\s*:\s*none/.test(rule[2])) continue;
      for (const selector of rule[1].split(",")) {
        // The SUBJECT is the last compound — in `.importer-points li::before` the
        // thing being hidden is the `li`'s pseudo-element, not `.importer-points`.
        const subject = selector.trim().split(/[\s>+~]+/).pop() ?? "";
        // A pseudo-element rule hides a generated box, never the element itself:
        // `.btn::after{display:none}` leaves every button perfectly clickable.
        if (/::|:(?:after|before|first-letter|first-line|marker|selection)\b/.test(subject)) continue;
        const classes = [...subject.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
        if (classes.length) sets.push({ selector: selector.trim(), classes });
      }
    }
  }
  return sets;
}

function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) tsxFiles(p, acc);
    else if (entry.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

/** Which modules the app actually renders. A link inside a component that nothing
 *  imports is not a link — it is dead markup that reads like a link in a grep. */
function renderedModules(): Set<string> {
  const seen = new Set<string>();
  const queue = tsxFiles("app"); // every .tsx under app/ is routed by Next
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    // Static `from "…"` and lazy `import("…")` alike — next/dynamic is used here.
    const specs = [
      ...[...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]),
      ...[...src.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
    ];
    for (const spec of specs) {
      const base = spec.startsWith("@/")
        ? spec.slice(2)
        : spec.startsWith(".")
          ? resolve(dirname(file), spec).replace(process.cwd() + "/", "")
          : null;
      if (!base) continue; // a package, not a file in this repo
      for (const candidate of [`${base}.tsx`, join(base, "index.tsx")]) {
        try {
          readFileSync(candidate, "utf8");
          queue.push(candidate);
        } catch {
          /* not this extension */
        }
      }
    }
  }
  return seen;
}

/** The one classification everything here rests on: is any element in this chain —
 *  the anchor or an ancestor — hidden by a stylesheet? An ancestor counts, because a
 *  hidden container hides the link inside it. Each rule is matched as a SET: only an
 *  element carrying every class of `.nav-link.hide-m` is hidden by that rule. */
function hiddenBy(
  chain: string[][],
  hidden: ReturnType<typeof hiddenClassSets>,
): string | null {
  const hit = hidden.find((h) => chain.some((c) => h.classes.every((x) => c.includes(x))));
  return hit ? hit.selector : null;
}

interface FoundLink {
  file: string;
  href: string;
  hiddenBy: string | null;
}

/** Every in-site link in the rendered tree, with the stylesheet rule (if any) that
 *  can hide it. An ancestor counts: a hidden container hides the link inside it. */
function inSiteLinks(hidden: ReturnType<typeof hiddenClassSets>): FoundLink[] {
  const links: FoundLink[] = [];
  const files = [...renderedModules()].filter((f) => f.endsWith(".tsx")).sort();
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const stack: string[][] = [];
    const tag =
      /<\/([A-Za-z][\w.]*)\s*>|<([A-Za-z][\w.]*)((?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^>"'])*?)(\/?)>/g;
    for (const m of src.matchAll(tag)) {
      if (m[1]) {
        if (stack.length) stack.pop();
        continue;
      }
      const [, , name, attrs = "", selfClosing] = m;
      const cn = attrs.match(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/);
      const classes = (cn ? cn[1] ?? cn[2] ?? cn[3] ?? "" : "").split(/\s+/).filter(Boolean);
      const hrefMatch = attrs.match(/href=(?:"([^"]*)"|\{"([^"]*)"\})/);
      const href = hrefMatch ? hrefMatch[1] ?? hrefMatch[2] : null;
      if ((name === "a" || name === "Link") && href && href.startsWith("/")) {
        links.push({ file, href, hiddenBy: hiddenBy([...stack, classes], hidden) });
      }
      if (!selfClosing) stack.push(classes);
    }
  }
  return links;
}

/** Routes as a visitor types them: app/(seo)/mia-four/page.tsx → /mia-four. */
function routes(): { route: string; file: string }[] {
  const out: { route: string; file: string }[] = [];
  for (const file of tsxFiles("app")) {
    if (!file.endsWith("/page.tsx")) continue;
    const route =
      "/" +
      file
        .replace(/^app\//, "")
        .replace(/\/page\.tsx$/, "")
        .split("/")
        .filter((seg) => seg !== "page.tsx" && !/^\(.*\)$/.test(seg))
        .join("/");
    out.push({ route: route === "/" ? "/" : route.replace(/\/$/, ""), file });
  }
  return out;
}

/** The root layout declares `robots: { index: true }`, so a page is indexable unless
 *  it opts out for itself. */
const isIndexable = (file: string) =>
  !/robots:\s*\{[^}]*index:\s*false/.test(readFileSync(file, "utf8"));

/**
 * THE INVARIANT IS KEYED ON THE SITEMAP, NOT ON INDEXABILITY — and that distinction is
 * the whole correctness of this file.
 *
 * The first version of this test said: indexable ⇒ must have a visible anchor, else
 * declare robots:{index:false}. That outlaws a THIRD state this site deliberately uses.
 * /rent-eilat answers 200 on a direct URL, is absent from public/sitemap.xml, and is
 * not promoted anywhere — by owner decision, commit 84e6ec5, which pulled the rental
 * fork out of the Free Feel block because it competed with the buy decision at the
 * moment the visitor is deciding whether to purchase. A page you can reach if you have
 * the link, that you are not asking Google to rank, is a legitimate thing to have; the
 * test as first written would have forced it either back onto the homepage or into
 * noindex, and both reverse that decision.
 *
 * What is NOT legitimate is submitting a URL to search engines that no visitor can
 * click. That is what /partners was: in the sitemap, canonical, its own OG image, and
 * one anchor in the whole tree — in the header, carrying `hide-m`, gone under 720px.
 */
const SITEMAP = readFileSync("public/sitemap.xml", "utf8");
const isPromoted = (route: string) =>
  new RegExp(`<loc>[^<]*${route.replace(/\//g, "\\/")}(?:/)?</loc>`).test(SITEMAP);

describe("every indexable route is reachable at every viewport", () => {
  const hidden = hiddenClassSets();
  const links = inSiteLinks(hidden);
  const all = routes();

  it("the scanners still see the site (a blind guard is worse than none)", () => {
    // Each of these has silently zeroed out at least once while being written: a CSS
    // path typo empties `hidden` and every link passes; a JSX regex slip empties
    // `links` and every route fails. Assert both ends are alive before trusting them.
    expect(all.length, "no routes found under app/").toBeGreaterThanOrEqual(13);
    expect(links.length, "no in-site links found — the JSX scan is broken").toBeGreaterThanOrEqual(20);
    expect(
      hidden.length,
      "no display:none rule found in any stylesheet — either the CSS list above is " +
        "stale, or the site genuinely hides nothing and this assertion should be " +
        "removed deliberately rather than left to pass by accident",
    ).toBeGreaterThan(0);
  });

  it("still knows a hidden class when it sees one", () => {
    // The whole test rests on this one classification. If it ever stops recognising a
    // `display:none` rule, every route passes and the guard is theatre; if it starts
    // matching everything, every route fails. Both directions, on real rules.
    for (const rule of hidden) expect(hiddenBy([rule.classes], hidden)).toBeTruthy();
    expect(hiddenBy([["a-class-no-stylesheet-in-this-repo-defines"]], hidden)).toBeNull();
    expect(hiddenBy([[]], hidden)).toBeNull();
  });

  it("nothing in the sitemap is also told not to be indexed", () => {
    // The other half of the same contract, and the reason isIndexable still exists:
    // submitting a URL to search engines while telling them not to index it is a
    // contradiction the site would be issuing about itself, and neither half of it
    // would ever show up as a failure anywhere else.
    const contradictory = all.filter(({ route, file }) => isPromoted(route) && !isIndexable(file));
    expect(
      contradictory.map((c) => c.route),
      "these routes are in public/sitemap.xml and declare robots:{index:false}",
    ).toEqual([]);
  });

  for (const { route, file } of all) {
    it(`${route} is linked, or is not published`, () => {
      const to = links.filter((l) => l.href === route || l.href.startsWith(route + "#"));
      const visible = to.filter((l) => !l.hiddenBy);
      if (visible.length) return; // reachable — nothing more to prove

      const detail = to.length
        ? `Its only link(s) are hidden by CSS: ` +
          to.map((l) => `${l.file} (hidden by \`${l.hiddenBy}\`)`).join(", ") + ". "
        : `Nothing in the rendered tree links to it at all. `;

      expect(
        isPromoted(route),
        `${route} is submitted in public/sitemap.xml but no visitor ` +
          `can click their way to it. ${detail}` +
          `Fix it one of two ways: give it an anchor no stylesheet hides — the site-wide ` +
          `footer (components/Footer.tsx) is where secondary routes belong, since the ` +
          `header's nav links carry \`hide-m\` and vanish under 720px — or, if it is ` +
          `genuinely not for the public, take it out of public/sitemap.xml — a page that ` +
          `answers on a direct URL without being promoted is a deliberate state this ` +
          `site uses (see the note on isPromoted above), and it is fine. Asking search ` +
          `engines to rank a page nobody can click is not.`,
      ).toBe(false);
    });
  }
});
