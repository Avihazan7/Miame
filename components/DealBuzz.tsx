"use client";

// components/DealBuzz.tsx — the conversion-nudge section that follows the
// simulator. Four honest "next step" cards (בדיקת התאמה · הצעה מותאמת · בדיקת
// זכאות · שיחת ייעוץ), each mapping to a real action: scroll to the simulator or
// open the WhatsApp consult. Every CTA fires a tracked DealBuzzClicked event.
// No fake scarcity — the content is centralised in lib/deal-buzz.ts and guarded
// by test/dealBuzz.test.ts.

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import WaIcon from "./WaIcon";
import { DEAL_BUZZ_CARDS, BUZZ_DISCLAIMER, type BuzzItem } from "@/lib/deal-buzz";

export default function DealBuzz() {
  function onCta(item: BuzzItem) {
    void track("DealBuzzClicked", { placement: "deal-buzz", id: item.id, action: item.action });
    if (item.action === "wa") {
      const url = buildWhatsAppUrl(item.waMessage || "היי MiaMe, אשמח לפרטים על מיה פור 🙂");
      if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
      return;
    }
    if (typeof document !== "undefined") {
      document.getElementById("sim")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section className="block buzz-sec" id="deal-buzz">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">מבצע השקה</div>
          <h2 className="sec-title">מוכנים להתקדם? בחרו את הצעד הבא</h2>
          <p className="sec-desc">
            בלי לחץ ובלי הפתעות — בוחרים איך נוח לכם להתקדם, ואנחנו איתכם בוואטסאפ.
          </p>
        </div>

        <div className="buzz-grid">
          {DEAL_BUZZ_CARDS.map((c) => (
            <article className="buzz-card" key={c.id}>
              <div className="buzz-ic" aria-hidden="true">
                {c.icon}
              </div>
              <div className="buzz-title">{c.title}</div>
              <p className="buzz-text">{c.text}</p>
              <button
                type="button"
                className={
                  c.action === "wa"
                    ? "btn btn-light btn-block buzz-cta"
                    : "btn btn-ghost btn-block buzz-cta"
                }
                onClick={() => onCta(c)}
              >
                {c.action === "wa" && <WaIcon size={18} />}
                {c.cta}
              </button>
            </article>
          ))}
        </div>

        <p className="buzz-disc">{BUZZ_DISCLAIMER}</p>
      </div>
    </section>
  );
}
