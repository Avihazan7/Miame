"use client";

import { buildCampaignWhatsAppUrl, buildWhatsAppUrl } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import LexIcon from "@/components/LexIcon";
import WaIcon from "./WaIcon";

// Eilat / Green Extreme activity point. Wording is deliberately careful — a
// planned activity/experience point, NOT an "official branch" (no such claim
// until a signed agreement). Only publicly-known facts are stated in copy.
//
// Campaign rule 2: no street address and no navigation deep link. MiaMe
// publishes no branch and no navigable location anywhere on the site; the way
// to reach us — here as everywhere — is WhatsApp.
// Campaign rule 4: the simulator now runs ONE nationwide track, so the old
// "בדוק מחיר אילת" CTA (which pointed at a price zone that no longer exists)
// is gone. Do not point a CTA at #sim expecting a regional price.

const FACTS = [
  "Green Extreme · אילת",
  "אטרקציות 16:00–22:00",
  "חוויה חשמלית לכל המשפחה",
];

export default function EilatBranch() {
  const MESSAGE =
    "היי MiaMe, אשמח לפרטים על MIA FOUR וזמינות סביב Green Extreme באילת 🦋";
  const wa = buildWhatsAppUrl(MESSAGE);

  // This is a real sales CTA and it was the one entry point on the site that
  // opened WhatsApp and reported nothing — so an Eilat lead arrived at the rep
  // with no record that the Eilat section produced it, and the section looked
  // like it converted nobody. The href is built during render, on the server too,
  // so the campaign (browser-only) is rebuilt here at the moment of the click.
  function onWaClick(e: React.MouseEvent<HTMLAnchorElement>) {
    void track("WhatsAppClicked", { placement: "eilat", intent: "inquiry" });
    e.currentTarget.href = buildCampaignWhatsAppUrl(MESSAGE);
  }

  return (
    <section className="block eilat-branch" id="eilat" aria-labelledby="eilat-title">
      <div className="wrap">
        <div className="eilat-card">
          <span className="eilat-kicker">
            <LexIcon name="recycle" /> אילת · Green Extreme
          </span>
          <h2 className="eilat-title" id="eilat-title">
            MiaMe × Green Extreme, נקודת הפעילות שלנו באילת
          </h2>
          <p className="eilat-copy">
            מתחם Green Extreme באילת מתוכנן להיות נקודת החוויה והפעילות של MiaMe בעיר,
            מקום חי, חשמלי, ירוק ואקסטרימי שמחבר בין תצוגה, נסיעת היכרות וחוויית
            Free Feel אמיתית. תיאום, זמינות ותנאים מול נציג MiaMe.
          </p>

          <div className="eilat-facts">
            {FACTS.map((f) => (
              <div className="eilat-fact" key={f}>
                {f}
              </div>
            ))}
          </div>

          <div className="eilat-actions">
            <a
              href={wa}
              target="_blank"
              rel="noopener"
              className="btn btn-primary"
              data-wa="eilat"
              onClick={onWaClick}
            >
              <WaIcon size={20} />
              דברו איתי על אילת
            </a>
            <a href="/#sim" className="btn btn-light">
              בניית הצעת תשלום
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
