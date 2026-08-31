// Rental lead flow helpers — Eilat / Green Extreme. Pure string/URL builders; the
// actual send happens client-side (WhatsApp + best-effort saveRentalLead), reusing
// the existing funnel primitives so the product lead flow is untouched.

import { RENTAL_HUB } from "./rental-fleet";

/** Public "from" hourly price for rentals (₪), consistent with the site FAQ. */
export const RENTAL_HOURLY_FROM = 50;

// NOTE — the street address and the Waze/Maps deep links that used to live here
// were removed with the rest of the site's addresses: MiaMe publishes no branch
// and no navigable location. Rental interest runs through WhatsApp like every
// other route. Do not reintroduce a place string or a map deep link here.

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
