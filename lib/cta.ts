// Unified conversion vocabulary — one primary CTA that repeats across the site,
// plus the lead `source` tags used for attribution (no schema change; these ride
// in the existing `source` string / WhatsApp message).

export const CTA = {
  /** Primary intent — scroll to the simulator to check fit. */
  fit: "בדיקת התאמה",
  /** Primary intent that opens WhatsApp from the simulator. */
  fitWa: "בדיקת התאמה בוואטסאפ",
  /** Rental — reserve an hour at Green Extreme. */
  rental: "שריון שעה ב-Green Extreme",
  rentalTalk: "דברו איתי על השכרה",
  navGreenExtreme: "נווט ל-Green Extreme",
  /** Defence-forces eligibility. */
  tribute: "בדיקת זכאות",
  /** Business partner Hub. */
  partner: "אני רוצה להיות שותף",
} as const;

/** Attribution source tags for the lead `source` string (per funnel path). */
export const SOURCE = {
  purchase: "purchase_private",
  rental: "rental_eilat_green_extreme",
  tribute: "tribute_mod_eligibility",
  partnerHub: "partner_hub_lead",
  testRide: "test_ride",
  legal: "legal_status_interest",
} as const;
