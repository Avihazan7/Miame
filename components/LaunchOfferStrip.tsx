"use client";

// components/LaunchOfferStrip.tsx — the honest launch strip at the top of the
// storefront. Real launch offer + honest "subject to availability" stock
// language; NO fake countdown, NO fake stock counter. Its CTA scrolls to the
// simulator and fires a tracked DealBuzzClicked event.

import { track } from "@/lib/analytics";
import { LAUNCH_OFFER, BUZZ_DISCLAIMER } from "@/lib/deal-buzz";

export default function LaunchOfferStrip() {
  function onCta() {
    void track("DealBuzzClicked", { placement: "launch-strip", cta: LAUNCH_OFFER.cta });
    if (typeof document !== "undefined") {
      document.getElementById("sim")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <aside className="launch-strip" aria-label="מבצע השקה">
      <div className="wrap launch-strip-inner">
        <span className="launch-badge">
          <span className="launch-dot" aria-hidden="true" />
          {LAUNCH_OFFER.kicker}
        </span>
        <p className="launch-text">{LAUNCH_OFFER.text}</p>
        <button type="button" className="btn btn-primary btn-sm launch-cta" onClick={onCta}>
          {LAUNCH_OFFER.cta}
        </button>
      </div>
      <p className="launch-disc">{BUZZ_DISCLAIMER}</p>
    </aside>
  );
}
