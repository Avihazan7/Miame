// app/catalog-2026/page.tsx — the live 2026 catalog.
//
// Server-fetches the catalog models from the central brain (getCatalogModels),
// maps them to the UI contract (lib/catalog), and renders the adaptive experience
// (CatalogExperience: In-Market → Ultra Design + Master Match). Falls back to a
// representative sample when the brain is unconfigured/unreachable, so the page
// always renders.

import type { Metadata } from "next";
import CatalogExperience from "@/components/CatalogExperience";
import { getCatalogModels } from "@/lib/brain";
import { type CatalogModel, mapApiModel } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "קטלוג 2026 — כל הדגמים | MiaMe",
  description:
    "קטלוג מודל 2026 מהמאגר הממשלתי: יצרן, דגם, רמת בטיחות, רמת זיהום, תצרוכת ויבואן — עם התאמה אישית חכמה.",
  alternates: { canonical: "/catalog-2026" },
};

// Fallback sample (brain unconfigured) — incl. an ultra-premium marque.
const SAMPLE: CatalogModel[] = [
  { id: "mot-toyota-corolla", make: "toyota", makeHe: "טויוטה", modelFamily: "corolla", name: "COROLLA", fuelType: "היברידי", fromPrice: 165000, availableNew: true, segment: null, attributes: { importer: "טויוטה ישראל", safetyLevel: 7, pollutionLevel: 3, greenIndex: 42, co2Wltp: 98, fuelHe: "היברידי", horsepower: 140 } },
  { id: "mot-hyundai-ioniq", make: "hyundai", makeHe: "יונדאי", modelFamily: "ioniq", name: "IONIQ 5", fuelType: "חשמלי", fromPrice: 215000, availableNew: true, segment: null, attributes: { importer: "קולקט מוטורס", safetyLevel: 8, pollutionLevel: 1, greenIndex: 12, co2Wltp: 0, fuelHe: "חשמלי", horsepower: 305 } },
  { id: "mot-citroen-edyhz", make: "citroen", makeHe: "סיטרואן", modelFamily: "berlingo", name: "BERLINGO", fuelType: "דיזל", fromPrice: 178000, availableNew: true, segment: null, attributes: { importer: "דוד לובינסקי", safetyLevel: 2, pollutionLevel: 11, greenIndex: 297, co2Wltp: 153, fuelHe: "דיזל", horsepower: 130 } },
  { id: "mot-ferrari-roma", make: "ferrari", makeHe: "פרארי", modelFamily: "roma", name: "ROMA", fuelType: "בנזין", fromPrice: 1850000, availableNew: true, segment: "ultra-premium", attributes: { importer: "פרארי ישראל", safetyLevel: 5, pollutionLevel: 14, greenIndex: 520, co2Wltp: 255, fuelHe: "בנזין", horsepower: 620 } },
];

async function loadModels(): Promise<CatalogModel[]> {
  const res = await getCatalogModels();
  const models = (res?.models ?? []).map(mapApiModel);
  return models.length > 0 ? models : SAMPLE;
}

export default async function Catalog2026() {
  const models = await loadModels();
  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <div className="text-sm font-medium text-azure">קטלוג מודל 2026 · נתוני data.gov.il</div>
        <h1 className="mt-1 text-3xl font-extrabold text-ink">בחר את הרכב שלך</h1>
        <p className="mt-2 max-w-2xl text-slate">
          כל כרטיס מציג את הנתונים הרשמיים — בטיחות, זיהום, תצרוכת ויבואן. ככל שתגלה
          עניין, ההתאמה האישית מתחדדת וה־Master Match בוחר עבורך.
        </p>
      </header>
      <CatalogExperience models={models} />
    </main>
  );
}
