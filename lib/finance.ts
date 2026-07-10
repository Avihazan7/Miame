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

const DOWN_RULE: SliderRule = { min: 0, max: 50, default: 50, step: 1, locked: false, hidden: false };
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
  monthlyPayment: number;
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
  const monthlyPayment = months > 0 ? Math.round(financedAmount / months) : 0;

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
    monthlyPayment
  };
}

export function ils(n: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  }).format(n);
}
