// app/catalog-2026/page.tsx — preview of the 2026 catalog card design.
//
// Renders VehicleCard against the documented contract (lib/catalog.ts) with a few
// representative 2026 models — including an ultra-premium marque — so the design
// is reviewable in the Vercel preview. Sample data only; the live grid binds to
// leasing-api GET /v1/public/catalog/models. Pure server component.

import type { Metadata } from "next";
import VehicleCard from "@/components/VehicleCard";
import type { CatalogModel } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "קטלוג 2026 — עיצוב כרטיס רכב | MiaMe",
  robots: { index: false, follow: false }, // a design preview, not an indexable page
};

const SAMPLE: CatalogModel[] = [
  {
    id: "mot-toyota-corolla", make: "toyota", makeHe: "טויוטה", modelFamily: "corolla",
    name: "COROLLA", fuelType: "היברידי", fromPrice: 165000, availableNew: true, segment: null,
    attributes: { importer: "טויוטה ישראל", safetyLevel: 7, safetyScore: 5, pollutionLevel: 3, greenIndex: 42, co2Wltp: 98, fuelHe: "היברידי", horsepower: 140 },
  },
  {
    id: "mot-hyundai-ioniq", make: "hyundai", makeHe: "יונדאי", modelFamily: "ioniq",
    name: "IONIQ 5", fuelType: "חשמלי", fromPrice: 215000, availableNew: true, segment: null,
    attributes: { importer: "קולקט מוטורס", safetyLevel: 8, safetyScore: 5, pollutionLevel: 1, greenIndex: 12, co2Wltp: 0, fuelHe: "חשמלי", horsepower: 305, batteryVoltage: 800 },
  },
  {
    id: "mot-citroen-edyhz", make: "citroen", makeHe: "סיטרואן", modelFamily: "berlingo",
    name: "BERLINGO", fuelType: "דיזל", fromPrice: 178000, availableNew: true, segment: null,
    attributes: { importer: "דוד לובינסקי", safetyLevel: 2, safetyScore: 2, pollutionLevel: 11, greenIndex: 297, co2Wltp: 153, fuelHe: "דיזל", horsepower: 130 },
  },
  {
    id: "mot-ferrari-roma", make: "ferrari", makeHe: "פרארי", modelFamily: "roma",
    name: "ROMA", fuelType: "בנזין", fromPrice: 1850000, availableNew: true, segment: "ultra-premium",
    attributes: { importer: "פרארי ישראל", safetyLevel: 5, pollutionLevel: 14, greenIndex: 520, co2Wltp: 255, fuelHe: "בנזין", horsepower: 620 },
  },
];

export default function Catalog2026Preview() {
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <div className="text-sm font-medium text-azure">קטלוג מודל 2026 · נתוני data.gov.il</div>
        <h1 className="mt-1 text-3xl font-extrabold text-ink">כרטיס רכב — עיצוב</h1>
        <p className="mt-2 max-w-2xl text-slate">
          כל כרטיס מציג את הנתונים הרשמיים: יצרן ודגם, רמת בטיחות, קבוצת זיהום ומדד ירוק,
          פליטת CO₂, היבואן — וטיפול ייעודי לדגמי אולטרה־פרימיום.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE.map((m) => (
          <VehicleCard key={m.id} model={m} />
        ))}
      </div>
    </main>
  );
}
