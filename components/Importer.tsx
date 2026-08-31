import { IMPORTER_NAME, MANUFACTURER_NAME } from "@/lib/content";

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
            <li>אחריות ושירות 12 חודשים</li>
            <li>חלפים מקוריים ושירות טכני מוסמך</li>
            <li>תקן קלנועית EN17128</li>
          </ul>
        </div>

        <div className="importer-brand">
          <span className="imp-logo-tile">
            <img
              src="/mia-dynamics-logo.webp"
              alt={`${MANUFACTURER_NAME} · Make it anywhere`}
              width={220}
              height={50}
              loading="lazy"
            />
          </span>
          <span className="imp-global">היצרן · {MANUFACTURER_NAME}</span>
        </div>
      </div>
    </section>
  );
}
