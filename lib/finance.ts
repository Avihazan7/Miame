import { vatDownPayment } from "@/lib/simulator/pricing";

export type CustomerType = "private" | "business" | "partner";

export interface SliderRule {
  min: number;
  max: number;
  default: number;
  step: number;
  locked: boolean;
  hidden: boolean;
}

export interface TrackRule {
  id: CustomerType;
  label: string;
  discountPct: number;
  down: SliderRule;
  balloon: SliderRule;
  months: SliderRule;
  note: string;
}

// The slider still spans 0%–50%; what changed is where it OPENS. At 50% the
// simulator greeted every visitor with the largest cash outlay the track allows,
// which reads as the price of entry rather than as one end of a range. 25% is the
// owner's chosen anchor: on the 19,900 ₪ entry model it lands at 4,975 ₪ down and
// 829 ₪ a month — a number a buyer can picture without moving anything.
const DOWN_RULE: SliderRule = { min: 0, max: 50, default: 25, step: 1, locked: false, hidden: false };
const MONTHS_RULE: SliderRule = { min: 3, max: 18, default: 18, step: 1, locked: false, hidden: false };
// Balloon stays in the contract for old lead/WhatsApp/API payloads, but is no longer exposed.
const NO_BALLOON_RULE: SliderRule = { min: 0, max: 0, default: 0, step: 1, locked: true, hidden: true };
// Business/partner: the down-payment is the fixed VAT (lib/simulator/pricing.ts) —
// no slider (hidden). Computed in computeQuote, not driven by the UI value.
const VAT_DOWN_RULE: SliderRule = { min: 0, max: 0, default: 0, step: 1, locked: true, hidden: true };

export const TRACKS: Record<CustomerType, TrackRule> = {
  private: {
    id: "private",
    label: "פרטי",
    discountPct: 0,
    down: DOWN_RULE,
    balloon: NO_BALLOON_RULE,
    months: MONTHS_RULE,
    note: "מסלול פרטי נקי: מקדמה גמישה 0%–50%, 3–18 תשלומים, ללא ריבית והצמדה."
  },
  business: {
    id: "business",
    label: "עסקי",
    discountPct: 0,
    down: VAT_DOWN_RULE,
    balloon: NO_BALLOON_RULE,
    months: MONTHS_RULE,
    note: "מסלול עסקי: המקדמה היא רכיב המע״מ, והיתרה נפרסת ל-3–18 תשלומים ללא ריבית והצמדה."
  },
  partner: {
    id: "partner",
    label: "שותף עסקי",
    discountPct: 8,
    down: VAT_DOWN_RULE,
    balloon: NO_BALLOON_RULE,
    months: MONTHS_RULE,
    note: "מסלול שותף: 8% הנחת שותף, המקדמה היא רכיב המע״מ, יתרה ל-3–18 תשלומים ללא ריבית והצמדה."
  }
};

export interface QuoteInput {
  basePrice: number;
  type: CustomerType;
  downPct: number;
  balloonPct: number;
  months: number;
}

export interface Quote {
  basePrice: number;
  discountPct: number;
  effectivePrice: number;
  downPct: number;
  downAmount: number;
  balloonPct: number;
  balloonAmount: number;
  financedAmount: number;
  months: number;
  /** The regular instalment — paid `months - 1` times. */
  monthlyPayment: number;
  /**
   * The last instalment, which absorbs the remainder so the schedule sums EXACTLY.
   *
   * Equals `monthlyPayment` when the balance divides evenly; otherwise it is higher by
   * `financedAmount % months`, i.e. at most `months - 1` shekels.
   *
   * INVARIANT, and the whole reason this field exists:
   *   monthlyPayment * (months - 1) + finalPayment === financedAmount
   */
  finalPayment: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computeQuote(input: QuoteInput): Quote {
  const track = TRACKS[input.type];
  const discountPct = track.discountPct;
  const effectivePrice = Math.round(input.basePrice * (1 - discountPct / 100));

  const balloonPct = clamp(
    track.balloon.locked ? track.balloon.default : input.balloonPct,
    track.balloon.min,
    track.balloon.max
  );
  const months = clamp(
    track.months.locked ? track.months.default : input.months,
    track.months.min,
    track.months.max
  );

  // Business/partner: the down-payment is the fixed VAT component (no slider).
  // Private: the flexible 0%–50% slider, unchanged.
  const vatDown = input.type === "business" || input.type === "partner";
  let downPct: number;
  let downAmount: number;
  if (vatDown) {
    downAmount = vatDownPayment(effectivePrice);
    downPct = effectivePrice > 0 ? Math.round((downAmount / effectivePrice) * 100) : 0;
  } else {
    downPct = clamp(
      track.down.locked ? track.down.default : input.downPct,
      track.down.min,
      track.down.max
    );
    downAmount = Math.round(effectivePrice * (downPct / 100));
  }
  const balloonAmount = Math.round(effectivePrice * (balloonPct / 100));
  const financedAmount = Math.max(effectivePrice - downAmount - balloonAmount, 0);

  // FLOOR, NOT ROUND — AND A FINAL INSTALMENT THAT CLOSES THE GAP.
  //
  // `Math.round(financedAmount / months)` was the whole schedule, and it did not add
  // up. ENUMERATED over the entire reachable private-track space on 2026-09-10 —
  // 3 prices × 51 down-payment steps × 16 terms = 2,448 configurations:
  //
  //     exact  (months × monthly === financed) :   531  (21.7%)
  //     OVER   (the buyer pays MORE)           : 1,068  (43.6%)
  //     under                                  :   849  (34.7%)
  //     worst OVER: 19,900 ₪ · 1% down · 18 months → financed 19,701, monthly 1,095,
  //                 18 × 1,095 = 19,710 — nine shekels of nothing.
  //
  // The panel shows "יתרה למימון" and "× N תשלומים" four rows apart, under a heading
  // that says "0% ריבית · ללא הצמדה". In 43.6% of what a buyer can drag the sliders
  // to, multiplying the two contradicted that heading in the direction that reads as
  // hidden interest. "משוער" disclosed it; it did not make it true.
  //
  // Flooring makes every REGULAR instalment at most the buyer's fair share, and the
  // final one carries the remainder — which is how an instalment plan is actually
  // written. The identity below is exact for every configuration, by construction,
  // and test/simulatorPricing.test.ts enumerates all 2,448 to prove it.
  const monthlyPayment = months > 0 ? Math.floor(financedAmount / months) : 0;
  const finalPayment = months > 0 ? financedAmount - monthlyPayment * (months - 1) : 0;

  return {
    basePrice: input.basePrice,
    discountPct,
    effectivePrice,
    downPct,
    downAmount,
    balloonPct,
    balloonAmount,
    financedAmount,
    months,
    monthlyPayment,
    finalPayment
  };
}

export function ils(n: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(n);
}
