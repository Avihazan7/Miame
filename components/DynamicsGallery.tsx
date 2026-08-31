import Image from "next/image";
import LexIcon from "@/components/LexIcon";
import WaCta from "@/components/WaCta";
import { MANUFACTURER_NAME } from "@/lib/content";

/**
 * MIA Dynamics — the engineering close.
 *
 * The page ends on the details a buyer can SEE: the suspension, the chassis
 * linkage, the deck, the fleet. Every caption states something the photograph
 * actually shows, paired only with figures already verified elsewhere on this
 * site (Specs, Engineering, Patents). Nothing here is sourced from a spec sheet
 * this repo cannot check.
 *
 * ⚠ Resolution is honest, not uniform: three of these frames are 225px source
 * images. They are laid out as small accent tiles rather than upscaled into a
 * large slot, because a soft hero reads as cheap and a crisp small tile does
 * not. If higher-resolution originals arrive, swap the file and move the tile
 * up a size class — the grid is built for it.
 */

type Shot = {
  src: string;
  w: number;
  h: number;
  alt: string;
  title: string;
  copy: string;
  /** grid weight — "hero" spans two columns, "wide" spans two on desktop */
  size: "hero" | "wide" | "tile";
};

const SHOTS: Shot[] = [
  {
    src: "/gallery/mia-four-x4-studio-front.webp",
    w: 1080,
    h: 1080,
    size: "hero",
    alt: "MIA FOUR 4×4 · מבט חזית, ארבעה גלגלים ומתלים עצמאיים",
    title: "ארבעה גלגלים, לא שניים עם ייצוב",
    copy: "פלטפורמת המזעור של MIA Dynamics מחזיקה יציבות של ארבעה גלגלים בכלי בגודל של דו-גלגלי. זה מה שמוגן בפטנטים הרשומים, וזה מה שמרגישים ברגע שעולים.",
  },
  {
    src: "/gallery/mia-x4-wheel-suspension.webp",
    w: 554,
    h: 554,
    size: "wide",
    alt: "מתלה קפיצי וצמיג שטח של מיה פור, מקרוב",
    title: "מתלה עצמאי לכל גלגל",
    copy: "קפיץ ספיגה ייעודי לכל פינה, לא ציר קשיח. הצמיג רחב ומחורץ לשטח, והמערכת עובדת גם כשרק גלגל אחד פוגש מכשול.",
  },
  {
    src: "/gallery/mia-x4-chassis-deck.webp",
    w: 554,
    h: 554,
    size: "wide",
    alt: "שלדת מיה פור מלמטה · מוטות היגוי ומשטח דריכה",
    title: "השלדה היא המוצר",
    copy: "מוטות ההיגוי, נקודות העיגון ומשטח הדריכה המחוספס נראים כאן בלי כיסוי. הנדסה שמחזיקה 136 ק״ג עומס על כלי ששוקל 42.",
  },
  {
    src: "/gallery/mia-four-x4-seat-hero.webp",
    w: 535,
    h: 572,
    size: "wide",
    alt: "מיה פור 4×4 עם כיסא ומשענת · תצורת קלנועית",
    title: "ישיבה או עמידה, באותו כלי",
    copy: "הכיסא משתחרר ביד אחת. אותה פלטפורמה משמשת גם כקלנועית ישיבה מלאה וגם ככלי עמידה, בלי שני מוצרים ובלי פשרה על אף אחד מהם.",
  },
  {
    src: "/gallery/mia-x4-lights-linkage.webp",
    w: 225,
    h: 225,
    size: "tile",
    alt: "פנסים כפולים ומנגנון ההיגוי הקדמי של מיה פור",
    title: "פנסים כפולים",
    copy: "תאורה קדמית זוגית מעל מנגנון ההיגוי.",
  },
  {
    src: "/gallery/mia-x4-fender-wheel.webp",
    w: 225,
    h: 225,
    size: "tile",
    alt: "כנף וגלגל אחורי של מיה פור",
    title: "כנף ייעודית",
    copy: "כנף מלאה לכל גלגל, לא רצועה דקורטיבית.",
  },
  {
    src: "/gallery/mia-four-fleet-mall.webp",
    w: 225,
    h: 225,
    size: "tile",
    alt: "מספר כלי מיה פור בתצורת צי",
    title: "עובד גם כצי",
    copy: "אותו כלי, בפריסה מסחרית.",
  },
];

export default function DynamicsGallery() {
  return (
    <section className="block dyn-sec" id="dynamics" aria-labelledby="dyn-title">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">{MANUFACTURER_NAME} · הנדסה במבט קרוב</div>
          <h2 className="sec-title" id="dyn-title">
            מה שרואים כשמתקרבים
          </h2>
          <p className="sec-desc">
            כל פרט כאן הוא החלטה הנדסית, לא גימור. זו הסיבה שהפלטפורמה רשומה
            בפטנטים בארה״ב ובישראל, ולא מוצר שאפשר להעתיק.
          </p>
        </div>

        <div className="dyn-grid">
          {SHOTS.map((s) => (
            <figure className={`dyn-card dyn-${s.size}`} key={s.src}>
              <div className="dyn-media">
                <Image
                  src={s.src}
                  alt={s.alt}
                  width={s.w}
                  height={s.h}
                  sizes={
                    s.size === "hero"
                      ? "(max-width: 760px) 92vw, 46vw"
                      : s.size === "wide"
                        ? "(max-width: 760px) 92vw, 30vw"
                        : "(max-width: 760px) 44vw, 15vw"
                  }
                  loading="lazy"
                />
              </div>
              <figcaption>
                <b>{s.title}</b>
                <span>{s.copy}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="dyn-patents">
          <span className="dyn-patents-tag">
            <LexIcon name="trophy" /> מוגן בפטנטים רשומים
          </span>
          <div className="dyn-patents-list" dir="ltr">
            <span>US 11,878,763 B2</span>
            <span>US 12,097,926 B2</span>
            <span>IL 280339</span>
            <span>IL 285336</span>
          </div>
        </div>

        <div className="dyn-cta">
          <WaCta cta="order" variant="primary" />
        </div>
      </div>
    </section>
  );
}
