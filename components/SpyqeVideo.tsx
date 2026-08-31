"use client";

// components/SpyqeVideo.tsx — the SPYQE film, inside its media tile.
//
// A facade, not a raw iframe, for the same reason the cinema stage is one: the
// homepage already mounts YouTube once, and a second player loading on every
// visit costs every visitor bandwidth for a film most will not open. A lazy
// poster loads first and youtube-nocookie mounts only on an explicit click.
//
// Fixed 16:9 on the wrapper, so the tile reserves its space before the poster
// arrives and nothing below it jumps.

import { useState } from "react";
import { track } from "@/lib/analytics";
import { SPYQE } from "@/lib/spyqe";

const VIDEO_ID = "ZgB3ncNAj2Q";
const SOURCE = "miame_spyqe_media";
// Not every upload has a maxresdefault; hqdefault always exists.
const POSTER_MAX = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const POSTER_FALLBACK = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;

export default function SpyqeVideo() {
  const [play, setPlay] = useState(false);

  return (
    <div className="spq-video" dir="ltr">
      {!play ? (
        <button
          type="button"
          className="spq-video-poster"
          aria-label={`נגן סרטון ${SPYQE.name}`}
          onClick={() => {
            setPlay(true);
            void track("CinematicVideoPlay", {
              videoId: VIDEO_ID,
              source: SOURCE,
              videoProvider: "youtube-nocookie",
            });
          }}
        >
          <img
            src={POSTER_MAX}
            alt=""
            loading="lazy"
            // maxres -> hq -> hide. Without the third step a thumbnail that never
            // arrives leaves the browser's broken-image glyph sitting on the
            // tile; hidden, the dark tile and the play button read as a
            // deliberate placeholder instead of a fault.
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== POSTER_FALLBACK) img.src = POSTER_FALLBACK;
              else img.hidden = true;
            }}
          />
          <span className="spq-video-play" aria-hidden="true">
            ▶
          </span>
          <span className="spq-video-tag" dir="rtl">
            Coming Soon
          </span>
        </button>
      ) : (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1&vq=hd2160&hd=1`}
          title={`${SPYQE.full} · סרטון`}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      )}
    </div>
  );
}
