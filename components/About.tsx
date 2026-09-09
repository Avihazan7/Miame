import Image from "next/image";
import { PRODUCT_CATEGORY_HE, PRODUCT_NAME_HE } from "@/lib/content";

export default function About() {
  return (
    <section className="block about-sec" id="about">
      <div className="wrap about-wrap">
        <div className="sec-kicker">אודותינו</div>
        <h2 className="about-title">
          לחיות את החלום
          <br />
          <span className="about-accent">להרגיש חופשי</span>
        </h2>

        <div className="about-logo">
          <span className="about-logo-halo" aria-hidden="true" />
          <span className="about-logo-disc">
            <Image
              src="/mia-four-badge.png"
              alt="MIA FOUR"
              width={420}
              height={420}
              className="about-logo-img"
            />
          </span>
        </div>

        {/* OWNER 2026-09-09: "במקום MiaMe.co.il לרשום מיה פור". The paragraph opens
            on what was BORN out of the belief, and what was born is the vehicle — the
            shop is what brings it to you. Same correction as the Cinema block: MiaMe
            is the store, MIA FOUR is the thing. "אנחנו מרכזים" downstream still speaks
            in the shop's voice, which is exactly where the shop belongs. */}
        <p className="about-text">
          <b>{PRODUCT_NAME_HE}</b> נולדה מתוך אמונה פשוטה · שלכל אחד מגיע החופש לזוז
          בביטחון, בנוחות ובסטייל. הדור הבא של ניידות חשמלית · <b>{PRODUCT_CATEGORY_HE}</b>{" "}
          על פלטפורמת ארבעה גלגלים מוגנת פטנטים · ואנחנו מרכזים במקום אחד את כל
          הפתרונות, אפשרויות השימוש והרכישה, מותאמים בדיוק אליכם. בלי פשרות על ניידות ·
          רק חופש, ביטחון והנאה מכל נסיעה.
        </p>
      </div>
    </section>
  );
}
