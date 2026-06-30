// components/VehicleCard.tsx — the 2026 catalog card.
//
// A presentational card for ONE catalog model, rendering the official government
// data the catalog now carries (data.gov.il): manufacturer + model, official
// safety level, pollution group + green index, CO₂/consumption, and the importer.
//
// Two adaptive layers ride on top of the static design:
//   • Master Match — when this model is the visitor's best fit, an azure ribbon +
//     "Master Match" badge + fit% mark it as the recommendation.
//   • Ultra Design (In-Market) — `elevation` (0–3, derived from the visitor's
//     In-Market band) progressively intensifies the card: premium ring, lift, and
//     a stronger CTA as purchase intent rises. Ultra-premium marques always get
//     the gold concierge treatment.
//
// Pure presentation: the contract (lib/catalog.ts) is the single source of shape
// + labels; adaptivity arrives as props from the client experience layer.

import {
  type CatalogModel,
  isUltraPremium,
  formatPrice,
  safetyTone,
  pollutionTone,
  co2Label,
} from "@/lib/catalog";

const TONE_CLASS: Record<"good" | "mid" | "low" | "none", string> = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  mid: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-rose-50 text-rose-700 ring-rose-200",
  none: "bg-mist text-slate ring-line",
};

// Ultra Design — ring + shadow per elevation level (0 calm → 3 in-market).
const ELEVATION_RING = ["ring-1 ring-line", "ring-1 ring-sky/40", "ring-2 ring-azure/50", "ring-2 ring-azure shadow-lift"];

function Chip({ label, tone = "none" }: { label: string; tone?: "good" | "mid" | "low" | "none" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${TONE_CLASS[tone]}`}>
      {label}
    </span>
  );
}

export interface VehicleCardProps {
  model: CatalogModel;
  /** This model is the visitor's Master Match (best fit). */
  matched?: boolean;
  /** Fit 0–100 to show on the match badge. */
  matchPct?: number;
  /** Ultra-Design elevation 0–3, derived from the visitor's In-Market band. */
  elevation?: 0 | 1 | 2 | 3;
  /** Fired when the card is opened — drives a storefront signal. */
  onView?: (model: CatalogModel) => void;
}

export default function VehicleCard({ model, matched = false, matchPct, elevation = 0, onView }: VehicleCardProps) {
  const ultra = isUltraPremium(model);
  const a = model.attributes ?? {};
  const safety = safetyTone(a.safetyLevel);
  const pollution = pollutionTone(a.pollutionLevel);
  const co2 = co2Label(a.co2Wltp);
  const fuel = a.fuelHe ?? model.fuelType ?? null;
  const hot = elevation >= 2;

  const ring = ultra
    ? "ring-2 ring-amber-300/70 [background:linear-gradient(180deg,#fffdf5,#ffffff)]"
    : matched
      ? "ring-2 ring-azure shadow-lift"
      : ELEVATION_RING[elevation];

  return (
    <article
      dir="rtl"
      onClick={onView ? () => onView(model) : undefined}
      className={[
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl2 bg-snow shadow-card transition duration-300",
        "hover:-translate-y-0.5 hover:shadow-lift",
        hot ? "-translate-y-0.5" : "",
        ring,
      ].join(" ")}
    >
      {/* Top ribbons: ultra-premium (gold) or Master Match (azure) */}
      {ultra ? (
        <div className="absolute right-0 top-0 z-10 rounded-bl-xl2 bg-gradient-to-l from-amber-400 to-amber-600 px-3 py-1 text-xs font-semibold text-white shadow">
          אולטרה־פרימיום · קונסיירז׳
        </div>
      ) : matched ? (
        <div className="absolute right-0 top-0 z-10 rounded-bl-xl2 bg-gradient-to-l from-azure to-sky px-3 py-1 text-xs font-semibold text-white shadow">
          ★ Master Match{typeof matchPct === "number" ? ` · ${Math.round(matchPct)}%` : ""}
        </div>
      ) : null}

      {/* Imagery */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-mist">
        {model.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.imageUrl}
            alt={`${model.makeHe ?? model.make} ${model.name}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate/40">תמונת סטודיו בקרוב</div>
        )}
        {model.availableNew && (
          <span className="absolute bottom-2 right-2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            חדש מהיבואן · 0 ק״מ
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate">{model.makeHe ?? model.make}</div>
            <h3 className="text-lg font-bold leading-tight text-ink">{model.name}</h3>
          </div>
          <div className="shrink-0 text-left">
            <div className="text-[11px] text-slate">החל מ־</div>
            <div className={`text-base font-extrabold ${ultra ? "text-amber-700" : "text-azure"}`}>
              {formatPrice(model.fromPrice)}
            </div>
          </div>
        </header>

        {/* Government data chips */}
        <div className="flex flex-wrap gap-1.5">
          {fuel && <Chip label={fuel} />}
          <Chip label={safety.label} tone={safety.tone} />
          <Chip label={pollution.label} tone={pollution.tone} />
          {a.greenIndex != null && <Chip label={`מדד ירוק ${a.greenIndex}`} />}
          {co2 && <Chip label={co2} />}
          {a.horsepower != null && <Chip label={`${a.horsepower} כ״ס`} />}
        </div>

        {/* Importer + footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="truncate text-xs text-slate" title={a.importer ?? undefined}>
            {a.importer ? `יבואן: ${a.importer}` : "יבואן רשמי"}
          </span>
          {ultra ? (
            <span className="shrink-0 text-xs font-medium text-amber-700">דרוש אישור אנושי</span>
          ) : (
            // A span (not a button): the whole card is wrapped in a Link to the
            // standalone model page, so nested interactive elements are invalid.
            <span
              className={[
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition",
                hot ? "bg-azure shadow-lift group-hover:brightness-110" : "bg-azure/90 group-hover:brightness-110",
              ].join(" ")}
            >
              {hot ? "דברו איתי עכשיו" : "לפרטים"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
