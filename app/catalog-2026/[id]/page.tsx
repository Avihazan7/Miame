// app/catalog-2026/[id]/page.tsx — the standalone model page (דף עצמאי לדגם).
//
// Server-fetches ONE model's full record from the central brain
// (GET /v1/public/catalog/models/:id): official government data + studio imagery
// + trims (each with its משרד-התחבורה code), and the live supplier/importer
// OFFERS matched to this exact model by its degem code. The public endpoint is
// the private audience, so only B2C-eligible offers appear here; B2B/partner are
// gated behind the authenticated tier.
//
// Fails soft: when the brain is unconfigured/unreachable or the id is unknown, the
// page renders a calm "not found" rather than erroring.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelDetail, type ModelDetailApi, type OfferApi } from "@/lib/brain";
import {
  type CatalogAttributes,
  formatPrice,
  safetyTone,
  pollutionTone,
  co2Label,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const detail = await getModelDetail(params.id);
  if (!detail) return { title: "דגם לא נמצא | MiaMe" };
  const m = detail.model;
  const title = `${m.makeHe ?? m.make} ${m.name} 2026 — נתונים, מחיר והצעות | MiaMe`;
  return {
    title,
    description: `${m.makeHe ?? m.make} ${m.name}: נתוני data.gov.il הרשמיים — בטיחות, זיהום, תצרוכת ויבואן — והצעות ספקים מעודכנות לפי קוד הדגם.`,
    alternates: { canonical: `/catalog-2026/${m.id}` },
  };
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0">
      <span className="text-slate">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function OfferCard({ offer }: { offer: OfferApi }) {
  const list = offer.listPrice;
  const price = offer.offerPrice ?? list;
  const saving = list != null && offer.offerPrice != null && offer.offerPrice < list ? list - offer.offerPrice : null;
  return (
    <div className="flex flex-col gap-2 rounded-xl2 bg-snow p-4 shadow-card ring-1 ring-line">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-ink">{offer.trim ?? "גרסה"}</div>
          <div className="text-xs text-slate">
            {offer.modelYear ? `שנת ${offer.modelYear}` : ""}
            {offer.fuelType ? ` · ${offer.fuelType}` : ""}
          </div>
        </div>
        {offer.dealScore != null && (
          <span className="shrink-0 rounded-full bg-azure/10 px-2.5 py-1 text-xs font-bold text-azure ring-1 ring-azure/30">
            Deal Score {offer.dealScore}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-extrabold text-ink">{formatPrice(price)}</span>
        {saving != null && (
          <span className="text-xs font-medium text-emerald-600">חיסכון ₪{Math.round(saving).toLocaleString("he-IL")}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate">
        <span className="rounded-full bg-mist px-2 py-0.5 ring-1 ring-line">{offer.salesChannelLabel}</span>
        {offer.zeroKm && <span>מחיר 0 ק״מ אמיתי: {formatPrice(offer.zeroKm.price)}</span>}
        {offer.registration && (
          <span>
            עלייה לכביש: {String(offer.registration.month).padStart(2, "0")}/{offer.registration.year}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function ModelPage({ params }: Params) {
  const detail: ModelDetailApi | null = await getModelDetail(params.id);
  if (!detail) notFound();
  const { model, trims, available, availableCount } = detail;
  const a = (model.attributes ?? {}) as CatalogAttributes;
  const hero = detail.media?.studio ?? null;
  const safety = safetyTone(a.safetyLevel);
  const pollution = pollutionTone(a.pollutionLevel);
  const co2 = co2Label(a.co2Wltp);

  return (
    <main dir="rtl" className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 text-sm text-slate">
        <Link href="/catalog-2026" className="hover:text-azure">
          ← קטלוג 2026
        </Link>
        <span className="px-2">/</span>
        <span className="font-medium text-ink">
          {model.makeHe ?? model.make} {model.name}
        </span>
      </nav>

      {/* Hero */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl2 bg-mist ring-1 ring-line">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={`${model.makeHe ?? model.make} ${model.name}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate/40">תמונת סטודיו בקרוב</div>
          )}
          {model.availableNew && (
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              חדש מהיבואן · 0 ק״מ
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <div className="text-sm font-medium uppercase tracking-wide text-slate">{model.makeHe ?? model.make}</div>
            <h1 className="text-3xl font-extrabold text-ink">{model.name}</h1>
            <div className="mt-2 text-2xl font-extrabold text-azure">{formatPrice(model.fromPrice)}</div>
            <div className="text-xs text-slate">מחיר מחירון רשמי החל מ־</div>
          </div>

          {/* Official MoT identity — the join key for supplier offers. */}
          <div className="rounded-xl2 bg-mist p-4 ring-1 ring-line">
            <div className="mb-1 text-xs font-semibold text-slate">קוד משרד התחבורה</div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                קוד תוצר: <strong className="text-ink">{model.motTozeretCd ?? "—"}</strong>
              </span>
              <span>
                קוד דגם: <strong className="text-ink">{model.motDegemCd ?? "—"}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Official government data */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold text-ink">נתונים רשמיים (data.gov.il)</h2>
        <div className="rounded-xl2 bg-snow p-5 shadow-card ring-1 ring-line">
          <Row label="יבואן רשמי" value={a.importer ?? "—"} />
          <Row label="סוג דלק" value={a.fuelHe ?? model.fuelType ?? undefined} />
          <Row label="רמת בטיחות" value={a.safetyLevel != null ? safety.label : undefined} />
          <Row label="קבוצת זיהום" value={a.pollutionLevel != null ? pollution.label : undefined} />
          <Row label="מדד ירוק" value={a.greenIndex != null ? String(a.greenIndex) : undefined} />
          <Row label="פליטת CO₂" value={co2 ?? undefined} />
          <Row label="הספק" value={a.horsepower != null ? `${a.horsepower} כ״ס` : undefined} />
          <Row label="נפח מנוע" value={a.engineCc != null ? `${a.engineCc} סמ״ק` : undefined} />
        </div>
      </section>

      {/* Trims — each with its official MoT model code */}
      {trims.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">גרסאות הדגם</h2>
          <div className="overflow-hidden rounded-xl2 ring-1 ring-line">
            <table className="w-full text-right text-sm">
              <thead className="bg-mist text-xs text-slate">
                <tr>
                  <th className="px-4 py-2 font-medium">גרסה</th>
                  <th className="px-4 py-2 font-medium">שנה</th>
                  <th className="px-4 py-2 font-medium">מחיר מחירון</th>
                  <th className="px-4 py-2 font-medium">קוד דגם</th>
                </tr>
              </thead>
              <tbody>
                {trims.map((t) => (
                  <tr key={t.id} className="border-t border-line bg-snow">
                    <td className="px-4 py-2 font-medium text-ink">{t.trim ?? "—"}</td>
                    <td className="px-4 py-2 text-slate">{t.modelYear ?? "—"}</td>
                    <td className="px-4 py-2 text-ink">{formatPrice(t.listPrice)}</td>
                    <td className="px-4 py-2 text-slate">{t.motDegemCd ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Supplier / importer offers — matched to this model by its degem code */}
      <section className="mt-10">
        <h2 className="mb-1 text-lg font-bold text-ink">הצעות ספקים ויבואנים</h2>
        <p className="mb-3 text-sm text-slate">
          מעודכן אונליין ממלאי הספקים, מוצלב לדגם זה לפי קוד הדגם.{" "}
          {availableCount > 0 ? `${availableCount} הצעות פעילות.` : ""}
        </p>
        {available.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {available.map((o) => (
              <OfferCard key={o.vin} offer={o} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl2 bg-mist p-6 text-center text-sm text-slate ring-1 ring-line">
            אין כרגע הצעות ספק פעילות לדגם זה. השאירו פרטים ונעדכן אתכם ברגע שתיכנס הצעה מתאימה.
          </div>
        )}
      </section>
    </main>
  );
}
