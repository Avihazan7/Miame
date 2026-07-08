import { Quote, ils } from "./finance";
import { getUtm, hasUtm, type Utm } from "./utm";

/** Append the campaign attribution to a WhatsApp message so the rep sees the source. */
function campaignLines(u: Utm = getUtm()): string[] {
  if (!hasUtm(u)) return [];
  const bits = [u.utm_source, u.utm_medium, u.utm_campaign].filter(Boolean).join(" / ");
  const lines = bits ? [`קמפיין: ${bits}`] : [];
  if (u.utm_term) lines.push(`מילת מפתח: ${u.utm_term}`);
  return lines;
}

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "972547477477";

export function buildWhatsAppUrl(message: string): string {
  const num = WHATSAPP_NUMBER.replace(/[^\d]/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export interface LeadMessageInput {
  fullName: string;
  phone: string;
  customerLabel: string;
  modelName: string;
  quote: Quote;
  source: string;
}

export function buildLeadMessage(input: LeadMessageInput): string {
  const { quote } = input;
  const lines = [
    "שלום, אני מעוניין בהצעת תשלום מ-MiaMe.",
    "",
    `דגם: ${input.modelName}`,
    `מחיר: ${ils(quote.basePrice)}`
  ];

  if (quote.discountPct > 0) {
    lines.push(`הנחת שותף: ${quote.discountPct}% (${ils(quote.effectivePrice)})`);
  }

  lines.push(
    `סוג לקוח: ${input.customerLabel}`,
    `מקדמה: ${quote.downPct}% (${ils(quote.downAmount)})`
  );

  lines.push(
    `תקופה: ${quote.months} תשלומים`,
    `תשלום חודשי משוער: ${ils(quote.monthlyPayment)}`,
    ""
  );

  if (input.fullName) lines.push(`שם: ${input.fullName}`);
  if (input.phone) lines.push(`טלפון: ${input.phone}`);
  lines.push(`מקור: ${input.source}`);
  lines.push(...campaignLines());

  return lines.join("\n");
}

export function buildPartnerMessage(name: string, phone: string, city: string): string {
  return [
    "שלום, אני מעוניין להפוך ל-MiaMe Hub.",
    "",
    name ? `שם: ${name}` : "",
    phone ? `טלפון: ${phone}` : "",
    city ? `עיר: ${city}` : "",
    "מקור: עמוד שותפים",
    ...campaignLines()
  ]
    .filter(Boolean)
    .join("\n");
}
