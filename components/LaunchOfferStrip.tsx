"use client";

// components/LaunchOfferStrip.tsx — the honest launch strip at the top of the
// storefront. Real launch offer, NO fake countdown, NO fake stock counter. Its
// CTA scrolls to the simulator and fires a tracked DealBuzzClicked event.
//
// It is a badge and a button, and that is the whole strip. It used to carry two
// paragraphs as well, and measured on a 390x844 phone they cost 142px — 16.8% of
// the viewport, 69% of the strip — to say things the page already said: the
// finance line repeated the Hero's (without the Hero's asterisk), the stock
// language repeated the Hero's legal line, "בדיקת התאמה" was the third of three
// on one screen, and the disclaimer was the SECOND verbatim render of
// BUZZ_DISCLAIMER on the page (DealBuzz.tsx still carries the first-class one).
// The paragraph also promised WhatsApp while the only control here scrolls to
// #sim — the exact defect test/ctaLabelHonesty.test.ts exists for, in the one
// shape its scan cannot see. Those 142px are what pays for the bigger product.

import { track } from "@/lib/analytics";
import { LAUNCH_OFFER } from "@/lib/deal-buzz";

export default function LaunchOfferStrip() {
  function onCta() {
    void track("DealBuzzClicked", { placement: "launch-strip", cta: LAUNCH_OFFER.cta });
    if (typeof document !== "undefined") {
      document.getElementById("sim")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <aside className="launch-strip" aria-label={LAUNCH_OFFER.kicker}>
      <div className="wrap launch-strip-inner">
        <span className="launch-badge">
          <span className="launch-dot" aria-hidden="true" />
          {LAUNCH_OFFER.kicker}
        </span>
        <button type="button" className="btn btn-primary btn-sm launch-cta" onClick={onCta}>
          {LAUNCH_OFFER.cta}
        </button>
      </div>
    </aside>
  );
}
