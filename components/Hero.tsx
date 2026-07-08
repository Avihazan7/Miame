import Image from "next/image";

function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="wrap hero-inner">
        <span className="eyebrow">
          <span className="pulse" />
          קנה. השכר. תצמח.
        </span>
        <h1 className="hero-title">
          החופש שלך
          <br />
          <span className="tg">על ארבעה גלגלים</span>
        </h1>
        <div className="free-feel" aria-label="Free Feel">
          <span aria-hidden="true">🗽</span> Free&nbsp;Feel
        </div>
        <p className="hero-sub">
          ניידות חשמלית פרימיום במחיר חכם. <span className="strong">עד 18 תשלומים ללא ריבית והצמדה</span>, ישירות לוואטסאפ.
        </p>
        <div className="hero-actions">
          <a href="#sim" className="btn btn-primary">קבל הצעת תשלום</a>
          <a href="#partner" className="btn btn-ghost">אני רוצה להיות שותף עסקי</a>
        </div>
        <div className="hero-trust">
          <span className="tchip"><Check />הכי חכם</span>
          <span className="tchip"><Check />הכי בטיחותי</span>
          <span className="tchip"><Check />הכי אמין</span>
          <span className="tchip"><Check />הכי נוח</span>
          <span className="tchip"><Check />הכי משתלם</span>
        </div>

        <ul className="hero-bullets">
          <li>MIA&nbsp;FOUR מגיעה עד אליך — עד 18 תשלומים ללא ריבית והצמדה.</li>
          <li>בוחרים מקדמה, מספר תשלומים, ומקבלים הצעה מותאמת תוך דקה.</li>
          <li>יבואן מורשה · שירות ואחריות 12 חודשים · MEU.</li>
        </ul>

        <div className="stage">
          <div className="stage-card">
            <div className="stage-grid" />
            <img className="stage-watermark" src="/mia-four-logo.png" alt="" aria-hidden="true" />

            <div className="vehicle-arrive">
              {/* cinematic wake — light trail in the adaptive ambient hue,
                  rides with the vehicle so it is never occluded */}
              <span className="veh-wake" aria-hidden="true">
                <span className="streak s1" />
                <span className="streak s2" />
                <span className="streak s3" />
                <span className="streak s4" />
                <span className="streak s5" />
                <span className="comet" />
              </span>
              <Image
                src="/mia-four.webp"
                alt="MiaMe Four"
                width={760}
                height={760}
                className="vehicle floaty"
                sizes="(max-width: 780px) 90vw, 560px"
                quality={92}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
