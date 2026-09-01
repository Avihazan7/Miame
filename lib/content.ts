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
  { k: "שעה אחת", v: "50" },
  { k: "3 שעות", v: "100" },
  { k: "6 שעות", v: "180" },
  { k: "9 שעות", v: "245" }
];

/** Warranty & service. */
export const WARRANTY = "אחריות יבואן רשמי · MEU · Mayer Electric Utilities";

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
