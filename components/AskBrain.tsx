"use client";

import { useState, useRef, useEffect } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { MODELS } from "@/lib/models";
import { SPYQE, SPYQE_SPEC, SPYQE_BALANCE, SPYQE_TOTAL } from "@/lib/spyqe";
import { RENTAL_FROM, SUCCESS_FEE_PCT } from "@/lib/content";
import { FLEET_SIZE } from "@/lib/rental-fleet";
import { TRACKS } from "@/lib/finance";
import { track } from "@/lib/analytics";
import MiaMark from "./MiaMark";
import WaIcon from "./WaIcon";

interface Msg {
  role: "user" | "bot";
  text: string;
  source?: string;
}

const SUGGESTIONS = ["מה הטווח?", "כמה עולה?", "איך עובדת ההשכרה?", "סבסוד לכוחות הביטחון?"];

// Client-side fallback so the chat is useful instantly — before ANTHROPIC_API_KEY is
// set, or if the brain is briefly unreachable. Same facts as the Supabase corpus.
const FAQ: { keys: string[]; a: string }[] = [
  // FIRST on purpose. faqAnswer() scores by how many keys match and keeps the
  // EARLIEST row on a tie, so "מה הטווח של ספייק" — one hit on "טווח", one on
  // "ספייק" — used to be answered from MIA FOUR's range row. Every row below is a
  // MIA FOUR fact; putting the SPYQE row first is what makes a tie resolve to the
  // model the visitor actually named. Terms from lib/spyqe.ts, spec from the
  // manufacturer capture in SPYQE_SPEC — no MIA FOUR number can reach it.
  {
    keys: ["ספייק", "spyqe", "הזמנה מוקדמת"],
    a:
      `${SPYQE.nameHe} (${SPYQE.full}) נמכר בהזמנה מוקדמת ל-${SPYQE.slots} הנרשמים הראשונים: ` +
      `מקדמה ${SPYQE.deposit.toLocaleString("he-IL")} ₪ ליבואן בהרשמה, והיתרה ${SPYQE_BALANCE.toLocaleString("he-IL")} ₪ ` +
      `ב-${SPYQE.months} תשלומים של ${SPYQE.monthlyPayment} ₪ שמתחילים עם הגעת המשלוח למחסני היבואן — ` +
      `סה״כ ${SPYQE_TOTAL.toLocaleString("he-IL")} ₪ במקום מחיר יבואן ${SPYQE.listPrice.toLocaleString("he-IL")} ₪. ` +
      `אספקה משוערת עד ${SPYQE.deliveryBusinessDays} ימי עסקים מהמשלוח הראשון, הערכה ולא התחייבות. ` +
      `מפרט היצרן: ${SPYQE_SPEC.map((r) => `${r.label} ${r.value}`).join(" · ")}.`,
  },
  { keys: ["טווח", "קילומטר", 'ק"מ', "range"], a: 'הטווח: שימוש ריאלי עד 100 ק"מ, נתון יצרן עד 120 ק"מ. הסוללה נשלפת וניתנת להחלפה להגדלת הטווח.' },
  // "כמה עולה?" answered with MIA FOUR's three prices and nothing else, so a
  // visitor asking about ספייק — a different vehicle at roughly half the price,
  // sold as a pre-order on its own terms — was quoted the wrong model with full
  // confidence. That is precisely the cross-model hazard the SPYQE corpus rows
  // exist to prevent, and the offline path is where it survived. Each price now
  // names the model it belongs to and is read from that model's own source.
  {
    keys: ["מחיר", "עולה", "כמה", "price"],
    a:
      `מחירי MIA FOUR: ${MODELS.map((m) => `\u2066${m.name}\u2069 החל מ-${m.price.toLocaleString("he-IL")} ₪`).join(" · ")}. ` +
      `${SPYQE.nameHe} (${SPYQE.full}) הוא דגם נפרד בהזמנה מוקדמת: מקדמה ${SPYQE.deposit.toLocaleString("he-IL")} ₪ ליבואן, ` +
      `היתרה ${SPYQE_BALANCE.toLocaleString("he-IL")} ₪ ב-${SPYQE.months} תשלומים של ${SPYQE.monthlyPayment} ₪, ` +
      `סה״כ ${SPYQE_TOTAL.toLocaleString("he-IL")} ₪ במקום מחיר יבואן ${SPYQE.listPrice.toLocaleString("he-IL")} ₪. ` +
      `אפשר לבנות הצעת תשלום בסימולטור.`,
  },
  { keys: ["מנוע", "הספק", "וואט", "motor"], a: "2 או 4 מנועי BLDC, 1,800W כל אחד, עוצמה לכל תוואי." },
  { keys: ["סוללה", "battery", "ליתיום"], a: 'סוללת ליתיום נשלפת 60V, קיבולת 25/35Ah (תאי LG 21700), משקל כ-6.3 ק"ג.' },
  { keys: ["מהירות", "speed", 'קמ"ש'], a: 'מהירות מרבית 12 קמ"ש, מותאם לתקנות הקלנועית בישראל (תקן EN17128).' },
  { keys: ["משקל", "weight"], a: 'משקל הקלנועית 42 ק"ג (דגם ⁦2×4 City⁩), עומס עד 136 ק"ג.' },
  // "רשת MiaMe Hub" asserted a network. MEASURED 2026-09-01 against the live
  // database: public.partners holds 0 rows, so the network was a claim with
  // nothing behind it. MiaMe Hub is the model we are opening to operators — the
  // invitation is both true today and the stronger ask.
  { keys: ["השכר", "שעה", "rental", "hub"], a: `השכרה החל מ-${RENTAL_FROM} ₪ לשעה. MiaMe Hub הוא מודל השותפות שאנחנו פותחים למפעילים: אתם מחזיקים את הצי, MiaMe מביאה את הביקוש, ${SUCCESS_FEE_PCT}% Success Fee מהפניות בלבד.` },
  { keys: ["אילת", "eilat", "green extreme", "גרין אקסטרים", "טרמינל", "השכרה אילת"], a: `באילת: צי השכרה של ${FLEET_SIZE} כלי MIA FOUR ב-Green Extreme, החל מ-${RENTAL_FROM} ₪ לשעה. משריינים מראש בוואטסאפ. זמינות בזמן אמת תיפתח עם השלמת חיבור המעקב.` },
  { keys: ["שותף", "partner"], a: `מודל MiaMe Hub: אתם מחזיקים את הצי, אנחנו מביאים את הביקוש, ${SUCCESS_FEE_PCT}% Success Fee מהפניות בלבד, ללא עלות קבועה. אנחנו פותחים עכשיו את המקומות הראשונים למפעילים.` },
  { keys: ["שירות", "תחזוק", "אחריות", "חלפים"], a: "יבואן רשמי MEU · Mayer Electric Utilities. אחריות יבואן רשמי, שירות וחלפים מקוריים, ומסירה מתואמת בכל אזורי הארץ." },
  { keys: ["סבסוד", "נכה", 'צה"ל', "ביטחון", "שכול"], a: 'כוחות הביטחון: נכי צה"ל עד 100% מוכר לסבסוד; משפחות שכולות עד 17,988 ₪ + מענק הוקרה MEU 10%, בכפוף לאישור משרד הביטחון.' },
  { keys: ["מימון", "תשלום", "ריבית", "מקדמה", "תשלומים"], a: `מסלולי תשלום ב-0% ריבית (בכפוף לאישור): עד ${TRACKS.private.months.max} תשלומים ללא ריבית והצמדה. בנו הצעה בסימולטור תוך דקה.` }
];

function faqAnswer(q: string): string | null {
  const s = q.toLowerCase();
  let best: { a: string; n: number } | null = null;
  for (const f of FAQ) {
    const n = f.keys.filter((k) => s.includes(k.toLowerCase())).length;
    if (n > 0 && (!best || n > best.n)) best = { a: f.a, n };
  }
  return best ? best.a : null;
}

export default function AskBrain() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: "היי, כאן MiaMe. שאלו אותי כל דבר על מיה פור, טווח, מחיר, השכרה, שירות או סבסוד. החופש שלכם מתחיל בשאלה טובה."
    }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Keep the latest message in view by scrolling the chat box itself —
    // never scrollIntoView(), which would drag the whole page down to the
    // chat on first load and leave visitors mid-page instead of at the top.
    const box = endRef.current?.closest(".chat3d-body");
    if (box) box.scrollTop = box.scrollHeight;
  }, [msgs, busy]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setBusy(true);

    let answer = "";
    let source = "";
    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "question", payload: { message: question }, source: "web-chat" })
      });
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{ agent?: string; output?: unknown; notes?: unknown }>;
        };
        const list = data.results || [];
        const r = list.find((x) => x.agent === "concierge") || list[0];
        if (r && typeof r.output === "string" && r.output.trim()) {
          answer = r.output.trim();
          source = typeof r.notes === "string" ? r.notes : "";
        }
      }
    } catch {
      /* fall through to the local FAQ */
    }

    if (!answer) {
      answer = faqAnswer(question) || "שאלה טובה, בואו נמשיך בוואטסאפ ונענה על הכל במהירות. Free Feel.";
    }
    setMsgs((m) => [...m, { role: "bot", text: answer, source }]);
    setBusy(false);
  }

  const waUrl = buildWhatsAppUrl("היי MiaMe, יש לי שאלה על מיה פור 🦋");

  return (
    <section className="block ask-sec" id="ask">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">עוזר חכם</div>
          <h2 className="sec-title">שאל/י את MiaMe על מיה פור</h2>
          <p className="sec-desc">
            תשובות מיידיות על מפרט, מחיר, השכרה, שירות וסבסוד, מבוסס מוח U.M.M.
          </p>
        </div>

        <div className="chat3d">
          <div className="chat3d-bar">
            <span className="chat3d-mark">
              <MiaMark size={22} title="MiaMe" />
            </span>
            <span className="chat3d-title">MiaMe · עוזר חכם</span>
            <span className="chat3d-live">
              <i /> מבוסס-מקור
            </span>
          </div>

          <div className="chat3d-body">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "bub user" : "bub bot"}>
                <div className="bub-txt">{m.text}</div>
                {m.source ? <div className="bub-src">מקור: {m.source}</div> : null}
              </div>
            ))}
            {busy && (
              <div className="bub bot">
                <div className="typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat3d-chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chat3d-chip" onClick={() => ask(s)} disabled={busy} type="button">
                {s}
              </button>
            ))}
          </div>

          <form
            className="chat3d-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתבו שאלה על מיה פור…"
              aria-label="שאלה על מיה פור"
            />
            <button type="submit" className="chat3d-send" disabled={busy || !input.trim()} aria-label="שלח">
              ↑
            </button>
          </form>

          {/* The assistant's human handoff — a real sales CTA that fired no event,
              so every lead that gave up on the chat and asked for a person was
              invisible in the funnel. */}
          <a
            className="chat3d-wa"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void track("WhatsAppClicked", { placement: "ask-brain", intent: "inquiry" })}
          >
            <WaIcon size={16} /> מעדיפים אדם? דברו איתנו בוואטסאפ
          </a>
        </div>
      </div>
    </section>
  );
}
