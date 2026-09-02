/**
 * lib/content.ts — Single commercial source of truth for MiaMe.co.il.
 *
 * Every price and label that appears on the public site is defined (or
 * referenced) here so it can be reviewed and changed in ONE place.
 *
 * Contact policy: the ONLY contact route on the public site is MiaMe's own
 * WhatsApp line (SALES_WHATSAPP). No street address, no branch, no dealer list
 * and no importer phone number may be added to this file.
 *
 * ── Pricing policy ───────────────────────────────────────────────────────────
 * Official MIA FOUR list prices (importer): 19,990 / 21,990 / 27,990 ₪.
 * MiaMe sells ₪90 below list:               19,900 / 21,900 / 27,900 ₪.
 * Because MiaMe is below list, every price on the site is shown as "החל מ-"
 * (see lib/models.ts for the runtime values used by the simulator, and the
 * `price-from` label in components/Configurator.tsx).
 *
 * The simulator's runtime prices live in lib/models.ts (do not duplicate them
 * here — MODEL_PRICING below is a read-only view of that single source).
 */
import { MODELS } from "./models";

/** Read-only view of the live MiaMe offer prices (source: lib/models.ts). */
export const MODEL_PRICING = MODELS.map((m) => ({ id: m.id, name: m.name, price: m.price }));

/** Partner economics. */
export const SUCCESS_FEE_PCT = 13; // % of referrals only, no fixed cost

/** Example hourly rental pricing (MiaMe Hub). */
export const RENTAL_FROM = 50; // ₪ per hour — entry price
export const RENTAL_PRICES: { k: string; v: string }[] = [
  // The entry row IS RENTAL_FROM — it was typed again three lines under its own
  // definition, which is the shortest possible distance for two numbers to drift.
  // The longer tiers are their own quoted prices and stay literal.
  { k: "שעה אחת", v: String(RENTAL_FROM) },
  { k: "3 שעות", v: "100" },
  { k: "6 שעות", v: "180" },
  { k: "9 שעות", v: "245" }
];

/**
 * Warranty & service — the IMPORTER IDENTITY, not a period. Read it next to
 * WARRANTY_MONTHS / WARRANTY_TERM below, which are the TERM: two near-identical
 * names in the module the whole repo is told to read for commercial truth, and
 * this is the sentence that keeps them apart. WHO backs the vehicle lives here;
 * FOR HOW LONG lives there.
 */
export const WARRANTY = "אחריות יבואן רשמי · MEU · Mayer Electric Utilities";

/**
 * The importer's warranty TERM for MIA FOUR, in months.
 *
 * It was promised on five public surfaces — the hero trust row, the importer
 * band, the simulator's assurance list, the trust-signal bar and the offline
 * corpus — and defined in none of them, while app/legal/terms/page.tsx said the
 * term would only be disclosed at the point of sale. A marketing promise the
 * seller's own terms page declines to confirm is the shape a consumer complaint
 * takes, so the term lives here once and every surface, the terms page included,
 * reads it from here. It is stated, never invented: 12 is the figure all five
 * surfaces already carried.
 */
export const WARRANTY_MONTHS = 12;

/** The warranty as the marketing surfaces phrase it. Derived, never retyped. */
export const WARRANTY_TERM = `אחריות ושירות ${WARRANTY_MONTHS} חודשים`;

/**
 * The official importer — NAME ONLY.
 *
 * The sales campaign removes every address, branch, opening hour and importer
 * phone number from the public site (they used to live here as `SERVICE` and
 * `DEALERS`). What a buyer needs from the importer is the name behind the
 * warranty; every contact route runs through MiaMe's own WhatsApp line below.
 * Do not reintroduce an address or a phone here — this module is bundle-reachable.
 */
export const IMPORTER_NAME = "MEU · Mayer Electric Utilities";

/**
 * MIA FOUR's supply commitment, in business days, stated by the owner.
 *
 * It lives here rather than inside the delivery component because it is a
 * commercial fact and more than one surface quotes it — the delivery strip and
 * the knowledge corpus the on-site assistant answers from. It is a CEILING
 * ("עד"), conditioned on stock, and it is what distinguishes MIA FOUR (in stock)
 * from the SPYQE pre-order, whose own estimate lives in lib/spyqe.ts.
 */
export const MIA_FOUR_DELIVERY_DAYS = 3;

/** The manufacturer brand behind MIA FOUR. */
export const MANUFACTURER_NAME = "MIA Dynamics";

/**
 * The manufacturer's HEBREW name — and the reason it now exists.
 *
 * MEASURED 2026-09-01 across the whole served tree: "מיה דיינמיקס" appeared
 * ZERO times, on every page, in the corpus, and in llms.txt. The manufacturer
 * had a Latin name only. An Israeli buyer typing the name the way they would say
 * it matched nothing at all — the identical defect this repo already paid for
 * once with SPYQE, where 0 rows contained "ספייק" while 7 contained "SPYQE".
 *
 * A transliteration is not decoration: it is how a Hebrew speaker searches, and
 * how an answer engine resolves the Hebrew query to this entity.
 */
export const MANUFACTURER_NAME_HE = "מיה דיינמיקס";

/**
 * THE PRODUCT'S NAME, in one place, because two machine-readable surfaces were
 * declaring a name that exists in NO source.
 *
 * MEASURED 2026-09-01: the Product schema said `MiaMe Four` and llms.txt said
 * `MiaMe Four` — a hybrid of the SITE's name (MiaMe) and the PRODUCT's (MIA
 * FOUR). The hero says MIA FOUR, the corpus says מיה פור, the manufacturer says
 * MIA FOUR. Nothing anywhere says "MiaMe Four".
 *
 * That is the same defect class as the catalogue's "4×2": a designation from no
 * source, sitting in exactly the two places a machine reads. For entity
 * resolution it is worse than a typo — it teaches Google and the answer engines
 * a name that will never appear in a query.
 */
export const PRODUCT_NAME = "MIA FOUR";
export const PRODUCT_NAME_HE = "מיה פור";

/** What the product legally IS. Not "רכב" — the site's own legal page is explicit
 *  that MIA FOUR is classified as a קלנועית and is not a vehicle, and that is also
 *  the word buyers search. Keeping the two consistent is truth first, SEO second. */
export const PRODUCT_CATEGORY_HE = "קלנועית";

/**
 * Every name this one product answers to, for schema `alternateName`.
 *
 * This is the entity-resolution anchor, and it is the highest-value, lowest-risk
 * SEO/GEO move available here: it declares — once, in machine-readable form —
 * that MIA FOUR, מיה פור and מיה are the same thing. It earns the Hebrew queries
 * without repeating a single word in the prose, which is the difference between
 * naming an entity and stuffing a page.
 */
export const PRODUCT_ALTERNATE_NAMES = [
  PRODUCT_NAME,
  PRODUCT_NAME_HE,
  "מיה",
  // How a buyer types it when they lead with the category rather than the brand —
  // "קלנועית מיה" rather than "מיה פור". It belongs in the entity's alternate names,
  // where it earns the query, and NOT in the prose: forcing the phrase into a
  // sentence is the exact keyword-stuffing that costs more than the phrase is worth.
  `${PRODUCT_CATEGORY_HE} מיה`,
  "MIA 4",
] as const;

/** Brand WhatsApp / sales line (also configurable via NEXT_PUBLIC_WHATSAPP_NUMBER). */
/**
 * The sales line, re-exported rather than repeated. It used to be its own literal
 * here, which meant a number change had to be made twice and could half-land: the
 * wa.me links honoured the env var, this constant did not, and nothing compared
 * them. test/salesCampaign.test.ts still pins the value — and now pins the same
 * value the funnel actually dials.
 */
export { WHATSAPP_NUMBER as SALES_WHATSAPP } from "./whatsapp";

/**
 * Real, launch-grade GLB for the Ultra Vehicle Vision "3D Pro" tab.
 *
 * IMPORTANT: this is the env override ONLY (NEXT_PUBLIC_MIA_GLB_URL). We do NOT
 * fall back to the committed /public/models copy or the Supabase bucket copy —
 * both are lightweight *procedural placeholders* (scripts/build-glb.mjs), not a
 * real model of the vehicle, and showing them at launch looked worse than our
 * 4K studio photography. When an empty string is returned the 3D-Pro tab is
 * hidden and the photo gallery leads. Publish a genuine GLB and point this env
 * var at it — the tab lights up automatically, no code change needed.
 */
export const MIA_GLB_URL = process.env.NEXT_PUBLIC_MIA_GLB_URL || "";
