"use client";

import { useEffect, useRef, useState } from "react";
import { MODELS, getModel } from "@/lib/models";
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

export default function Configurator() {
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const [type, setType] = useState<CustomerType>("private");
  const [downPct, setDownPct] = useState<number>(TRACKS.private.down.default);
  const [balloonPct, setBalloonPct] = useState<number>(TRACKS.private.balloon.default);
  const [months, setMonths] = useState<number>(TRACKS.private.months.default);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const model = getModel(modelId);
  const track_ = TRACKS[type];
  const quote = computeQuote({
    basePrice: model.price,
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
    setBalloonPct(r.balloon.default);
    setMonths(r.months.default);
    setSent(false);
    track("SimulatorChanged", { field: "type", type: t });
  }

  function selectModel(id: string, scroll = false) {
    setModelId(id);
    setSent(false);
    track("ModelSelected", { modelId: id });
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
  }

  function openDeal(intent: string, evt: "LeadSubmitted" | "WhatsAppClicked") {
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length >= 9) {
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
        source: "miame-web · " + intent
      };
      void saveLead(lead);
    }
    void track(evt, { modelId, type, monthly: quote.monthlyPayment, intent });

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
                      src="/mia-four.webp"
                      alt={m.name}
                      width={400}
                      height={400}
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
              בחרו מסלול, גררו את הפרמטרים, וקבלו תשלום חודשי משוער בזמן אמת.
            </p>
          </div>

          <div className="sim">
            {/* controls */}
            <div className="sim-controls">
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
                  {track_.down.locked
                    ? "קבוע במסלול זה"
                    : `טווח ${track_.down.min}% עד ${track_.down.max}%`}
                </div>
              </div>

              {/* balloon */}
              {!track_.balloon.hidden && (
                <div className="field">
                  <div className="field-top">
                    <span className="field-label">תשלום בלון בסוף התקופה</span>
                    <span className={track_.balloon.locked ? "field-val locked" : "field-val"}>
                      {balloonPct}% · {ils(quote.balloonAmount)}
                    </span>
                  </div>
                  <input
                    className="rng"
                    type="range"
                    aria-label="תשלום בלון"
                    min={track_.balloon.min}
                    max={track_.balloon.max}
                    step={track_.balloon.step}
                    value={balloonPct}
                    disabled={track_.balloon.locked}
                    onChange={(e) => setBalloonPct(Number(e.target.value))}
                    onMouseUp={() => emitChange("balloon")}
                    onTouchEnd={() => emitChange("balloon")}
                  />
                  <div className="field-note">
                    {`טווח ${track_.balloon.min}% עד ${track_.balloon.max}% · מקטין את התשלום החודשי`}
                  </div>
                </div>
              )}

              {/* months */}
              <div className="field">
                <div className="field-top">
                  <span className="field-label">תקופת תשלומים</span>
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
                  {track_.months.locked
                    ? "קבוע במסלול זה"
                    : `טווח ${track_.months.min} עד ${track_.months.max} תשלומים`}
                </div>
              </div>
            </div>

            {/* result */}
            <div className="sim-result">
              <div className="res-eyebrow">תשלום חודשי משוער</div>
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
                <span className="res-badge">זמינות מיידית*</span>
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

              {quote.discountPct > 0 && (
                <div className="res-save">
                  <span>חיסכון שותף {quote.discountPct}%</span>
                  <strong>{ils(quote.basePrice - quote.effectivePrice)}</strong>
                </div>
              )}
              {quote.balloonAmount > 0 && (
                <div className="res-disc" style={{ color: "#9fc2ff" }}>
                  • תשלום בלון {quote.balloonPct}% ({ils(quote.balloonAmount)}) בסוף התקופה
                </div>
              )}

              {/* lead */}
              <div className="lead">
                <div className="lead-row">
                  <input
                    className="inp"
                    placeholder="שם מלא"
                    aria-label="שם מלא"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="inp"
                    placeholder="טלפון"
                    aria-label="מספר טלפון"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="cta-stack">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => openDeal("אישור עסקה", "LeadSubmitted")}
                  >
                    אשר עסקה
                  </button>
                  <button
                    className="btn btn-light btn-block"
                    onClick={() => openDeal("שיחה", "WhatsAppClicked")}
                  >
                    <WaIcon size={20} />
                    דברו איתי בוואטסאפ
                  </button>
                </div>
                <p className="disclaimer">
                  ההערכה אינפורמטיבית בלבד ואינה הצעת אשראי. *בכפוף לזמינות מלאי, אישור עסקה ותנאי הספק.
                </p>
                {sent && <div className="lead-ok">נפתחה שיחת וואטסאפ ✓ נחזור אליכם מיד</div>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
