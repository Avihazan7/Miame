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
