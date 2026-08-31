"use client";

// components/FreedomMomentVideo.tsx — the "Free Feel Moment": a short, self-hosted
// VERTICAL brand video that gives the visitor a breath between choosing a path
// (EntryPaths) and the MIA FOUR brand block (About). Not a replacement for the
// existing MiaMe Cinema (YouTube) section — an additional, calmer moment.
//
// No autoplay, no background video: native controls, playsInline, and preload=none
// so the ~8.7MB clip is NOT fetched on page load — it streams only when the visitor
// hits play. A required poster gives a sharp first frame and no layout shift (fixed
// 9:16), so the deferred load is invisible until intended.
// Tracking rides the existing analytics sink (public.events) — no schema change.

import { useRef } from "react";
import { track } from "@/lib/analytics";

export default function FreedomMomentVideo() {
  const tracked = useRef(false);

  function onPlay() {
    if (tracked.current) return;
    tracked.current = true;
    void track("FreedomMomentPlay", { source: "miame_home_freedom_moment" });
  }

  return (
    <section className="block freedom-moment" id="freedom-moment" aria-labelledby="freedom-title">
      <div className="wrap">
        <div className="fm-shell">
          <div className="fm-copy">
            <span className="fm-kicker">Free Feel Moment</span>
            <h2 className="fm-title" id="freedom-title">
              רגע להרגיש חופש.
            </h2>
            <p className="fm-desc">
              הצצה קצרה לעוצמה, לתנועה ולשקט שמגדירים את MiaMe.
            </p>
          </div>

          <div className="fm-frame">
            <video
              className="fm-video"
              poster="/videos/miame-freedom-moment-poster.jpg"
              controls
              playsInline
              preload="none"
              onPlay={onPlay}
              aria-label="MiaMe · Free Feel Moment"
            >
              <source src="/videos/miame-freedom-moment.mp4" type="video/mp4" />
            </video>
          </div>

          {/* One route out of this block, on the owner's call. The second button
              sent people to the Eilat rental page — a different product, offered
              at the exact moment the visitor is deciding whether to buy. The
              focused campaign sells one thing, and a fork here competed with it. */}
          <div className="fm-actions">
            <a className="btn btn-primary" href="#sim">
              בדיקת התאמה
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
