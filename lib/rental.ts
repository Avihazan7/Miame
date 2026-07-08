// Rental lead flow helpers — Eilat / Green Extreme. Pure string/URL builders; the
// actual send happens client-side (WhatsApp + best-effort saveRentalLead), reusing
// the existing funnel primitives so the product lead flow is untouched.

import { RENTAL_HUB } from "./rental-fleet";

/** Public "from" hourly price for rentals (₪), consistent with the site FAQ. */
export const RENTAL_HOURLY_FROM = 50;

/** Green Extreme / Terminal Park — the navigable rental hub. */
export const GREEN_EXTREME_PLACE = "גרין אקסטרים פארק הטרמינל אילת דרך הערבה 3";

/** Waze deep link to the Green Extreme hub (same pattern as Service.tsx). */
export function wazeUrl(place: string = GREEN_EXTREME_PLACE): string {
  return "https://waze.com/ul?q=" + encodeURIComponent(place);
}

/** Google Maps fallback for desktops without Waze. */
export function mapsUrl(place: string = GREEN_EXTREME_PLACE): string {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place);
}

export interface RentalInquiry {
  fullName: string;
  phone: string;
  /** Optional requested hours (free-form), e.g. "2 שעות". */
  hours?: string;
  /** Attribution suffix (intent + campaign). */
  source: string;
}

/** Build the WhatsApp message a rental inquiry opens with. */
export function buildRentalMessage(input: RentalInquiry): string {
  const lines = [
    "שלום, אני מעוניין/ת בהשכרת MIA FOUR באילת (Green Extreme).",
    "",
    `מיקום: ${RENTAL_HUB}`,
    `החל מ-${RENTAL_HOURLY_FROM} ₪ לשעה`,
  ];
  if (input.hours && input.hours.trim()) lines.push(`משך מבוקש: ${input.hours.trim()}`);
  if (input.fullName) lines.push(`שם: ${input.fullName}`);
  if (input.phone) lines.push(`טלפון: ${input.phone}`);
  lines.push(`מקור: ${input.source}`);
  return lines.join("\n");
}
