/**
 * lib/spyqe.ts — the single source of truth for MIA SPYQE.
 *
 * SPYQE is the second model on the platform and the first sold as a PRE-ORDER.
 * Every SPYQE fact on the site — the section, the WhatsApp message, the schema,
 * the knowledge corpus — reads from here. Nothing is written twice.
 *
 * PROVENANCE. The commercial terms below were supplied directly by the owner,
 * who is the importer's business partner. They are authoritative.
 *
 * ⚠ THERE IS NO SPECIFICATION HERE, AND THAT IS DELIBERATE.
 *   No motor, battery, range, speed, weight or dimension figure for SPYQE has
 *   been verified by this repo — miadynamics.com is unreachable from the build
 *   environment. MIA FOUR's numbers are NOT SPYQE's numbers: different vehicle,
 *   roughly half the price. Copying them across would be the exact failure the
 *   owner's own rule forbids. So the site says plainly that the full spec is
 *   published on confirmation, and says nothing it cannot stand behind.
 *   `test/spyqeOffer.test.ts` fails if a MIA FOUR figure appears on this surface.
 */

export const SPYQE = {
  id: "spyqe",
  name: "SPYQE",
  nameHe: "ספייק",
  full: "MIA SPYQE 2×4",
  /** The manufacturer's product page. Kept as provenance, not as a data source. */
  sourceUrl: "https://miadynamics.com/products/mia-spyqe-2x4-electric-scooter",

  /** Importer list price, ILS. */
  listPrice: 11_900,
  /** The pre-order headline: this is the number a buyer feels every month. */
  monthlyPayment: 599,
  /** Zero interest, zero linkage — the same 18-payment ceiling the site sells on. */
  months: 18,
  /** How many registrants the first shipment covers. A real cap, not a live counter. */
  slots: 248,
  /** An ESTIMATE, never a guarantee. */
  deliveryBusinessDays: 33,
} as const;

/**
 * 10,782 ₪ — DERIVED, never typed. If the monthly payment or the term is ever
 * edited, the total follows automatically instead of silently disagreeing with it.
 */
export const SPYQE_TOTAL = SPYQE.monthlyPayment * SPYQE.months;

/** 1,118 ₪ off the list price. Also derived, for the same reason. */
export const SPYQE_SAVING = SPYQE.listPrice - SPYQE_TOTAL;

/** ₪ with thousands separators, matching how prices read elsewhere on the site. */
export const ils = (n: number) => `${n.toLocaleString("he-IL")} ₪`;
