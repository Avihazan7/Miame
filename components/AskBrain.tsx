"use client";

import { useState, useRef, useEffect } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
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
  { keys: ["טווח", "קילומטר", 'ק"מ', "range"], a: 'הטווח: שימוש ריאלי עד 100 ק"מ, נתון יצרן עד 120 ק"מ. הסוללה נשלפת וניתנת להחלפה להגדלת הטווח.' },
  { keys: ["מחיר", "עולה", "כמה", "price"], a: "המחירים: 4×2 החל מ-19,900 ₪ · 2×4 Long Range מ-21,900 ₪ · 4×4 מ-27,900 ₪. אפשר לבנות הצעת תשלום בסימולטור." },
  { keys: ["מנוע", "הספק", "וואט", "motor"], a: "2 או 4 מנועי BLDC, 1,800W כל אחד — עוצמה לכל תוואי." },
  { keys: ["סוללה", "battery", "ליתיום"], a: 'סוללת ליתיום נשלפת 60V, קיבולת 25/35Ah (תאי LG 21700), משקל כ-6.3 ק"ג.' },
  { keys: ["מהירות", "speed", 'קמ"ש'], a: 'מהירות מרבית 12 קמ"ש, מותאם לתקנות הקלנועית בישראל (תקן EN17128).' },
  { keys: ["משקל", "weight"], a: 'משקל הכלי 42 ק"ג (דגם 4×2), עומס עד 136 ק"ג.' },
  { keys: ["השכר", "שעה", "rental", "hub"], a: "השכרה החל מ-50 ₪ לשעה דרך רשת MiaMe Hub. רוצים להיות שותף? 13% Success Fee מהפניות בלבד." },
  { keys: ["שותף", "partner"], a: "מודל MiaMe Hub: אתם מחזיקים את הצי, אנחנו מביאים את הביקוש — 13% Success Fee מהפניות בלבד, ללא עלות קבועה." },
  { keys: ["שירות", "תחזוק", "אחריות", "חלפים"], a: 'יבואן רשמי MEU · Mayer Electric Utilities, חנות דגל באליעזר קפלן 21 ת"א, שירות וחלפים בכל הארץ.' },
  { keys: ["סבסוד", "נכה", 'צה"ל', "ביטחון", "שכול"], a: 'כוחות הביטחון: נכי צה"ל עד 100% מוכר לסבסוד; משפחות שכולות עד 17,988 ₪ + מענק הוקרה MEU 10% — בכפוף לאישור משרד הביטחון.' },
  { keys: ["מימון", "תשלום", "ריבית", "מקדמה", "תשלומים"], a: "מסלולי תשלום ב-0% ריבית (בכפוף לאישור): עד 18 תשלומים ללא ריבית והצמדה. בנו הצעה בסימולטור תוך דקה." }
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
      text: "היי! אני העוזר החכם של MiaMe 🛵 שאלו אותי כל דבר על מיה פור — טווח, מחיר, השכרה, שירות או סבסוד."
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
      answer = faqAnswer(question) || "שאלה מצוינת — בואו נמשיך בוואטסאפ ונענה על הכל במהירות 🙂";
    }
    setMsgs((m) => [...m, { role: "bot", text: answer, source }]);
    setBusy(false);
  }

  const waUrl = buildWhatsAppUrl("היי MiaMe, יש לי שאלה על מיה פור 🛵");

  return (
    <section className="block ask-sec" id="ask">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">עוזר חכם</div>
          <h2 className="sec-title">שאל/י את MiaMe על מיה פור</h2>
          <p className="sec-desc">
            תשובות מיידיות על מפרט, מחיר, השכרה, שירות וסבסוד — מבוסס מוח U.M.M.
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

          <a className="chat3d-wa" href={waUrl} target="_blank" rel="noopener noreferrer">
            <WaIcon size={16} /> מעדיפים אדם? דברו איתנו בוואטסאפ
          </a>
        </div>
      </div>
    </section>
  );
}
