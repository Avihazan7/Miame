// lib/catalog.ts — the catalog model contract as served by leasing-api
// (GET /v1/public/catalog/models/:id) plus pure presentation helpers. Mirrors the
// backend ModelDetail.model shape so the UI consumes ONE documented contract.
// No I/O — pure types + label/derivation helpers for the card.

/** Government spec + importer carried on a catalog model (model_card attributes).
 *  Every field is optional — the open data is patchy and the card degrades. */
export interface CatalogAttributes {
  importer?: string | null;       // שם יבואן
  safetyLevel?: number | null;    // רמת אבזור בטיחותי 0–8
  safetyScore?: number | null;    // ניקוד בטיחות (כוכבים)
  pollutionLevel?: number | null; // קבוצת זיהום 1–15 (נמוך = נקי)
  greenIndex?: number | null;     // מדד ירוק
  co2Wltp?: number | null;        // CO₂ WLTP (g/km)
  fuelHe?: string | null;         // סוג דלק בעברית
  engineCc?: number | null;       // נפח מנוע
  horsepower?: number | null;     // כוח סוס
  batteryVoltage?: number | null; // מתח סוללה (חשמלי)
}

/** A catalog model card (the storefront unit). */
export interface CatalogModel {
  id: string;
  make: string;
  makeHe: string | null;
  modelFamily: string;
  name: string;
  fuelType: string | null;
  fromPrice: number | null;
  availableNew: boolean;
  /** Market tier — 'ultra-premium' triggers the concierge treatment + gate. */
  segment: string | null;
  attributes: CatalogAttributes;
  /** Optional studio imagery URL (imagin/curated) when present. */
  imageUrl?: string | null;
}

export const isUltraPremium = (m: Pick<CatalogModel, 'segment'>): boolean =>
  m.segment === 'ultra-premium';

/** ₪ price → "₪ 1,850,000" / "מחיר לפי בקשה" when unknown. */
export function formatPrice(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price)) return 'מחיר לפי בקשה';
  return '₪ ' + Math.round(price).toLocaleString('he-IL');
}

/** Safety level (0–8) → a tone + a Hebrew label for the chip. Higher is safer. */
export function safetyTone(level: number | null | undefined): { label: string; tone: 'good' | 'mid' | 'low' | 'none' } {
  if (level == null) return { label: 'אין נתון בטיחות', tone: 'none' };
  if (level >= 6) return { label: `רמת בטיחות ${level}/8`, tone: 'good' };
  if (level >= 3) return { label: `רמת בטיחות ${level}/8`, tone: 'mid' };
  return { label: `רמת בטיחות ${level}/8`, tone: 'low' };
}

/** Pollution group (1–15, LOWER cleaner) → tone + Hebrew label. */
export function pollutionTone(group: number | null | undefined): { label: string; tone: 'good' | 'mid' | 'low' | 'none' } {
  if (group == null) return { label: 'אין נתון זיהום', tone: 'none' };
  if (group <= 5) return { label: `קבוצת זיהום ${group}`, tone: 'good' };
  if (group <= 10) return { label: `קבוצת זיהום ${group}`, tone: 'mid' };
  return { label: `קבוצת זיהום ${group}`, tone: 'low' };
}

/** CO₂ (g/km) → a compact Hebrew label, or null when absent / pure-EV zero. */
export function co2Label(co2: number | null | undefined): string | null {
  if (co2 == null) return null;
  if (co2 === 0) return 'פליטת CO₂ אפס';
  return `CO₂ ${Math.round(co2)} ג׳/ק״מ`;
}

// ── In-Market → Ultra Design ────────────────────────────────────────────────
// The visitor's In-Market band drives a progressive "Ultra Design" elevation: as
// purchase intent rises, the catalog quietly intensifies (premium glass, motion,
// a stronger CTA) — focusing attention without a hard sell.

export type InMarketBand = 'cold' | 'browsing' | 'warm' | 'hot' | 'in_market';

/** Elevation level 0–3 for a band — how much "Ultra Design" treatment to apply. */
export function elevationForBand(band: InMarketBand | null | undefined): 0 | 1 | 2 | 3 {
  switch (band) {
    case 'in_market': return 3;
    case 'hot': return 2;
    case 'warm': return 1;
    default: return 0; // cold / browsing / unknown — calm baseline
  }
}

/** Hebrew label for an In-Market band. */
export function bandLabel(band: InMarketBand | null | undefined): string {
  return { cold: 'מתעניין', browsing: 'גולש', warm: 'מחפש', hot: 'בוחר', in_market: 'בשל לרכישה' }[band ?? 'cold'];
}

/** Map the brain's raw catalog model (snake_case) → the UI CatalogModel. */
export function mapApiModel(m: {
  id: string; make: string; make_he: string | null; model_family: string; name: string;
  fuel_type: string | null; from_price: string | number | null; available_new?: boolean;
  segment: string | null; attributes?: Record<string, unknown> | null;
  image_url?: string | null; media?: { studio?: string | null } | null;
}): CatalogModel {
  const price = m.from_price == null ? null : Number(m.from_price);
  return {
    id: m.id,
    make: m.make,
    makeHe: m.make_he,
    modelFamily: m.model_family,
    name: m.name,
    fuelType: m.fuel_type,
    fromPrice: Number.isFinite(price as number) ? (price as number) : null,
    availableNew: m.available_new ?? true,
    segment: m.segment,
    attributes: (m.attributes ?? {}) as CatalogAttributes,
    imageUrl: m.image_url ?? m.media?.studio ?? null,
  };
}
