"use client";

// components/HowToVideo.tsx — a lazy "how it works / unboxing" YouTube section for
// a product page. NOT a raw iframe: a poster loads first and the youtube-nocookie
// iframe mounts only after an explicit click — no autoplay, fixed 16:9 (no layout
// shift). High-quality poster (maxres → hqdefault fallback). Tracking rides the
// existing analytics sink (public.events) — no schema change.

import { useRef, useState } from "react";
import { track } from "@/lib/analytics";

export default function HowToVideo({
  videoId,
  title = "איך זה עובד · הוצאה מהקופסה",
  lede = "הצצה קצרה: מה יש בקופסה ואיך מתחילים לרכוב על MIA FOUR, צעד אחר צעד.",
}: {
  videoId: string;
  title?: string;
  lede?: string;
}) {
  const [play, setPlay] = useState(false);
  const posterFallback = useRef(false);

  function startPlayback() {
    setPlay(true);
    void track("HowToVideoPlay", { videoId, source: "product_page_howto" });
  }

  return (
    <section className="howto" id="howto" aria-labelledby="howto-title">
      <div className="howto-head">
        <span className="howto-kicker">מדריך מהיר</span>
        <h2 className="howto-title" id="howto-title">
          {title}
        </h2>
        <p className="howto-lede">{lede}</p>
      </div>

      <div className="howto-frame">
        {!play ? (
          <button type="button" className="howto-poster" onClick={startPlayback} aria-label="נגן סרטון הדרכה">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
              alt="MIA FOUR, הוצאה מהקופסה ומדריך"
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget;
                const hq = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                if (!posterFallback.current && img.src !== hq) {
                  posterFallback.current = true;
                  img.src = hq;
                }
              }}
            />
            <span className="howto-play" aria-hidden="true">▶</span>
          </button>
        ) : (
          <iframe
            title="MIA FOUR · how-to"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>
    </section>
  );
}
