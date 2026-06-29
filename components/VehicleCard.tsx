// components/VehicleCard.tsx — the 2026 catalog card.
//
// A presentational card for ONE catalog model, rendering the official government
// data the catalog now carries (data.gov.il): manufacturer + model, official
// safety level, pollution group + green index, CO₂/consumption, and the importer.
// Ultra-premium models get a distinct gold treatment AND a concierge note that
// mirrors the backend business gate (no autonomous execution — human approval).
//
// Pure presentation: it takes a CatalogModel and renders. No data fetching, no
// scoring — the contract (lib/catalog.ts) is the single source of shape + labels.

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

function Chip({ label, tone = "none" }: { label: string; tone?: "good" | "mid" | "low" | "none" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${TONE_CLASS[tone]}`}>
      {label}
    </span>
  );
}

export default function VehicleCard({ model }: { model: CatalogModel }) {
  const ultra = isUltraPremium(model);
  const a = model.attributes ?? {};
  const safety = safetyTone(a.safetyLevel);
  const pollution = pollutionTone(a.pollutionLevel);
  const co2 = co2Label(a.co2Wltp);
  const fuel = a.fuelHe ?? model.fuelType ?? null;

  return (
    <article
      dir="rtl"
      className={[
        "group relative flex flex-col overflow-hidden rounded-xl2 bg-snow shadow-card transition",
        "hover:-translate-y-0.5 hover:shadow-lift",
        ultra
          ? "ring-2 ring-amber-300/70 [background:linear-gradient(180deg,#fffdf5,#ffffff)]"
          : "ring-1 ring-line",
      ].join(" ")}
    >
      {/* Ultra-premium ribbon */}
      {ultra && (
        <div className="absolute left-0 top-0 z-10 rounded-br-xl2 bg-gradient-to-l from-amber-400 to-amber-600 px-3 py-1 text-xs font-semibold text-white shadow">
          אולטרה־פרימיום · קונסיירז׳
        </div>
      )}

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
          <div className="flex h-full w-full items-center justify-center text-slate/40">
            <span className="text-sm">תמונת סטודיו בקרוב</span>
          </div>
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
            <button className="shrink-0 rounded-full bg-azure px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110">
              לפרטים
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
