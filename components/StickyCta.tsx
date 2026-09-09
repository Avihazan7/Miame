"use client";

// components/StickyCta.tsx — the mobile sticky bar, and the page's ONE call to action.
//
// OWNER DECISION 2026-09-09: the bar carried a WhatsApp button beside the main CTA,
// the header carried a second one, and FloatingWa a third. The owner struck the top
// and bottom ones out and asked for a single centred "בדיקת התאמה". So this bar is
// now one button, full width — no icon, no second destination, nothing to choose
// between. The WhatsApp funnel itself is untouched: lib/wa-cta still holds the
// registry, and the Configurator still hands the finished quote to WhatsApp, which
// is where the lead actually converts.

import { useEffect, useState } from "react";

export default function StickyCta() {
  // The bar and the Hero say the same two things, and the bar was saying them ON
  // TOP of the Hero. Measured 2026-09-08 at 390×844: the Hero's primary CTA sits
  // at y=785..837 and this bar covers 768..844 — the button the whole page is
  // built around was behind it at rest, from first paint, on every phone.
  //
  // So the bar waits its turn. While the Hero's own actions are on screen the
  // visitor already has both CTAs; the bar takes over only once they leave.
  // Hidden is the honest first state — it is what scroll 0 looks like — and a
  // page without a Hero (or a browser that never runs this effect and so never
  // hydrates) still shows it, because the fallback below opens the bar.
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const heroCta = document.getElementById("hero-cta");
    if (!heroCta || typeof IntersectionObserver !== "function") {
      setHidden(false);
      return;
    }
    // threshold 1, not 0: the bar's job is to supply a CTA when the Hero's is not
    // usable, and half a button is not usable. With the product box widened on
    // 2026-09-08 the action row falls a few pixels past the fold on a short phone
    // (360×780), and at threshold 0 that partial sliver would have kept the bar
    // hidden behind a clipped button.
    const io = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 1 });
    io.observe(heroCta);
    return () => io.disconnect();
  }, []);

  return (
    <div className="sticky-cta" data-hidden={hidden ? "true" : undefined}>
      <a href="#sim" className="btn btn-primary sticky-main">
        בדיקת התאמה
      </a>
    </div>
  );
}
