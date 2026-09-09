// components/FirstAndUnique.tsx — the statement band for the 4×4 Pro Max.
//
// The owner supplied the photograph and the headline ("להיות ראשון וייחודי זה
// מחייב") and asked for them further down the page.
//
// STRUCTURE: this is the third member of the dark-shell family that already
// exists in this tree — .cinema-shell (CinematicVideo) and .fm-shell
// (FreedomMomentVideo), both in app/miame-ultra.css. It deliberately borrows
// their geometry: the same 34px radius, the same clamp() padding, the same mint
// hairline, the same 16:9 frame at 26px. It sits immediately above
// CinematicVideo so the two read as one dark passage rather than as two
// unrelated black rectangles dropped onto a Pearl page. The dark-on-light
// transition is therefore not a new problem to solve here — the page already
// solved it twice, and copying that answer is cheaper and more coherent than
// inventing a third one.
//
// NO "use client", ON PURPOSE. The obvious version of this band tracks clicks on
// its link, which means importing `track` from lib/analytics — and the 2026-09-09
// audit measured what that costs: lib/analytics.ts statically imports the whole
// @supabase/supabase-js SDK (238KB raw / 61.5KB gz), which 13 client components
// already drag into the initial bundle of / and every SEO landing page. Adding a
// fourteenth to attribute one banner would make a confirmed HIGH finding worse.
// This section is static: no state, no effect, no hydration, zero JS.
//
// WHAT IT CLAIMS: nothing new. The kicker transcribes the badge physically on the
// stem in the photograph. The three specifications are READ from lib/models.ts
// rather than retyped, so a change there cannot leave a stale number here — the
// same single-source rule test/commercialTruth.test.ts enforces elsewhere. No
// price, no availability, no regulatory claim, no superlative.
import Image from "next/image";
import { getModel } from "@/lib/models";

const PRO_MAX = getModel("4x4");

export default function FirstAndUnique() {
  return (
    <section className="block first-sec" aria-labelledby="first-title">
      <div className="wrap">
        <div className="first-shell">
          <div className="first-copy">
            {/* The badge on the stem, transcribed. dir="ltr" because it is a
                Latin product mark inside an RTL document. */}
            <span className="first-kicker" dir="ltr">
              MIA FOUR X4
            </span>

            <h2 className="first-title" id="first-title">
              להיות ראשון וייחודי זה מחייב
            </h2>

            {/* <bdi> is load-bearing, not decoration. The model name is "4×4 Pro Max":
                "4×4" is a European-number run and "Pro Max" is a Latin run, and in an
                RTL paragraph the bidi algorithm resolves them as SEPARATE runs, so the
                name rendered to the reader as "Pro Max 4×4". Measured in Chromium at
                both 390 and 1440 before this isolate was added. */}
            <p className="first-desc">
              <bdi dir="ltr">{PRO_MAX.name}</bdi> על פלטפורמת <bdi dir="ltr">MIA Dynamics</bdi>.{" "}
              {PRO_MAX.tagline}.
            </p>
          </div>

          <div className="first-frame">
            <Image
              src="/mia-four-x4-arena.webp"
              // The model name is interpolated, not retyped: the alt text is a published
              // surface like any other, and a rename in lib/models.ts must not leave a
              // stale name here where only a screen-reader user would ever hear it.
              alt={`מיה פור ${PRO_MAX.name} · קלנועית חשמלית בארבעה גלגלים עם צמיגי שטח, שני קפיצי מתלים, מושב עם משענת גב, פנסי LED ומראה`}
              width={2400}
              height={1350}
              sizes="(max-width: 620px) 92vw, (max-width: 1120px) 88vw, 980px"
              quality={86}
              className="first-img"
            />
          </div>

          {/* Read from lib/models.ts, never retyped. */}
          <ul className="first-specs">
            {PRO_MAX.highlights.map((h) => (
              <li key={h} className="first-spec">
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
