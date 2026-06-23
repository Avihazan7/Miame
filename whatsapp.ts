import { Quote, ils } from "./finance";

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "972500000000";

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

  if (quote.balloonAmount > 0) {
    lines.push(`תשלום בלון: ${quote.balloonPct}% (${ils(quote.balloonAmount)})`);
  }

  lines.push(
    `תקופה: ${quote.months} תשלומים`,
    `תשלום חודשי משוער: ${ils(quote.monthlyPayment)}`,
    ""
  );

  if (input.fullName) lines.push(`שם: ${input.fullName}`);
  if (input.phone) lines.push(`טלפון: ${input.phone}`);
  lines.push(`מקור: ${input.source}`);

  return lines.join("\n");
}

export function buildPartnerMessage(name: string, phone: string, city: string): string {
  return [
    "שלום, אני מעוניין להפוך ל-MiaMe Hub.",
    "",
    name ? `שם: ${name}` : "",
    phone ? `טלפון: ${phone}` : "",
    city ? `עיר: ${city}` : "",
    "מקור: עמוד שותפים"
  ]
    .filter(Boolean)
    .join("\n");
}
