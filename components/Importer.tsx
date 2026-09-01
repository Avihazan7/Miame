import { IMPORTER_NAME, MANUFACTURER_NAME, WARRANTY_TERM } from "@/lib/content";

/**
 * The importer band — NAME AND WARRANTY ONLY.
 *
 * Campaign rule: the buyer should know exactly who stands behind the vehicle and
 * exactly what the warranty is, and then talk to MiaMe. So this band carries the
 * importer's name, the manufacturer's brand and the warranty — and nothing that
 * routes a buyer away: no street address, no importer phone, no importer site,
 * no social profiles. Every contact route on the site is MiaMe's own WhatsApp.
 */
export default function Importer() {
  return (
    <section className="importer-band" aria-label="היבואן הרשמי והאחריות">
      <div className="wrap importer-inner">
        <div className="importer-info">
          <div className="importer-kicker">יבואן רשמי · הסוכנות המרכזית</div>
          <h3 className="importer-name">{IMPORTER_NAME}</h3>
          <div className="importer-sub">
            יבואן {MANUFACTURER_NAME} ישראל · MIA FOUR
          </div>
          <p className="importer-warranty">אחריות יבואן רשמי</p>
          <ul className="importer-points">
            <li>{WARRANTY_TERM}</li>
            <li>חלפים מקוריים ושירות טכני מוסמך</li>
            <li>תקן קלנועית EN17128</li>
          </ul>
        </div>

        <div className="importer-brand">
          <span className="imp-logo-tile">
            {/* The INTRINSIC size, not the rendered one. 220×50 was a guess at how
                big it looks; the file is 1920×1080. The browser reserved a 4.4:1
                box from the attributes and then collapsed it to the real 16:9 once
                the bytes arrived — 220px wide down to ~89px. That single collapse
                was the last measurable layout shift on the page. CSS still sizes
                it (height:50px, width:auto); the attributes only have to state the
                true ratio so the space reserved is the space used. */}
            <img
              src="/mia-dynamics-logo.webp"
              alt={`${MANUFACTURER_NAME} · Make it anywhere`}
              width={1920}
              height={1080}
              loading="lazy"
              decoding="async"
            />
          </span>
          <span className="imp-global">היצרן · {MANUFACTURER_NAME}</span>
        </div>
      </div>
    </section>
  );
}
