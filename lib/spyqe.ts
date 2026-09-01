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
 * THE SPECIFICATION IS VERIFIED, AND ONLY AS FAR AS THE SOURCE GOES.
 *   Every row in SPYQE_SPEC is transcribed from the manufacturer's own product
 *   page, which the owner captured and supplied on 2026-08-31 (the build
 *   environment cannot reach miadynamics.com). The capture is recorded in
 *   docs/evidence/spyqe-2026-08-31/ with its md5.
 *
 * ⚠ TWO THINGS ARE DELIBERATELY ABSENT.
 *   1. Top speed is published as 25 km/h ONLY. The source prints
 *      "25 km/h | 15 mph | 45 km/h" — the two higher figures are the foreign
 *      listings, printed beside the source's own note that "US units are limited
 *      by law to 16 mph". Israel is a קלנועית market and its ceiling is 25,
 *      which is also what the manufacturer's Key Features and stat band print.
 *      Carrying 45 onto a page that sells on קלנועית status would advertise a
 *      vehicle outside the category being sold.
 *   2. Battery voltage, charge time, weight, load, motor watts, IP rating and
 *      warranty term have NO field here, because the captured spec table ends
 *      before them. MIA FOUR's numbers are not SPYQE's — different vehicle,
 *      roughly half the price — and `test/spyqeOffer.test.ts` fails if one
 *      appears on this surface.
 */

export const SPYQE = {
  id: "spyqe",
  name: "SPYQE",
  nameHe: "ספייק",
  full: "MIA SPYQE 2×4",
  /** The manufacturer's product page. Kept as provenance, not as a data source. */
  sourceUrl: "https://miadynamics.com/products/mia-spyqe-2x4-electric-scooter",

  /** Importer list price, ILS. */
  listPrice: 11_990,
  /** The pre-order headline: this is the number a buyer feels every month. */
  monthlyPayment: 555,
  /** Zero interest, zero linkage — the same 18-payment ceiling the site sells on. */
  months: 18,
  /** How many registrants the first shipment covers. A real cap, not a live counter. */
  slots: 248,
  /** An ESTIMATE, never a guarantee. */
  deliveryBusinessDays: 33,
  /**
   * What secures a place in the first shipment, paid to the importer on
   * registration. The balance falls due when the shipment reaches the importer's
   * warehouses — so a registrant is never asked for the full amount against a
   * vehicle that has not landed.
   */
  deposit: 1_000,
} as const;

/**
 * 10,990 ₪ — DERIVED from all three parts, never typed. The deal is a deposit
 * PLUS a financed balance, so the total has to be built the way it is actually
 * paid; writing it as its own constant is how a later edit to the monthly figure
 * ends up silently disagreeing with the sum shown beside it.
 */
export const SPYQE_TOTAL = SPYQE.deposit + SPYQE.monthlyPayment * SPYQE.months;

/** 1,000 ₪ off the list price. Also derived, for the same reason. */
export const SPYQE_SAVING = SPYQE.listPrice - SPYQE_TOTAL;

/** 9,990 ₪ — the financed balance, due from the shipment's arrival. Derived. */
export const SPYQE_BALANCE = SPYQE.monthlyPayment * SPYQE.months;

/** ₪ with thousands separators, matching how prices read elsewhere on the site. */
export const ils = (n: number) => `${n.toLocaleString("he-IL")} ₪`;

export interface SpecRow {
  label: string;
  value: string;
  /** Optional qualifier the manufacturer itself prints. Never our own softening. */
  note?: string;
}

/**
 * The manufacturer's table, in the buyer's reading order rather than the
 * source's: what moves it, how fast, how far, how it stops, what it stands on,
 * how big it is folded. Imperial units are dropped — this site sells in Israel —
 * and every qualifier the source prints is kept, because a range figure without
 * "may vary" is a promise the manufacturer did not make.
 */
export const SPYQE_SPEC: SpecRow[] = [
  { label: "מנוע", value: "BLDC · שני מנועי גלגל (Dual Hub)" },
  {
    label: "מהירות מרבית",
    value: "25 קמ״ש",
    note: "תקרת הקלנועית בישראל · תלוי במשקל הרוכב, בתנאי הדרך, במצב הטעינה ובטמפרטורה",
  },
  { label: "טווח", value: "עד 50 ק״מ לסוללה", note: "משתנה לפי משקל הרוכב ותנאי הדרך" },
  { label: "סוללה", value: "20Ah · נשלפת" },
  { label: "בלמים", value: "דיסק הידראולי כפול" },
  { label: "גלגלים", value: '12"' },
  { label: "מידות", value: "562 × 1,225 × 1,248 מ״מ (ר×א×ג)" },
  { label: "גובה מקופל", value: "439 מ״מ" },
  // The site's established phrasing for MIA FOUR (components/LegalStatus.tsx) is
  // "תואמת תקן EN17128 ומותאמת לתקנות הקלנועית בישראל". EN17128 is what the
  // manufacturer certifies, so it is stated flatly. Israeli קלנועית REGISTRATION
  // for SPYQE specifically is a separate regulatory fact this repo has not seen,
  // so the row claims conformance to the standard — the same claim MIA FOUR
  // makes — and not an approval that has been granted.
  { label: "תקן", value: "EN17128", note: "תקן הקלנועית שהיצרן מצהיר עליו" },
];

/** Where every row above came from. Rendered under the table, not buried here. */
export const SPYQE_SPEC_SOURCE = {
  label: "מפרט היצרן · MIA Dynamics",
  capturedAt: "31.08.26",
} as const;

/**
 * SPYQE's structured-data properties.
 *
 * ⚠ Derived from SPYQE_SPEC, NEVER from lib/seo/product-jsonld's
 *   PRODUCT_PROPERTIES. That shared list opens with "מנוע — עד 1,800W לפי דגם",
 *   which is a MIA FOUR figure. Reusing it here would emit a MIA FOUR motor
 *   rating for SPYQE into the JSON-LD — the same leak the component is guarded
 *   against, in the one layer a human reviewer never looks at.
 */
export const SPYQE_PRODUCT_PROPERTIES = SPYQE_SPEC.map((row) => ({
  "@type": "PropertyValue",
  name: row.label,
  value: row.value,
}));

/**
 * The SPYQE Product node for the homepage graph.
 *
 * `price` is the pre-order total a buyer actually pays, not the list price —
 * quoting the list price while the page sells for less would put a number in the search
 * result that nobody can pay. The list price rides along as `priceSpecification`
 * so the saving is still machine-readable.
 *
 * No aggregateRating and no review: none exist, and inventing either is the
 * fastest way to lose a rich result permanently.
 */
export function spyqeProductJsonLd(siteUrl: string) {
  return {
    "@type": "Product",
    "@id": `${siteUrl}/#product-spyqe`,
    name: SPYQE.full,
    image: `${siteUrl}/miame-spyqe.webp`,
    description:
      `${SPYQE.full} — הדגם השני על פלטפורמת MIA Dynamics. ` +
      `מנוע BLDC כפול, מהירות מרבית 25 קמ״ש, טווח עד 50 ק״מ לסוללה, תקן EN17128. ` +
      `נמכר בהזמנה מוקדמת לקראת המשלוח הראשון לישראל.`,
    brand: { "@type": "Brand", name: "MiaMe" },
    offers: {
      "@type": "Offer",
      priceCurrency: "ILS",
      price: SPYQE_TOTAL,
      availability: "https://schema.org/PreOrder",
      url: `${siteUrl}/#spyqe`,
      // UnitPriceSpecification, not the abstract PriceSpecification, because
      // `priceType` only exists on the subtype — and `priceType` is the whole
      // point. Without it the Offer carries two bare numbers, 10,990 and 11,990,
      // with nothing to say which one a buyer pays; a consumer that resolves the
      // wrong one publishes a price this page does not sell at. ListPrice is the
      // value Google reads as the struck-through "was" figure.
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/ListPrice",
        priceCurrency: "ILS",
        price: SPYQE.listPrice,
        valueAddedTaxIncluded: true,
      },
    },
    additionalProperty: SPYQE_PRODUCT_PROPERTIES,
  };
}
