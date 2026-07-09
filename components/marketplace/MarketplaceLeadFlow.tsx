"use client";

// M31 — Cognitive lead flow as PROGRESSIVE DISCLOSURE (not one long intimidating form).
// Stage 1: customer type + usage intent · Stage 2: route / budget / preferred vehicle ·
// Stage 3: contact + EXPLICIT consent. Every field has a visible label (never
// placeholder-only). DEMO-SAFE: submit performs NO network call, NO Supabase write, NO
// WhatsApp, NO supplier transfer — the values never leave the device. On submit it shows
// the calm skeleton, then illustrative demo decision cards.

import { useEffect, useState } from "react";
import {
  LEAD_STAGES,
  CONSENT,
  DEMO_NOTICE,
  DEMO_DECISION_CARDS,
  type LeadField,
} from "@/lib/marketplace-preview";
import CalmSkeleton from "./CalmSkeleton";

type Phase = "form" | "computing" | "results";

export default function MarketplaceLeadFlow() {
  const [stageIdx, setStageIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  const stage = LEAD_STAGES[stageIdx];
  const isLast = stageIdx === LEAD_STAGES.length - 1;

  // Visual-only dwell on the calm skeleton, then reveal demo cards. No data is loaded.
  useEffect(() => {
    if (phase !== "computing") return;
    const t = setTimeout(() => setPhase("results"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  function setField(name: string, v: string) {
    setValues((prev) => ({ ...prev, [name]: v }));
    if (error) setError(null);
  }

  function missingRequired(): boolean {
    return stage.fields.some((f) => f.required && !(values[f.name] || "").trim());
  }

  function next() {
    if (missingRequired()) {
      setError("נא למלא את השדות המסומנים בכוכבית.");
      return;
    }
    setError(null);
    setStageIdx((i) => Math.min(i + 1, LEAD_STAGES.length - 1));
  }

  function back() {
    setError(null);
    setStageIdx((i) => Math.max(i - 1, 0));
  }

  function submit() {
    if (missingRequired()) {
      setError("נא למלא את השדות המסומנים בכוכבית.");
      return;
    }
    if (!consent) {
      setError("יש לאשר את ההסכמה כדי להמשיך.");
      return;
    }
    setError(null);
    setPhase("computing"); // demo-safe: no network, no provider, no supplier transfer
  }

  function restart() {
    setValues({});
    setConsent(false);
    setStageIdx(0);
    setError(null);
    setPhase("form");
  }

  if (phase === "computing") return <CalmSkeleton />;

  if (phase === "results") {
    return (
      <div className="mp-stage">
        <h2 className="mp-stage-title">כרטיסי החלטה לדוגמה</h2>
        <p className="mp-stage-sub">השוואה להמחשה בלבד, לפי מה שבחרתם.</p>
        <div className="mp-cards">
          {DEMO_DECISION_CARDS.map((c) => (
            <div key={c.id} className="mp-card">
              <div className="mp-card-title">{c.title}</div>
              <div className="mp-card-tag">{c.tagline}</div>
              {c.attributes.map((a) => (
                <div key={a.label} className="mp-card-attr">
                  <span className="mp-attr-label">{a.label}</span>
                  <span className="mp-attr-value">{a.value}</span>
                </div>
              ))}
              <div className="mp-card-note">{c.note}</div>
            </div>
          ))}
        </div>
        <div className="mp-notice">{DEMO_NOTICE}</div>
        <div className="mp-actions">
          <button type="button" className="btn btn-ghost" onClick={restart}>
            התחלה מחדש
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ol className="mp-stepper">
        {LEAD_STAGES.map((s, i) => (
          <li
            key={s.id}
            className="mp-step"
            data-active={i === stageIdx}
            data-done={i < stageIdx}
          >
            {s.index}. {s.title}
          </li>
        ))}
      </ol>

      <div className="mp-stage" key={stage.id}>
        <h2 className="mp-stage-title">{stage.title}</h2>
        <p className="mp-stage-sub">{stage.subtitle}</p>

        {stage.fields.map((f) => (
          <Field
            key={f.name}
            field={f}
            value={values[f.name] || ""}
            onChange={(v) => setField(f.name, v)}
          />
        ))}

        {isLast && (
          <div className="mp-consent">
            <input
              id="mp-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (error) setError(null);
              }}
            />
            <label htmlFor="mp-consent">{CONSENT.label}</label>
          </div>
        )}

        {error && (
          <div className="mp-notice" role="alert">
            {error}
          </div>
        )}

        <div className="mp-actions">
          {stageIdx > 0 && (
            <button type="button" className="btn btn-ghost" onClick={back}>
              חזרה
            </button>
          )}
          <span className="mp-spacer" />
          {isLast ? (
            <button type="button" className="btn btn-primary" onClick={submit}>
              הצגת השוואה לדוגמה
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={next}>
              המשך
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: LeadField;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `mp-${field.name}`;
  const req = field.required ? (
    <span className="mp-req" aria-hidden="true">
      *
    </span>
  ) : null;

  if (field.type === "radio") {
    return (
      <fieldset className="mp-field">
        <legend className="mp-label">
          {field.label}
          {req}
        </legend>
        <div className="mp-radio-row">
          {field.options?.map((o) => (
            <label key={o.value} className="mp-radio">
              <input
                type="radio"
                name={field.name}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "select") {
    return (
      <div className="mp-field">
        <label className="mp-label" htmlFor={id}>
          {field.label}
          {req}
        </label>
        <select
          id={id}
          className="mp-control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">בחרו…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mp-field">
      <label className="mp-label" htmlFor={id}>
        {field.label}
        {req}
      </label>
      <input
        id={id}
        className="mp-control"
        type={field.type}
        inputMode={field.type === "tel" ? "tel" : undefined}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
