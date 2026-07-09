"use client";

// components/CinematicVideo.tsx — the Product Cinema Stage. A YouTube reference
// woven into the middle of the experience as a premium dark stage (Master Spec
// principle 1/6), NOT a raw iframe: a lazy poster loads first and the
// youtube-nocookie iframe mounts only after an explicit click — no autoplay on
// page load, no background video, fixed 16:9 so there's no layout shift.
//
// Tracking rides the existing analytics sink (public.events, no schema change):
// CinematicVideoPlay on first play, CinematicVideoCTA on a stage CTA. Best-effort.

import { useState } from "react";
import { track } from "@/lib/analytics";

const VIDEO_ID = "gf1rxCEwu-c";
const SOURCE = "miame_home_cinema_stage";
const VIDEO_PROVIDER = "youtube-nocookie";
// High-quality poster with a graceful fallback: not every upload has a
// maxresdefault, so drop to hqdefault (always present) if the first 404s.
const POSTER_MAX = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const POSTER_FALLBACK = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;

export default function CinematicVideo() {
  const [play, setPlay] = useState(false);

  function startPlayback() {
    setPlay(true);
    void track("CinematicVideoPlay", {
      videoId: VIDEO_ID,
      source: SOURCE,
      videoProvider: VIDEO_PROVIDER,
    });
  }

  return (
    <section className="block cinematic-video" id="cinema" aria-labelledby="cinema-title">
      <div className="wrap">
        <div className="cinema-shell">
          <div className="cinema-copy">
            <span className="cinema-kicker">MiaMe Cinema</span>
            <h2 className="cinema-title" id="cinema-title">
              לא רק כלי. חוויית Free Feel בתנועה.
            </h2>
            <p className="cinema-desc">
              הצצה לאנרגיה, לעומק ולתחושת החופש שמובילה את MiaMe — מוביליטי חשמלית,
              יוקרתית וזורמת.
            </p>
          </div>

          <div className="cinema-frame" dir="ltr">
            {!play ? (
              <button
                type="button"
                className="cinema-poster"
                onClick={startPlayback}
                aria-label="נגן סרטון MiaMe"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={POSTER_MAX}
                  alt="תצוגת וידאו MiaMe"
                  loading="lazy"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.src !== POSTER_FALLBACK) img.src = POSTER_FALLBACK;
                  }}
                />
                <span className="cinema-play" aria-hidden="true">▶</span>
              </button>
            ) : (
              <iframe
                title="MiaMe cinematic video"
                src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            )}
          </div>

          <div className="cinema-actions">
            <a
              className="btn btn-primary"
              href="#sim"
              onClick={() =>
                void track("CinematicVideoCTA", {
                  cta: "fit_check",
                  source: SOURCE,
                  videoProvider: VIDEO_PROVIDER,
                })
              }
            >
              בדיקת התאמה בוואטסאפ
            </a>
            <a
              className="btn btn-ghost"
              href="#rental"
              onClick={() =>
                void track("CinematicVideoCTA", {
                  cta: "rental_eilat",
                  source: SOURCE,
                  videoProvider: VIDEO_PROVIDER,
                })
              }
            >
              השכרה באילת
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
