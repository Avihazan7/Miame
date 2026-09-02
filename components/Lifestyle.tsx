import Image from "next/image";

export default function Lifestyle() {
  return (
    <section className="block life-sec">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">לייפסטייל</div>
          <h2 className="sec-title">חכם בעיר ועוצמתי בשטח</h2>
          <p className="sec-desc">
            חוויה של דו־גלגלי עם יציבות ובטיחות של ארבעה. נסיעה חלקה, בטוחה ומהנה בתוואי
            רכיבה משתנה, הודות למערכת מתלים מתקדמת מוגנת פטנט והנעה חשמלית שקטה וירוקה.
          </p>
        </div>
        <div className="life-grid">
          <div className="life-card">
            {/* These five were plain <img>: five full-resolution originals, 353 KB
                between them, shipped whole with no srcset. The four cards sit in a
                one-column grid that becomes two columns at 780px (.life-grid), and
                the band below is full width — that is what the `sizes` strings say.
                The attributes stay the file's TRUE intrinsic size, exactly as
                test/imageLayout.test.ts requires, so the reserved box is unchanged
                and this buys bytes without buying layout shift.

                2026-09-02, second batch — and the finding is not the one it looks
                like. This is the SAME photograph the card always held, but the
                1500×1000 file the owner re-sent was ALREADY IN THE REPO: it sat in
                assets-archive/mia-fold-lot.jpg, byte for byte, because
                scripts/optimize-images.mjs archives every original it re-encodes and
                its PHOTO tier caps the long edge at 1100px. So the card was serving a
                1100×733 rendition of a file the repo owned at 1500×1000, and
                next/image had 1100px to build every srcset candidate from. Nothing
                was missing — it had been pre-shrunk on the way in, and the optimizer
                is better at that decision than a build step is, because it makes it
                per request. The name is out of that script's TARGETS so the shrink
                cannot come back. */}
            <Image
              sizes="(min-width: 1120px) 527px, (min-width: 780px) 50vw, 100vw"
              src="/mia-four-x4-fold-parking.jpg"
              alt="מיה פור מקופלת ליד הרכב בחניון · מתקפלת ונכנסת לכל מקום"
              loading="lazy"
              quality={90}
              width={1500}
              height={1000}
            />
            <div className="life-cap">
              <b>חכם בעיר</b>
              <span>מתקפל · נייד · 42 ק״ג, נכנס לכל מקום</span>
            </div>
          </div>
          <div className="life-card">
            {/* The manufacturer's frame, 2026-09-02. Same 1000×1000 as the shot it
                replaces but 130KB against 65KB — twice the data at the same size,
                which on a black tyre against white is the difference between tread
                and a smudge. It is also the wider composition: the alloy face, the
                fender, the teal coil, the disc AND the second wheel, with the
                sidewall legible.

                DELIBERATELY NOT SWAPPED in the second batch. The sand frame from the
                same shoot is the better *scene* for "עוצמתי בשטח" — and it is now the
                /klnoit-shetach hero, where a 554×554 render used to be. This tile
                keeps the studio frame because it is the only one on the site where
                the tyre's own markings are readable, which is what a card about
                "צמיגי שטח MIA Dynamics" is actually claiming. */}
            <Image
              sizes="(min-width: 1120px) 527px, (min-width: 780px) 50vw, 100vw"
              src="/mia-four-x4-wheel-suspension.jpg"
              alt="מיה פור 4×4 Pro Max · גלגל שטח, חישוק סגסוגת, קפיץ ספיגה ובלם דיסק"
              loading="lazy"
              quality={90}
              width={1000}
              height={1000}
            />
            <div className="life-cap">
              <b>עוצמתי בשטח</b>
              <span>מתלים מלאים · צמיגי שטח MIA Dynamics</span>
            </div>
          </div>
          <div className="life-card">
            {/* Was a 1080×1080 studio RENDER of the rear suspension on black. Two
                things were wrong with it here, and only the second is about taste:
                a square frame in a ~527×230 tile keeps 44% of its height, so most of
                what the render showed was cropped away; and a card captioned
                "נוכחות פרימיום" was illustrating presence with an object on a
                seamless. This is the manufacturer's marina frame at dusk — two
                machines, both headlights lit. It is the only photograph on the site
                where the lighting is shown DOING anything. */}
            <Image
              sizes="(min-width: 1120px) 527px, (min-width: 780px) 50vw, 100vw"
              src="/mia-four-marina-dusk.jpg"
              alt="שני רוכבים על מיה פור במרינה בשעת בין ערביים · פנסים קדמיים דולקים"
              loading="lazy"
              quality={90}
              width={1500}
              height={1000}
            />
            <div className="life-cap">
              <b>עיצוב שמדבר</b>
              <span>נוכחות פרימיום · קווים נקיים, אמין ורגוע</span>
            </div>
          </div>
          <div className="life-card">
            {/* The caption is "ישיבה או עמידה", and until now it was illustrated by a
                studio shot of a mounted seat with nobody on it — which shows one half
                of the claim. Here the seat is mounted AND the rider is standing on the
                deck, in one frame: that IS the choice the caption describes. The
                studio frame is not lost — it moves to the Ministry of Defence section,
                where a neutral product shot is the right register and where it also
                retires the `mia-white.webp` alias. */}
            <Image
              sizes="(min-width: 1120px) 527px, (min-width: 780px) 50vw, 100vw"
              src="/mia-four-x4-beach-standing.jpg"
              alt="רוכב עומד על משטח מיה פור בחוף · הכיסא מותקן, ישיבה או עמידה לבחירה"
              loading="lazy"
              quality={90}
              width={1500}
              height={1000}
            />
            <div className="life-cap">
              <b>ישיבה או עמידה</b>
              <span>כיסא בשחרור מהיר ביד אחת · נוחות לכל אורך הדרך</span>
            </div>
          </div>
        </div>
        <div className="life-band photo-frame">
          {/* 960×640 → 1500×1000 for a band that is 1076px wide on a 1120px container,
              i.e. 2152px at 2× DPR: the old file could not fill it at any density and
              the browser upscaled. The frame changed too, and that is the larger point:
              the site had no photograph of anyone SEATED on the machine anywhere. Every
              seated proof was a studio shot of an empty seat — on a product whose whole
              category is a קלנועית. This is that photograph.

              The band is a 13:5 crop of a 3:2 file (see .life-band), so ~58% of the
              height survives; object-position keeps the machine and the rider's torso,
              which is what reads at band size. */}
          <Image
            sizes="(min-width: 1120px) 1076px, 100vw"
            src="/mia-four-x4-beach-seated.jpg"
            alt="רוכב יושב על מיה פור על קו החוף · כיסא וגב מלאים, חופש בכל מקום"
            loading="lazy"
            quality={90}
            width={1500}
            height={1000}
          />
          <div className="photo-cap">
            <b>חופש אמיתי, בכל מקום</b>
            <span>מהעיר, דרך החוף, אל השטח</span>
          </div>
        </div>
      </div>
    </section>
  );
}
