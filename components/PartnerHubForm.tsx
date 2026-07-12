"use client";

// components/PartnerHubForm.tsx — §10 MiaMe Hub partner lead form. Writes to the
// EXISTING public.partners table (business_name, contact_name, phone, city,
// planned_assets — status is defaulted server-side). WhatsApp-first: the save is
// best-effort and never blocks the funnel. No new/duplicate partner table.

import { useState } from "react";
import { savePartner, PartnerRecord } from "@/lib/supabase";
import { buildWhatsAppUrl, buildPartnerMessage } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import { getUtm, utmTag } from "@/lib/utm";
import WaIcon from "./WaIcon";

export default function PartnerHubForm() {
  const [business, setBusiness] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [assets, setAssets] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [phoneError, setPhoneError] = useState(false);
  const [sent, setSent] = useState(false);

  function submit() {
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 9) {
      setPhoneError(true);
      setSent(false);
      return;
    }
    setPhoneError(false);
    // Honeypot → mimic success, no save / no WhatsApp.
    if (hp.trim() !== "") {
      setSent(true);
      return;
    }

    const utm = getUtm();
    // planned_assets is a numeric column — coerce, defaulting to 0 when blank.
    const plannedAssets = Math.max(0, parseInt(assets.replace(/[^\d]/g, ""), 10) || 0);

    // Best-effort persistence to the existing partners table. Fails quietly if the
    // schema is behind (insertLenient strips UTM cols and retries) — the WhatsApp
    // thread remains the source of truth for the partnership inquiry.
    const partner: PartnerRecord = {
      business_name: business.trim(),
      contact_name: contact.trim(),
      phone: phone.trim(),
      city: city.trim(),
      planned_assets: plannedAssets,
      ...utm,
    };
    void savePartner(partner);
    void track("PartnerInterest", { source: "partner_hub_form", city: city.trim() || null, planned_assets: plannedAssets });

    const url = buildWhatsAppUrl(buildPartnerMessage(contact.trim(), phone.trim(), city.trim()));
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
    setSent(true);
  }

  return (
    <div className="partner-form" aria-label="טופס הצטרפות MiaMe Hub">
      <div className="partner-form-head">
        <div className="pf-title">בואו נבנה יחד Hub</div>
        <p className="pf-desc">
          השאירו פרטים ונחזור אליכם עם מודל ההפעלה המלא, מחירון, לוגיסטיקה וליווי שיווקי.
        </p>
      </div>

      {/* honeypot */}
      <input
        type="text"
        name="company_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        // RTL-safe off-screen: clip in place instead of left:-9999px, which in a
        // dir="rtl" document pushes the field ~9999px to the right and inflates the
        // page's horizontal scroll width.
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap", border: 0, opacity: 0 }}
      />

      <div className="partner-form-grid">
        <input
          className="inp"
          placeholder="שם העסק"
          aria-label="שם העסק"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
        />
        <input
          className="inp"
          placeholder="איש קשר"
          aria-label="איש קשר"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
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
        <input
          className="inp"
          placeholder="עיר / אזור"
          aria-label="עיר או אזור"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="inp"
          placeholder="כמה כלים מתוכננים? (אופציונלי)"
          aria-label="מספר כלים מתוכנן"
          inputMode="numeric"
          value={assets}
          onChange={(e) => setAssets(e.target.value)}
        />
      </div>

      {phoneError && (
        <div className="lead-err" role="alert">
          נא להזין מספר טלפון תקין כדי שנחזור אליכם
        </div>
      )}

      <button type="button" className="btn btn-primary btn-block" onClick={submit}>
        <WaIcon size={20} />
        אני רוצה להקים MiaMe Hub
      </button>

      {sent && <div className="lead-ok">נפתחה שיחת וואטסאפ ✓ נחזור אליכם עם המודל המלא</div>}

      <p className="pf-disc">
        הפנייה ללא התחייבות. פרטי ההצטרפות, המחירון ותנאי השותפות כפופים לאישור MiaMe ולהסכם מסחרי.
      </p>
    </div>
  );
}
