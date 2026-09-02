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

/**
 * Israel's country code. The sales line is Israeli, so a value configured in
 * local form ("054…") is completed with this rather than rejected.
 */
const COUNTRY_CODE = "972";

/**
 * The number as configured — the one place the funnel's wa.me and tel: links derive
 * from. NOT the only place the digits appear in the tree, and saying so would be
 * false: `lib/content.ts` still exports SALES_WHATSAPP as its own literal (pinned by
 * test/salesCampaign.test.ts), `app/layout.tsx` prints a third spelling
 * "+972-54-747-7477" inside the contactPoint JSON-LD — the form search and answer
 * engines actually read — and `public/llms.txt` prints a fourth with no import
 * mechanism at all. Those three are open debt, carried in test/whatsappFunnel.test.ts
 * as a shrink-only allowlist rather than as prose nobody re-reads.
 */
const CONFIGURED_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "972547477477";

/**
 * Collapse anything a human might put in the env var to a bare international MSISDN.
 *
 * wa.me takes digits only, in full international form, and it validates nothing:
 * handed "0547477477" it opens a chat with a number that does not exist, so the
 * whole funnel dead-ends in the one place no dashboard is watching. Everything a
 * person actually types — "+972-54-747-7477", "054 747 7477", "00972547477477" —
 * has to land on the same digits.
 */
export function normalizeMsisdn(raw: string, countryCode: string = COUNTRY_CODE): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2); // 00-prefixed international dialling
  if (digits.startsWith("0")) return countryCode + digits.slice(1); // local trunk 0 → country code
  if (digits && digits.length <= 9 && !digits.startsWith(countryCode)) return countryCode + digits;
  return digits;
}

/** E.164 without the "+": 8–15 digits, no leading zero. What wa.me and tel: both need. */
export function isValidMsisdn(msisdn: string): boolean {
  return /^[1-9]\d{7,14}$/.test(msisdn);
}

/** The sales line. Every wa.me link, every tel: href and every printed number derives from it. */
export const WHATSAPP_NUMBER = normalizeMsisdn(CONFIGURED_NUMBER);

/**
 * E.164 alone is not enough for THIS line. A nine-digit value that happens to open
 * with "972" — "972123456" — normalises to itself, passes the generic 8–15 digit
 * rule, and produces a wa.me link that opens on a number belonging to nobody. An
 * Israeli MSISDN is the country code plus exactly nine digits; anything else under
 * that prefix is a typo wearing the right hat.
 */
function isPlausibleSalesLine(msisdn: string): boolean {
  if (!isValidMsisdn(msisdn)) return false;
  if (!msisdn.startsWith(COUNTRY_CODE)) return true;
  return msisdn.length === COUNTRY_CODE.length + 9;
}

if (!isPlausibleSalesLine(WHATSAPP_NUMBER)) {
  const detail = `NEXT_PUBLIC_WHATSAPP_NUMBER=${JSON.stringify(CONFIGURED_NUMBER)} → ${JSON.stringify(WHATSAPP_NUMBER)}`;
  // Fail where somebody is watching. In production a broken link is bad but a
  // blank site is worse, so there we shout into the server log and keep serving;
  // in development and in CI this throws, because a silently dead sales line is
  // the most expensive defect this funnel can ship — nothing else about the page
  // looks wrong, and the lead simply never arrives.
  if (process.env.NODE_ENV === "production") {
    console.error(`[whatsapp] sales number is not a valid international MSISDN — wa.me links reach nobody. ${detail}`);
  } else {
    throw new Error(`[whatsapp] sales number is not a valid international MSISDN: ${detail}. Expected international form, e.g. "972547477477".`);
  }
}

/** E.164 with the "+" — the form structured data and dialers expect. */
export const SALES_PHONE_E164 = `+${WHATSAPP_NUMBER}`;

/** Ready-made `tel:` href, so no page has to concatenate the scheme itself. */
export const SALES_PHONE_TEL = `tel:${SALES_PHONE_E164}`;

/**
 * How the number is PRINTED for a Hebrew-reading visitor: the local, dashed form
 * they would dial. Derived rather than typed — a page that prints one number and
 * links to another is how a legal page ends up naming a line nobody answers.
 */
export const SALES_PHONE_DISPLAY = formatIsraeliDisplay(WHATSAPP_NUMBER);

function formatIsraeliDisplay(msisdn: string): string {
  if (!msisdn.startsWith(COUNTRY_CODE)) return `+${msisdn}`;
  const national = `0${msisdn.slice(COUNTRY_CODE.length)}`;
  if (national.length !== 10) return `+${msisdn}`;
  return `${national.slice(0, 3)}-${national.slice(3, 6)}-${national.slice(6)}`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * The same link, with the campaign appended to the message the rep will read.
 *
 * Call it from a CLICK HANDLER, never during render. The attribution lives in
 * localStorage, so it exists only in the browser: a component that built its
 * href from it while rendering would emit one URL on the server and a different
 * one on the client and trip hydration. The server-rendered href stays plain and
 * this replaces it at the moment of the click — the only moment the campaign is
 * both known and still worth carrying. Nothing leaves the device: this is the
 * message TEXT, not a tracking call.
 *
 * WHAT THIS DOES NOT COVER, said plainly rather than left to be discovered: the
 * anchor-based CTAs swap their own href inside the click handler, so a middle-click,
 * a Cmd/Ctrl-click, "copy link address" and a long-press share all follow the
 * SERVER-rendered href and carry no campaign. A button that calls window.open
 * (components/seo/SeoCta.tsx) has no such escape. The gap is small and it is not
 * silent — it is written here.
 */
export function buildCampaignWhatsAppUrl(message: string, u: Utm = getUtm()): string {
  const lines = campaignLines(u);
  return buildWhatsAppUrl(lines.length ? [message, "", ...lines].join("\n") : message);
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
