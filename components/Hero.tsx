"use client";

// components/Hero.tsx — Ultra Master cinematic Hero Gate V3.
// Replaces the pale, overloaded first screen with a dark, product-dominant gate:
// one promise (H1), one primary action (#sim), one secondary (#cinema). Brand
// Lexicon glyphs are SVG (never system emoji); real emoji live only in native
// channels (WhatsApp / OG). Palette + type scoped in app/miame-hero-v2.css.

import Image from "next/image";
import LexIcon from "@/components/LexIcon";
import { track } from "@/lib/analytics";
import { WARRANTY_TERM } from "@/lib/content";

export default function Hero() {
  return (
    <section className="hero-v2" aria-label="MIA FOUR · Electric Freedom">
      <div className="hero-v2-energy hero-v2-energy-a" aria-hidden="true" />
      <div className="hero-v2-energy hero-v2-energy-b" aria-hidden="true" />

      <div className="wrap hero-v2-grid">
        <div className="hero-v2-copy">
          <span className="hero-v2-eyebrow" dir="ltr">
            <LexIcon name="m-roundel" /> MIA FOUR · ELECTRIC FREEDOM <LexIcon name="bolt" />
          </span>

          <h1 className="hero-v2-title" aria-label="החופש שלך. עכשיו בתנועה.">
            <span aria-hidden="true">החופש שלך.</span>
            <strong aria-hidden="true">
              עכשיו בתנועה.<LexIcon name="liberty" className="hero-v2-h1-icon" />
            </strong>
          </h1>

          {/* The first paragraph after the H1, which is the most heavily read
              prose on the strongest page — and it named the product in Latin
              only and called it "ניידות חשמלית", a phrase nobody searches. The
              H1 above keeps its line; this sentence does the naming: the Hebrew
              name (מיה פור), the Latin one, and what the thing legally IS
              (קלנועית — the site's own legal page is explicit that it is not a
              רכב, and it is also the word buyers type). */}
          <p className="hero-v2-sub">
            <bdi dir="ltr">MIA FOUR</bdi> · מיה פור, קלנועית חשמלית פרימיום על ארבעה גלגלים.
            עוצמה, יציבות וחופש שמתאימים לחיים שלכם.
          </p>

          <p className="hero-v2-finance">
            <LexIcon name="check" /> עד 18 תשלומים ללא ריבית והצמדה*
          </p>

          <div className="hero-v2-actions">
            <a
              className="btn hero-v2-primary"
              href="#sim"
              data-event="HeroPrimaryCTA"
              onClick={() => void track("HeroPrimaryCTA")}
            >
              בדיקת התאמה
            </a>
            <a
              className="btn hero-v2-secondary"
              href="#cinema"
              data-event="HeroSecondaryCTA"
              onClick={() => void track("HeroSecondaryCTA")}
            >
              צפו ב-MIA FOUR
            </a>
          </div>

          <div className="hero-v2-trust">
            <span><LexIcon name="p-roundel" /> יבואן רשמי</span>
            <span>מחקר ופיתוח ישראלי 🇮🇱</span>
            <span>{WARRANTY_TERM}</span>
            <span dir="ltr">EN17128</span>
          </div>

          <p className="hero-v2-legal">
            *בכפוף לאישור עסקה, זמינות מלאי ותנאי החברה/היבואן.
          </p>
        </div>

        <div className="hero-v2-visual">
          <div className="hero-v2-product-stage">
            <div className="hero-v2-orbit hero-v2-orbit-a" aria-hidden="true" />
            <div className="hero-v2-orbit hero-v2-orbit-b" aria-hidden="true" />

            <Image
              src="/mia-four-x6-studio.webp"
              alt="MIA FOUR, קלנועית חשמלית פרימיום על ארבעה גלגלים"
              width={1400}
              height={1498}
              priority
              fetchPriority="high"
              sizes="(max-width: 900px) 92vw, (max-width: 1280px) 46vw, 510px"
              className="hero-v2-product"
            />

            <div className="hero-v2-power-chip">
              <span>עד</span><b dir="ltr">4×1,800W</b>
            </div>
            <div className="hero-v2-free-chip">
              <LexIcon name="butterfly" /> FREE FEEL
            </div>
          </div>
        </div>
      </div>

      <a
        href="#models"
        className="hero-v2-scroll-cue"
        data-event="HeroScrollCue"
        aria-label="גלילה לדגמים"
        onClick={() => void track("HeroScrollCue")}
      >
        <span aria-hidden="true">▾</span>
      </a>
    </section>
  );
}
