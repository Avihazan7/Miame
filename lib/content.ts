/**
 * lib/content.ts — Single commercial source of truth for MiaMe.co.il.
 *
 * Every price, label and contact detail that appears on the public site is
 * defined (or referenced) here so it can be reviewed and changed in ONE place.
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

/** Official importer list prices, for reference / comparison only. */
export const OFFICIAL_LIST_PRICES: Record<string, number> = {
  "4x2": 19990,
  "2x4lr": 21990,
  "4x4": 27990
};

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

export const SERVICE = {
  importer: "MEU · Mayer Electric Utilities",
  flagshipName: "MEU · אליעזר קפלן 21, תל אביב",
  flagshipHours: "א׳–ה׳ 10:00–19:00 · ו׳ וערב חג 10:00–14:00",
  // ⚠ PHONE PENDING OWNER CONFIRMATION:
  //   current site uses 077-8038321; the official MIA site lists 077-7296656.
  //   Confirm which is the MiaMe contact line, then update here AND Service.tsx.
  flagshipTel: "0778038321"
};

/** Authorized dealers — [name, city, phone]. */
export const DEALERS: [string, string, string][] = [
  ["אקו פאן", "הוד-השרון", "09-3730188"],
  ["אורבניקו", "תל-אביב", "03-7207220"],
  ["אורבן רייד", "תל-אביב", "051-2872267"],
  ["אורסל", "ראשון לציון", "052-6387509"],
  ["פול גזז", "אשקלון", "050-4525183"],
  ["אופני הבירה", "ירושלים", "02-5326699"],
  ["הר ריידר", "בית שמש", "054-8424101"],
  ["MIA בני ברק", "בני ברק", "050-4171552"],
  ["גלגל יציב", "כנות", "1-700-557-744"],
  ["MOTOATV", "כרמיאל", "053-4000100"],
  ["ElectricMove", "חצור הגלילית", "050-5949416"],
  ["מחסני חשמל", "אילת", "073-2540171"],
  ["All Mobile", "אילת", "054-9188871"],
  ["מייק בייק", "אילת", "053-6500174"]
];

/** Brand WhatsApp / sales line (also configurable via NEXT_PUBLIC_WHATSAPP_NUMBER). */
export const SALES_WHATSAPP = "972547477477";

/**
 * Professional GLB for the Ultra Vehicle Vision "3D Pro" tab. Authored
 * deterministically by scripts/build-glb.mjs and served from /public. Override
 * with NEXT_PUBLIC_MIA_GLB_URL once the asset is published to the Supabase
 * `vehicle-media` bucket (scripts/publish-glb-to-bucket.mjs).
 */
export const MIA_GLB_URL =
  process.env.NEXT_PUBLIC_MIA_GLB_URL || "/models/mia-four-x4.glb";
