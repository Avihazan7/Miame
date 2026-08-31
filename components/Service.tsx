import { IMPORTER_NAME } from "@/lib/content";
import LexIcon, { type LexName } from "@/components/LexIcon";
import WaCta from "@/components/WaCta";

/**
 * Nationwide delivery — a compact promise strip, not a section.
 *
 * History: this block used to be the branch/dealer directory, then briefly a
 * hand-drawn map of the country. Both are gone. The illustration was dropped on
 * the owner's call after seeing it live — a stylised silhouette read as
 * decoration, not as proof, and it took a full screen to say one sentence. What
 * survives is the sentence itself plus the route to act on it.
 *
 * No address, no branch, no phone, no opening hours, no drawing. Every contact
 * route on this site is MiaMe's own WhatsApp.
 */

const POINTS: { icon: LexName; k: string; v: string }[] = [
  { icon: "globe", k: "מסירה בכל הארץ", v: "מתואמת אתכם מראש מול נציג" },
  { icon: "shield", k: "אחריות יבואן רשמי", v: IMPORTER_NAME },
  { icon: "wrench", k: "שירות וחלפים מקוריים", v: "לאורך תקופת האחריות" },
];

export default function Service() {
  return (
    <section className="block service-sec" id="service">
      <div className="wrap">
        <div className="delivery-band">
          <div className="delivery-head">
            <div className="sec-kicker">מסירה ארצית · אחריות יבואן רשמי</div>
            <h2 className="sec-title">משלוח ומסירה בכל חלקי הארץ</h2>
            <p className="sec-desc">
              מיה פור מיובאת רשמית על ידי {IMPORTER_NAME} ונמכרת עם אחריות יבואן רשמי.
              בכל אזור בארץ, המסירה מתואמת אתכם מראש.
            </p>
          </div>

          <ul className="delivery-points">
            {POINTS.map((p) => (
              <li key={p.k}>
                <span className="dp-ic" aria-hidden="true">
                  <LexIcon name={p.icon} />
                </span>
                <b>{p.k}</b>
                <span className="dp-v">{p.v}</span>
              </li>
            ))}
          </ul>

          <WaCta cta="delivery" variant="primary" className="delivery-cta" />
        </div>
      </div>
    </section>
  );
}
