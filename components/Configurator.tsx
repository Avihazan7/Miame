"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODELS, getModel } from "@/lib/models";
import { setAmbienceTilt } from "@/lib/ambience";
import { hueShiftFor, AMBIENCE_BASE_TILT } from "@/lib/model-ambience";
import { WARRANTY_MONTHS } from "@/lib/content";
import {
  CustomerType,
  TRACKS,
  computeQuote,
  ils
} from "@/lib/finance";
import {
  buildWhatsAppUrl,
  buildLeadMessage
} from "@/lib/whatsapp";
import { saveLead, LeadRecord } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { getUtm, utmTag } from "@/lib/utm";
import Image from "next/image";
import WaIcon from "./WaIcon";

/* count-up animation, strict-mode safe (cancelable rAF, continues from last shown value) */
function useCountUp(target: number, duration = 520): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayRef.current;
    const to = target;
    if (from === to) return;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (to - from) * eased);
      displayRef.current = val;
      setDisplay(val);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

// ONE TRACK. The sales campaign runs a single, unambiguous offer: a flexible
// down-payment plus up to 18 payments, 0% interest, no indexation. The customer-type
// tabs (פרטי/עסקי/שותף) and the Eilat price zone are gone from the UI.
//
// The id stays a real `CustomerType` member so every downstream contract is
// untouched: computeQuote (lib/finance.ts), LeadRecord.customer_type
// (lib/supabase.ts → Supabase `leads`), the WhatsApp lead message, and the
// /api/deal payload all keep the exact shape they had before.
const TRACK_ID: CustomerType = "private";

// The instalment ceiling is a term of the offer, not a phrase. Five strings on
// this screen quote it, so it is read from the rule computeQuote() actually
// clamps `months` against (lib/finance.ts): a hand-typed "18" keeps promising a
// term the simulator has already stopped honouring.
const MAX_MONTHS = TRACKS[TRACK_ID].months.max;

/** What every MIA FOUR deal includes, whatever the buyer drags the sliders to.
    Each line is a fact stated elsewhere on the page (Specs, LegalStatus, Patents,
    the importer band) — not a superlative. */
const SIM_ASSURANCES: { k: string; v: string }[] = [
  { k: "אחריות יבואן רשמי", v: `MEU · שירות וחלפים מקוריים, ${WARRANTY_MONTHS} חודשים` },
  { k: "פלטפורמה מוגנת פטנט", v: "ארבעה גלגלים, מתלים עצמאיים, בלימה הידראולית כפולה" },
  { k: "תקן EN17128", v: "מותאמת לתקנות הקלנועית בישראל, בלי רישוי ובלי אגרות" },
  { k: "מסירה בכל הארץ", v: "מתואמת אתכם מראש מול נציג" },
];

/** Stable, anonymous per-visitor id (charset matches the brain's ref validation). */
function visitorRef(): string {
  if (typeof window === "undefined") return "anon";
  try {
    let r = localStorage.getItem("miame_ref");
    if (!r) {
      r = "miame-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem("miame_ref", r);
    }
    return r;
  } catch {
    return "anon";
  }
}

/** Fire a behavioural signal at the central brain (best-effort, never blocks UI). */
function emitSignal(signal: string): void {
  try {
    void fetch("/api/signal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ref: visitorRef(), signal }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw from analytics */
  }
}

/** The sealed Deal Score the brain returns — headline only (no weights). */
interface SealedScore {
  score: number;
  grade: "A" | "B" | "C" | "D";
  reasons: string[];
}

export default function Configurator() {
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const [downPct, setDownPct] = useState<number>(TRACKS.private.down.default);
  const balloonPct = 0; // תשלום בתום התקופה (בלון) בוטל, נשאר 0 לתאימות ה-API/ליד.
  const [months, setMonths] = useState<number>(TRACKS.private.months.default);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hp, setHp] = useState(""); // honeypot — humans never see or fill it
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [score, setScore] = useState<SealedScore | null>(null);

  const model = getModel(modelId);
  const track_ = TRACKS[TRACK_ID];
  const quote = computeQuote({
    basePrice: model.price,
    type: TRACK_ID,
    downPct,
    balloonPct,
    months
  });
  const animatedMonthly = useCountUp(quote.monthlyPayment);

  useEffect(() => {
    track("PageViewed", { page: "home" });
  }, []);

  // The selected model publishes a hue TILT and the whole page's ambient light
  // leans with it (lib/model-ambience.ts). It follows `modelId` rather than
  // living inside selectModel() so the initial model is lit on mount too, and so
  // any future path that changes the model — a deep link, a restored draft —
  // cannot forget to light it.
  useEffect(() => {
    setAmbienceTilt(hueShiftFor(modelId));
  }, [modelId]);

  // AmbientLight is mounted in app/layout.tsx and survives client navigation;
  // this component does not. Without the release, leaving the homepage would
  // leave /eligibility and the legal pages lit for a model they never show.
  useEffect(() => () => setAmbienceTilt(AMBIENCE_BASE_TILT), []);

  function selectModel(id: string, scroll = false) {
    setModelId(id);
    setSent(false);
    track("ModelSelected", { modelId: id });
    emitSignal("view_specs"); // viewing a model's specs → central Big Five nudge
    if (scroll && typeof document !== "undefined") {
      document.getElementById("sim")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function emitChange(field: string) {
    track("SimulatorChanged", {
      field,
      type: TRACK_ID,
      modelId,
      downPct,
      balloonPct,
      months,
      monthly: quote.monthlyPayment
    });
    emitSignal("compare_many"); // actively tuning the deal → conscientiousness nudge
  }

  function openDeal(intent: string, evt: "LeadSubmitted" | "WhatsAppClicked") {
    const digits = phone.replace(/[^\d]/g, "");
    // A valid phone is the whole point — without it there is no lead to capture.
    // Block here so we never fire a "lead" event or open WhatsApp with no contact
    // (which previously produced LeadSubmitted events with zero saved leads).
    if (digits.length < 9) {
      setPhoneError(true);
      setSent(false);
      return;
    }
    setPhoneError(false);
    // Honeypot tripped → a bot filled the hidden field. Mimic success (so the bot
    // learns nothing) without saving, tracking, or opening WhatsApp.
    if (hp.trim() !== "") {
      setSent(true);
      return;
    }
    if (digits.length >= 9) {
      const utm = getUtm();
      const lead: LeadRecord = {
        full_name: name.trim(),
        phone: phone.trim(),
        customer_type: track_.label,
        model_name: model.name,
        base_price: quote.basePrice,
        down_payment: quote.downAmount,
        balloon: quote.balloonAmount,
        months: quote.months,
        monthly_payment: quote.monthlyPayment,
        // Attribution rides in `source` — no new Supabase column (schema unchanged).
        source: `miame-web · ${intent} · nationwide · ${utmTag(utm)}`,
        ...utm
      };
      void saveLead(lead);
      // Additively feed the built deal into the U.M.M central brain (tenant +
      // server-side scoring). Best-effort: the WhatsApp + Supabase funnel above
      // already fired, so a brain hiccup never costs us the lead.
      try {
        void fetch("/api/deal", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ref: visitorRef(),
            model: model.name,
            customerType: TRACK_ID,
            quote: {
              basePrice: quote.basePrice,
              effectivePrice: quote.effectivePrice,
              downAmount: quote.downAmount,
              balloonAmount: quote.balloonAmount,
              monthlyPayment: quote.monthlyPayment,
              months: quote.months
            },
            contact: { name: name.trim(), phone: phone.trim() }
          })
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.score) setScore(d.score as SealedScore);
          })
          .catch(() => {});
      } catch {
        /* never block the funnel */
      }
    }
    void track(evt, { modelId, type: TRACK_ID, monthly: quote.monthlyPayment, intent });

    const url = buildWhatsAppUrl(
      buildLeadMessage({
        fullName: name.trim(),
        phone: phone.trim(),
        customerLabel: track_.label,
        modelName: model.name,
        quote,
        source: "אתר MiaMe · " + intent
      })
    );
    if (typeof window !== "undefined") window.open(url, "_blank");
    setSent(true);
    // Dedicated confirmation URL (task-pack: עמוד תודה): WhatsApp opened in a new
    // tab; this tab lands on /thank-you so ad platforms get a real destination.
    router.push("/thank-you");
  }

  return (
    <>
      {/* ===== models ===== */}
      <section className="block models-sec" id="models">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">שלושה דגמים · פלטפורמה אחת</div>
            <h2 className="sec-title">בחרו את הדגם שלכם</h2>
            <p className="sec-desc">
              כל דגם על אותה פלטפורמת ארבעה גלגלים מוגנת פטנט, עם אותה אחריות יבואן רשמי.
              לחצו על דגם כדי לטעון אותו בסימולטור ולקבל תשלום חודשי משוער מיידית.
            </p>
          </div>

          <div className="cards">
            {MODELS.map((m, i) => {
              const selected = m.id === modelId;
              const best = i === 1;
              return (
                <article
                  key={m.id}
                  className={selected ? "card sel" : "card"}
                >
                  <div className="card-stage">
                    {best && <span className="card-badge best">הכי מבוקש</span>}
                    {!best && i === 2 && <span className="card-badge">פרימיום</span>}
                    {/* One photograph, three cards. The file is the 4×4 Pro Max —
                        the vehicle_media_assets row this cover belongs to is
                        registered as Mia FOUR "X4", and every other surface that
                        uses an x4 file names 4×4 Pro Max in its own alt. So an
                        alt of m.name told a screen-reader user it was looking at
                        a 2×4 City on two of the three cards: a claim about pixels
                        that are not that vehicle, which is a factual defect rather
                        than a nit. The card's own name is rendered as text directly
                        below the image, so the alt is free to describe what is
                        actually shown. Photograph the two City models and this goes
                        back to being m.name — that is a sourcing decision, not a
                        code one.

                        And it names NO trim, which is the second half of the fix: an
                        alt reading "4×4 Pro Max" is true about the pixels but then
                        contradicts the card it sits in, so a screen-reader user on
                        the 2×4 City card hears one vehicle from the image and another
                        from the heading directly under it. Describing the platform —
                        true of all three cards, asserting nothing about which model
                        this one is — is the only version that is not wrong somewhere. */}
                    <Image
                      src="/mia-four-x4-hero.webp"
                      alt="קלנועית MIA FOUR, צילום סטודיו של פלטפורמת ארבעת הגלגלים"
                      width={774}
                      height={860}
                      className="card-veh"
                    />
                  </div>
                  <div className="card-body">
                    <div className="card-name" dir="ltr">{m.name}</div>
                    <div className="card-tagline">{m.tagline}</div>
                    <div className="card-specs">
                      {m.highlights.map((h) => (
                        <span className="spec" key={h}>
                          {h}
                        </span>
                      ))}
                    </div>
                    <div className="card-price">
                      <div className="price-from">החל מ-</div>
                      <div className="price-num">
                        <span className="cur">₪</span>
                        {m.price.toLocaleString("he-IL")}
                      </div>
                    </div>
                    <div className="card-cta">
                      <button
                        className="btn btn-ghost btn-block"
                        onClick={() => selectModel(m.id, true)}
                      >
                        {selected ? "נטען בסימולטור ✓" : "בחר והרץ סימולציה"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== simulator ===== */}
      <section className="block sim-sec" id="sim">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">סימולטור תשלומים</div>
            <h2 className="sec-title">בנו את העסקה שלכם</h2>
            <p className="sec-desc">
              מסלול אחד, ברור: בוחרים דגם, קובעים מקדמה, ופורסים עד {MAX_MONTHS} תשלומים ללא ריבית והצמדה.
            </p>
          </div>

          <div className="sim">
            {/* controls */}
            <div className="sim-controls">
              <div className="zero-interest-pill">
                עד {MAX_MONTHS} תשלומים ללא ריבית והצמדה
              </div>

              <div className="model-pick">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    className={m.id === modelId ? "mp on" : "mp"}
                    aria-pressed={m.id === modelId}
                    onClick={() => selectModel(m.id)}
                  >
                    <div className="mp-n" dir="ltr">{m.name}</div>
                    <div className="mp-p">{ils(m.price)}</div>
                  </button>
                ))}
              </div>

              {/* down payment — one track: a flexible 0%–50% slider */}
              <div className="field">
                <div className="field-top">
                  <span className="field-label" id="down-label">מקדמה</span>
                  <span className="field-val">
                    {downPct}% · {ils(quote.downAmount)}
                  </span>
                </div>
                <input
                  className="rng"
                  type="range"
                  aria-labelledby="down-label"
                  aria-describedby="down-note"
                  aria-valuetext={`${downPct}% · ${ils(quote.downAmount)}`}
                  min={track_.down.min}
                  max={track_.down.max}
                  step={track_.down.step}
                  value={downPct}
                  onChange={(e) => setDownPct(Number(e.target.value))}
                  onMouseUp={() => emitChange("down")}
                  onTouchEnd={() => emitChange("down")}
                  onKeyUp={() => emitChange("down")}
                />
                <div className="field-note" id="down-note">
                  מקדמה גמישה מ-{track_.down.min}% עד {track_.down.max}%
                </div>
              </div>

              {/* months */}
              <div className="field">
                <div className="field-top">
                  <span className="field-label" id="months-label">מספר התשלומים</span>
                  <span className="field-val">{months} תשלומים</span>
                </div>
                <input
                  className="rng"
                  type="range"
                  aria-labelledby="months-label"
                  aria-describedby="months-note"
                  aria-valuetext={`${months} תשלומים`}
                  min={track_.months.min}
                  max={track_.months.max}
                  step={track_.months.step}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  onMouseUp={() => emitChange("months")}
                  onTouchEnd={() => emitChange("months")}
                  onKeyUp={() => emitChange("months")}
                />
                <div className="field-note" id="months-note">
                  {track_.months.min} עד {track_.months.max} תשלומים · ללא ריבית והצמדה
                </div>
              </div>

              <ul className="sim-assure" aria-label="מה נכלל בכל עסקה">
                {SIM_ASSURANCES.map((a) => (
                  <li key={a.k}>
                    <b>{a.k}</b>
                    <span>{a.v}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* result */}
            <div className="sim-result">
              <Image
                src="/mia-four-x4-hero.webp"
                alt="MIA FOUR קלנועית חשמלית ארבעה גלגלים"
                width={774}
                height={860}
                className="res-product"
              />
              {/* 1600×599 shipped whole into a box that is `min(178px,48%)` wide —
                  a ~9× oversupply on every simulator render, with no srcset because
                  it was a raw <img>. `sizes="178px"` is the CSS cap, so the
                  optimizer can serve the 256px candidate and stop. */}
              <Image
                src="/mia-four-logo.webp"
                alt="MIA FOUR"
                className="res-logo"
                loading="lazy"
                sizes="178px"
                width={1600}
                height={599}
              />
              <div className="res-eyebrow">עד {MAX_MONTHS} תשלומים ללא ריבית והצמדה</div>
              <div className="res-model">
                <bdi dir="ltr">{model.name}</bdi>
              </div>
              <div className="res-monthly" aria-live="polite" aria-atomic="true">
                <span className="cur">₪</span>
                <span className="num">{animatedMonthly.toLocaleString("he-IL")}</span>
                <span className="per">לחודש · {months} תשלומים</span>
              </div>

              <div className="res-badges">
                <span className="res-badge accent">0% ריבית</span>
                <span className="res-badge">ללא הצמדה</span>
                <span className="res-badge">עד {MAX_MONTHS} תשלומים</span>
                <span className="res-badge">Free Feel</span>
              </div>

              <div className="res-line" />

              <div className="res-grid">
                <div className="res-cell">
                  <div className="k">מחיר מלא</div>
                  <div className="v">{ils(quote.basePrice)}</div>
                </div>
                <div className="res-cell">
                  <div className="k">מקדמה ({downPct}%)</div>
                  <div className="v">{ils(quote.downAmount)}</div>
                </div>
                <div className="res-cell">
                  <div className="k">יתרה למימון</div>
                  <div className="v">{ils(quote.financedAmount)}</div>
                </div>
                <div className="res-cell">
                  <div className="k">תקופה</div>
                  <div className="v">{months} ח׳</div>
                </div>
              </div>

              {/* lead */}
              <div className="lead">
                {/* Honeypot: hidden from humans and AT; bots that fill every field trip it */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  // RTL-safe off-screen: clip in place (left:-9999px overflows in dir="rtl").
                  style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap", border: 0, opacity: 0 }}
                />
                <div className="lead-row">
                  <input
                    className="inp"
                    placeholder="שם מלא"
                    aria-label="שם מלא"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className={phoneError ? "inp inp-error" : "inp"}
                    placeholder="טלפון"
                    aria-label="מספר טלפון"
                    aria-invalid={phoneError}
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(false);
                    }}
                  />
                </div>
                {phoneError && (
                  <div className="lead-err" role="alert">
                    נא להזין מספר טלפון תקין כדי שנחזור אליכם
                  </div>
                )}
                <div className="cta-stack">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => openDeal("אישור עסקה", "LeadSubmitted")}
                  >
                    בדיקת התאמה בוואטסאפ
                  </button>
                  <button
                    className="btn btn-light btn-block"
                    onClick={() => openDeal("שיחה", "WhatsAppClicked")}
                  >
                    <WaIcon size={20} />
                    דברו איתי בוואטסאפ
                  </button>
                </div>
                <p className="lead-consent">
                  בלחיצה על שליחה אני מאשר/ת יצירת קשר טלפוני ובוואטסאפ בנוגע לפנייתי, בהתאם ל
                  <a href="/legal/privacy">מדיניות הפרטיות</a>.
                </p>
                <p className="disclaimer">
                  הסימולטור להמחשה בלבד. עד {MAX_MONTHS} תשלומים ללא ריבית והצמדה בכפוף לאישור עסקה, זמינות מלאי ותנאי החברה/היבואן. האתר אינו מהווה התחייבות לאישור מימון.
                </p>
                {sent && <div className="lead-ok">נפתחה שיחת וואטסאפ ✓ נחזור אליכם מיד</div>}
                {score && (
                  // Sealed headline ONLY — score + grade. The brain's `reasons` are
                  // deliberately NOT rendered: components, weights and thresholds of
                  // the Deal Score never reach a public surface.
                  <div
                    className="res-badge accent"
                    style={{ marginTop: 12, alignSelf: "flex-start" }}
                  >
                    ציון עסקה {score.grade} · {score.score}/100
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
