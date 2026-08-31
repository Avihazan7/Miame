import { IMPORTER_NAME } from "@/lib/content";

/**
 * Nationwide delivery — the section that replaced the branch/dealer block.
 *
 * Campaign rule: no address, no branch, no phone, no opening hours, no
 * navigation link. What remains is the promise (delivery everywhere in Israel),
 * the official-importer warranty, and a MAP.
 *
 * The map is a hand-authored inline SVG, on purpose:
 *   · the previous Google-Maps iframe pinned the flagship street address and
 *     leaked it twice (in the src query AND in the frame title a screen reader
 *     announces) — exactly what this campaign removes;
 *   · it is a third-party frame on the critical path, and dropping it lets the
 *     CSP drop `frame-src https://maps.google.com https://www.google.com`;
 *   · no raster asset, so it costs nothing against the image budget.
 *
 * The silhouette is a DELIBERATELY STYLISED brand illustration drawn by eye —
 * it is NOT survey data and must never be presented as a geographic map. The
 * figcaption says so, and the region names are geography, not a service promise.
 */

/* Stylised brand silhouette — NOT survey data, drawn by eye. viewBox 420×500.
   No accurate boundary asset exists offline in this repo and fetching one is out
   of scope, so the shape is deliberately simplified and the caption says so. */
const LAND_PATH =
  "M272 18 Q282 32 286 46 Q300 54 306 62 Q312 72 312 84 " +
  "Q305 95 300 104 Q297 117 296 130 Q302 144 306 158 Q309 177 310 196 " +
  "Q306 216 302 236 Q294 268 286 300 Q278 330 270 360 Q263 390 256 420 " +
  "L247 474 Q234 435 222 396 Q208 351 194 306 Q180 261 166 216 " +
  "Q152 201 140 186 Q138 179 136 172 Q139 161 142 150 Q146 139 150 128 " +
  "Q154 116 158 104 Q162 91 166 78 Q171 65 176 52 Q181 43 186 34 " +
  "Q213 31 240 28 Q258 23 272 18 Z";

/** The delivery spine: north → south, the route the animation runs along. */
const SPINE_PATH = "M268 58 Q222 130 196 206 Q220 320 244 430 L248 462";

type Region = {
  name: string;
  /** marker position in viewBox units */
  x: number;
  y: number;
  /** label anchor: "start" places the text east of the marker, "end" west of it */
  side: "start" | "end";
  /** where the label text begins (start) or ends (end) */
  lx: number;
};

const REGIONS: Region[] = [
  { name: "צפון", x: 270, y: 62, side: "start", lx: 330 },
  { name: "חיפה והקריות", x: 182, y: 112, side: "end", lx: 140 },
  { name: "השרון", x: 176, y: 150, side: "end", lx: 136 },
  { name: "גוש דן", x: 170, y: 186, side: "end", lx: 130 },
  { name: "שפלה", x: 178, y: 216, side: "end", lx: 138 },
  { name: "ירושלים", x: 272, y: 208, side: "start", lx: 326 },
  { name: "דרום", x: 240, y: 330, side: "start", lx: 310 },
  { name: "אילת", x: 250, y: 452, side: "start", lx: 300 },
];

export default function Service() {
  return (
    <section className="block service-sec" id="service">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">מסירה ארצית · אחריות יבואן רשמי</div>
          <h2 className="sec-title">משלוח ומסירה בכל חלקי הארץ</h2>
          <p className="sec-desc">
            מיה פור מיובאת רשמית על ידי {IMPORTER_NAME} ונמכרת עם אחריות יבואן רשמי.
            המסירה מתואמת אתכם מראש מול נציג, בכל אזור בארץ, ושירות וחלפים מקוריים
            מלווים אתכם לאורך תקופת האחריות.
          </p>
        </div>

        <figure className="coverage-map">
          <div className="coverage-canvas">
            <svg
              className="coverage-svg"
              viewBox="0 0 420 500"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-labelledby="cov-title cov-desc"
            >
              <title id="cov-title">איור פריסת המסירה של מיה פור בישראל</title>
              <desc id="cov-desc">
                איור מסוגנן של מפת ישראל עם שמונה אזורי מסירה מסומנים: צפון, חיפה
                והקריות, השרון, גוש דן, שפלה, ירושלים, דרום ואילת. האיור להמחשה בלבד
                ואינו מפה גאוגרפית.
              </desc>

              <path className="cov-land" d={LAND_PATH} />
              <path className="cov-spine" d={SPINE_PATH} />

              {REGIONS.map((r, i) => (
                <g key={r.name} className="cov-node">
                  <circle
                    className="cov-ping"
                    cx={r.x}
                    cy={r.y}
                    r={7}
                    style={{ animationDelay: `${(i * 0.38).toFixed(2)}s` }}
                  />
                  <circle className="cov-dot" cx={r.x} cy={r.y} r={3.6} />
                  <line
                    className="cov-leader"
                    x1={r.x}
                    y1={r.y}
                    x2={r.side === "start" ? r.lx - 6 : r.lx + 6}
                    y2={r.y}
                  />
                  <text className="cov-label" x={r.lx} y={r.y} textAnchor={r.side} dy="0.34em">
                    {r.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <figcaption className="coverage-note">
            איור להמחשה · מסירה מתואמת בכל אזורי הארץ. אין באיור משום מפה גאוגרפית או
            התחייבות לזמני אספקה.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
