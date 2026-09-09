"use client";

import { useState, useRef, useEffect } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { MODELS } from "@/lib/models";
import { SPYQE, SPYQE_SPEC, SPYQE_BALANCE, SPYQE_TOTAL } from "@/lib/spyqe";
import { TRACKS } from "@/lib/finance";
import { track } from "@/lib/analytics";
import MiaMark from "./MiaMark";
import WaIcon from "./WaIcon";

interface Msg {
  role: "user" | "bot";
  text: string;
  source?: string;
}

// The rental chip was removed with the product on 2026-09-02. A suggested question
// is a promise that an answer exists — offering one the brain can no longer answer
// is worse than both states it sits between: it invites the visitor to ask, then
// fails them. Replaced with a question the corpus does answer.
const SUGGESTIONS = ["מה הטווח?", "כמה עולה?", "מה זה מיה פור?", "סבסוד לכוחות הביטחון?"];

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
  // Rental, the Eilat fleet and the MiaMe Hub partnership were removed here on
  // 2026-09-02 by owner decision: the business is marketing and selling MIA FOUR,
  // and nothing else. They were not stale copy — they were three answers the brain
  // gave a buyer about products that do not exist, which is worse than silence.
  { keys: ["שירות", "תחזוק", "אחריות", "חלפים"], a: "יבואן רשמי MEU · Mayer Electric Utilities. אחריות יבואן רשמי, שירות וחלפים מקוריים, ומסירה מתואמת בכל אזורי הארץ." },
  // NO FIGURES. This row used to read: 'כוחות הביטחון: נכי צה"ל עד 100% מוכר
  // לסבסוד; משפחות שכולות עד 17,988 ₪ + מענק הוקרה MEU 10%, בכפוף לאישור משרד
  // הביטחון.' — word for word the sentence the owner ordered removed on 2026-09-09.
  //
  // supabase/migrations/20260909140000_knowledge_subsidy_no_figures.sql carries that
  // decision in full: "להסיר מספרים לגמרי", because the corpus was telling a
  // disabled veteran that the Ministry of Defence RECOGNISES the full price, while
  // the legally reviewed text in components/Tribute.tsx says it recognises up to
  // 90% and the remaining tenth is a discretionary importer gift that "ניתן לשינוי
  // או להפסקה בכל עת". The migration fixed the RETRIEVAL CORPUS. It did not fix
  // this file — and this is the OTHER path the brain answers from, the one that
  // fires when retrieval returns nothing or the provider is down. So the exact
  // sentence that was withdrawn for a compliance reason was still being handed to
  // the visitor, on the failure path, where nobody was looking.
  //
  // The migration's own reasoning applies unchanged here: "on entitlement content
  // the only safe failure mode is saying less" — a figure the brain does not hold
  // is a figure it cannot get wrong. The tracks are named, the personal check is
  // offered, and the two official mod.gov.il pages are where the real numbers live.
  // The SITE is untouched: Tribute.tsx keeps its reviewed figures. This narrows
  // what the CHAT says, and only that.
  {
    keys: ["סבסוד", "נכה", 'צה"ל', "ביטחון", "שכול", "זכאות", "שיקום", "ניידות"],
    a: 'לזכאי כוחות הביטחון יש שני מסלולים נפרדים: אגף השיקום לנכי צה"ל וכוחות הביטחון, ואגף משפחות והנצחה לבני משפחות שכולות. הזכאות והיקף המימון נקבעים על ידי משרד הביטחון בלבד, ואישור עקרוני נדרש לפני הרכישה. נשמח לבדוק התאמה אישית בוואטסאפ, בלי התחייבות. כל הפרטים בעמוד הזכאות באתר.',
  },
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
      text: "היי, כאן MiaMe. שאלו אותי כל דבר על מיה פור, טווח, מחיר, מימון, שירות או סבסוד. החופש שלכם מתחיל בשאלה טובה."
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
            תשובות מיידיות על מפרט, מחיר, מימון, שירות וסבסוד, מבוסס מוח U.M.M.
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

          {/* role="log" is the correct role for an append-only transcript, and it is
              what makes an arriving answer reachable: focus stays in the input, the
              answer is appended here, and without a live region a screen-reader user
              gets silence. Configurator.tsx already does this for the recalculated
              monthly payment — the pattern existed and was simply not applied here. */}
          <div className="chat3d-body" role="log" aria-live="polite" aria-relevant="additions text">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "bub user" : "bub bot"}>
                <div className="bub-txt">{m.text}</div>
                {m.source ? <div className="bub-src">מקור: {m.source}</div> : null}
              </div>
            ))}
            {busy && (
              <div className="bub bot">
                {/* The three dots are decoration with no text; a reader announced
                    nothing at all while the answer was being composed. */}
                <span className="sr-only" role="status">מנסח תשובה…</span>
                <div className="typing" aria-hidden="true">
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
