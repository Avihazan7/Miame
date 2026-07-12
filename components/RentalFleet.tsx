"use client";

import { useState } from "react";
import LexIcon from "@/components/LexIcon";
import { saveRentalLead, RentalLeadRecord } from "@/lib/supabase";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buildRentalMessage, wazeUrl, RENTAL_HOURLY_FROM } from "@/lib/rental";
import { FLEET_SIZE, RENTAL_HUB } from "@/lib/rental-fleet";
import { track } from "@/lib/analytics";
import { getUtm, utmTag } from "@/lib/utm";
import WaIcon from "./WaIcon";

export default function RentalFleet() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("");
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
    const source = `miame-web · השכרה אילת · green_extreme_terminal_park_eilat · ${utmTag(utm)}`;

    // Best-effort persistence — never blocks the WhatsApp funnel (table may be
    // a pending schema proposal; saveRentalLead fails quietly if so).
    const lead: RentalLeadRecord = {
      full_name: name.trim(),
      phone: phone.trim(),
      hub: RENTAL_HUB,
      requested_hours: hours.trim(),
      source,
      ...utm,
    };
    void saveRentalLead(lead);
    void track("RentalInterest", { hub: "eilat_green_extreme", hours: hours.trim() || null });

    const url = buildWhatsAppUrl(
      buildRentalMessage({
        fullName: name.trim(),
        phone: phone.trim(),
        hours: hours.trim() || undefined,
        source: "אתר MiaMe · השכרה אילת",
      })
    );
    if (typeof window !== "undefined") window.open(url, "_blank");
    setSent(true);
  }

  const waPlain = buildWhatsAppUrl(
    buildRentalMessage({ fullName: "", phone: "", source: "אתר MiaMe · השכרה אילת · CTA" })
  );

  return (
    <section className="block rental-sec" id="rental" aria-labelledby="rental-title">
      <div className="wrap">
        <div className="rental-card">
          <span className="rental-kicker">
            <LexIcon name="recycle" /> השכרה · אילת
          </span>
          <h1 className="rental-title" id="rental-title">
            השכרת MIA FOUR באילת · Green Extreme
          </h1>
          <p className="rental-copy">
            צי פתיחה מתוכנן של כ-{FLEET_SIZE} כלי MiaMe להשכרה לפי שעה באילת, סביב מתחם
            Green Extreme בפארק הטרמינל, חוויית Free Feel חשמלית, ירוקה ומשפחתית, החל
            מ-{RENTAL_HOURLY_FROM} ₪ לשעה. זמינות, מחיר ותנאי שימוש כפופים לאישור הסניף
            ולמצב הכלים.
          </p>

          <div className="rental-stats">
            <div className="rental-stat">
              <div className="rs-n">{FLEET_SIZE}</div>
              <div className="rs-k">כלים בצי אילת</div>
            </div>
            <div className="rental-stat">
              <div className="rs-n">
                {RENTAL_HOURLY_FROM}
                <span className="rs-cur"> ₪</span>
              </div>
              <div className="rs-k">לשעה · החל מ-</div>
            </div>
            <div className="rental-stat">
              <div className="rs-n rs-soon">בקרוב</div>
              <div className="rs-k">זמינות בזמן אמת</div>
            </div>
          </div>

          {/* rental lead — WhatsApp-first, best-effort save */}
          <div className="rental-lead">
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
            <div className="rental-row">
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
              <input
                className="inp"
                placeholder="משך (אופציונלי)"
                aria-label="משך השכרה מבוקש"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            {phoneError && (
              <div className="lead-err" role="alert">
                נא להזין מספר טלפון תקין כדי שנחזור אליכם
              </div>
            )}
            <div className="rental-actions">
              <button type="button" className="btn btn-primary" onClick={submit}>
                <WaIcon size={20} />
                שריון שעה ב-Green Extreme
              </button>
              <a href={wazeUrl()} target="_blank" rel="noopener" className="btn btn-ghost">
                נווט ל-Green Extreme
              </a>
            </div>
            {sent && <div className="lead-ok">נפתחה שיחת וואטסאפ ✓ נחזור אליכם לתיאום</div>}
            <p className="rental-disc">
              ההשכרה בתיאום מראש ובכפוף לזמינות מלאי, לתנאי המפעיל ולדין. זמינות בזמן אמת
              תיפתח עם השלמת חיבור המעקב (Ituran Tick Track), עד אז הזמינות מאושרת מול הצוות.
            </p>
          </div>

          <p className="rental-alt">
            מעדיפים לדבר? <a href={waPlain} target="_blank" rel="noopener">דברו איתי על השכרה</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
