// Unified conversion vocabulary — one primary CTA that repeats across the site,
// plus the lead `source` tags used for attribution (no schema change; these ride
// in the existing `source` string / WhatsApp message).

export const CTA = {
  /** Primary intent — scroll to the simulator to check fit. */
  fit: "בדיקת התאמה",
  /** Primary intent that opens WhatsApp from the simulator. */
  fitWa: "בדיקת התאמה בוואטסאפ",
  /** Defence-forces eligibility. */
  tribute: "בדיקת זכאות",
} as const;

/** Attribution source tags for the lead `source` string (per funnel path). */
export const SOURCE = {
  purchase: "purchase_private",
  tribute: "tribute_mod_eligibility",
  testRide: "test_ride",
  legal: "legal_status_interest",
} as const;
