"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODELS, getModel } from "@/lib/models";
import {
  CustomerType,
  TRACKS,
  computeQuote,
  ils
} from "@/lib/finance";
import { getZonePrice, type PricingZone } from "@/lib/pricing-zones";
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

const TYPES: CustomerType[] = ["private", "business", "partner"];

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
  const [type, setType] = useState<CustomerType>("private");
  const [pricingZone, setPricingZone] = useState<PricingZone>("nationwide");
  const [downPct, setDownPct] = useState<number>(TRACKS.private.down.default);
  const balloonPct = 0; // תשלום בתום התקופה (בלון) בוטל — נשאר 0 לתאימות ה-API/ליד.
  const [months, setMonths] = useState<number>(TRACKS.private.months.default);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hp, setHp] = useState(""); // honeypot — humans never see or fill it
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [score, setScore] = useState<SealedScore | null>(null);

  const model = getModel(modelId);
  const track_ = TRACKS[type];
  // Price zone is a pricing CONTEXT over the same model — Eilat swaps in the
  // ex-VAT base price; everything downstream (down/months/monthly) is identical.
  const zonePrice = getZonePrice(model.price, pricingZone);
  const isEilat = pricingZone === "eilat";
  const quote = computeQuote({
    basePrice: zonePrice.price,
    type,
    downPct,
    balloonPct,
    months
  });
  const animatedMonthly = useCountUp(quote.monthlyPayment);

  useEffect(() => {
    track("PageViewed", { page: "home" });
  }, []);

  function selectType(t: CustomerType) {
    const r = TRACKS[t];
    setType(t);
    setDownPct(r.down.default);
    setMonths(r.months.default);
    setSent(false);
    track("SimulatorChanged", { field: "type", type: t });
  }

  function selectZone(z: PricingZone) {
    setPricingZone(z);
    setSent(false);
    track("SimulatorChanged", { field: "pricingZone", pricingZone: z });
    emitSignal("compare_many"); // exploring the Eilat price → active-intent nudge
  }

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
      type,
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
        // Zone attribution rides in `source` — no new Supabase column (schema unchanged).
        source: `miame-web · ${intent} · ${pricingZone} · ${
          isEilat ? "green_extreme_terminal_park_eilat" : "nationwide"
        } · ${utmTag(utm)}`,
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
            customerType: type,
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
    void track(evt, { modelId, type, monthly: quote.monthlyPayment, intent });

    const url = buildWhatsAppUrl(
      buildLeadMessage({
        fullName: name.trim(),
        phone: phone.trim(),
        customerLabel: track_.label,
        modelName: model.name,
        quote,
        source:
          "אתר MiaMe · " + intent + (isEilat ? " · מחיר אילת (ללא מע״מ) · Green Extreme" : "")
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
            <div className="sec-kicker">שלושה דגמים</div>
            <h2 className="sec-title">בחרו את הדגם שלכם</h2>
            <p className="sec-desc">
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
                    <Image
                      src="/mia-four-x4-hero.webp"
                      alt={m.name}
                      width={774}
                      height={860}
                      className="card-veh"
                    />
                  </div>
                  <div className="card-body">
                    <div className="card-name">{m.name}</div>
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
              בחרו דגם, מקדמה ומספר תשלומים — עד 18 תשלומים ללא ריבית והצמדה.
            </p>
          </div>

          <div className="sim">
            {/* controls */}
            <div className="sim-controls">
              {/* price zone — nationwide vs Eilat (Green Extreme) */}
              <div className="zone-toggle" role="radiogroup" aria-label="בחירת אזור מחיר">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!isEilat}
                  className={!isEilat ? "zone on" : "zone"}
                  onClick={() => selectZone("nationwide")}
                >
                  מחיר ארצי
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isEilat}
                  className={isEilat ? "zone eilat on" : "zone eilat"}
                  onClick={() => selectZone("eilat")}
                >
                  מחיר אילת · Green Extreme
                </button>
              </div>
              {isEilat && <p className="eilat-note">{zonePrice.legalNote}</p>}

              <div className="tabs" role="tablist">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={type === t}
                    className={type === t ? "tab on" : "tab"}
                    onClick={() => selectType(t)}
                  >
                    {TRACKS[t].label}
                  </button>
                ))}
              </div>

              <div className="field-note" style={{ marginTop: "-12px", marginBottom: "20px" }}>
                {track_.note}
              </div>

              <div className="zero-interest-pill">
                עד 18 תשלומים ללא ריבית והצמדה
              </div>

              <div className="model-pick">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    className={m.id === modelId ? "mp on" : "mp"}
                    onClick={() => selectModel(m.id)}
                  >
                    <div className="mp-n">{m.name}</div>
                    <div className="mp-p">{ils(m.price)}</div>
                  </button>
                ))}
              </div>

              {/* down payment */}
              <div className="field">
                <div className="field-top">
                  <span className="field-label">מקדמה</span>
                  <span className={track_.down.locked ? "field-val locked" : "field-val"}>
                    {downPct}% · {ils(quote.downAmount)}
                  </span>
                </div>
                <input
                  className="rng"
                  type="range"
                  aria-label="מקדמה"
                  min={track_.down.min}
                  max={track_.down.max}
                  step={track_.down.step}
                  value={downPct}
                  disabled={track_.down.locked}
                  onChange={(e) => setDownPct(Number(e.target.value))}
                  onMouseUp={() => emitChange("down")}
                  onTouchEnd={() => emitChange("down")}
                />
                <div className="field-note">
                  מקדמה גמישה מ-{track_.down.min}% עד {track_.down.max}%
                </div>
              </div>

              {/* months */}
              <div className="field">
                <div className="field-top">
                  <span className="field-label">מספר התשלומים</span>
                  <span className={track_.months.locked ? "field-val locked" : "field-val"}>
                    {months} תשלומים
                  </span>
                </div>
                <input
                  className="rng"
                  type="range"
                  aria-label="תקופת תשלומים"
                  min={track_.months.min}
                  max={track_.months.max}
                  step={track_.months.step}
                  value={months}
                  disabled={track_.months.locked}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  onMouseUp={() => emitChange("months")}
                  onTouchEnd={() => emitChange("months")}
                />
                <div className="field-note">
                  {track_.months.min} עד {track_.months.max} תשלומים · ללא ריבית והצמדה
                </div>
              </div>
            </div>

            {/* result */}
            <div className="sim-result">
              <Image
                src="/mia-four-x4-hero.webp"
                alt="MIA FOUR כלי חשמלי ארבעה גלגלים"
                width={774}
                height={860}
                className="res-product"
              />
              <img src="/mia-four-logo.png" alt="MIA FOUR" className="res-logo" />
              <div className="res-eyebrow">
                {isEilat ? "מחיר אילת · Green Extreme" : "עד 18 תשלומים ללא ריבית והצמדה"}
              </div>
              <div className="res-model">
                {model.name} · מסלול {track_.label}
              </div>
              <div className="res-monthly">
                <span className="cur">₪</span>
                <span className="num">{animatedMonthly.toLocaleString("he-IL")}</span>
                <span className="per">לחודש · {months} תשלומים</span>
              </div>

              <div className="res-badges">
                <span className="res-badge accent">0% ריבית</span>
                <span className="res-badge">ללא הצמדה</span>
                <span className="res-badge">עד 18 תשלומים</span>
                <span className="res-badge">{isEilat ? "ללא מע״מ בכפוף לדין" : "Free Feel"}</span>
              </div>

              <div className="res-line" />

              <div className="res-grid">
                <div className="res-cell">
                  <div className="k">{isEilat ? "מחיר אילת" : "מחיר מלא"}</div>
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

              {quote.discountPct > 0 && (
                <div className="res-save">
                  <span>חיסכון שותף {quote.discountPct}%</span>
                  <strong>{ils(quote.basePrice - quote.effectivePrice)}</strong>
                </div>
              )}
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
                  style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 1, width: 1, opacity: 0 }}
                />
                <div className="lead-row">
                  <input
                    className="inp"
                    placeholder="שם מלא"
                    aria-label="שם מלא"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className={phoneError ? "inp inp-error" : "inp"}
                    placeholder="טלפון"
                    aria-label="מספר טלפון"
                    aria-invalid={phoneError}
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
                    נא להזין מספר טלפון תקין כדי שנחזור אליכם 📱
                  </div>
                )}
                <div className="cta-stack">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => openDeal("אישור עסקה", "LeadSubmitted")}
                  >
                    קבל הצעת עסקה בוואטסאפ
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
                  הסימולטור להמחשה בלבד. עד 18 תשלומים ללא ריבית והצמדה בכפוף לאישור עסקה, זמינות מלאי ותנאי החברה/היבואן. האתר אינו מהווה התחייבות לאישור מימון.
                </p>
                {sent && <div className="lead-ok">נפתחה שיחת וואטסאפ ✓ נחזור אליכם מיד</div>}
                {score && (
                  <div
                    className="res-badge accent"
                    style={{ marginTop: 12, alignSelf: "flex-start" }}
                    title={score.reasons.join(" · ")}
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
