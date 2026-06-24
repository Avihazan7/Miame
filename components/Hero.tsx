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
          על ארבעה גלגלים
        </h1>
        <p className="hero-sub">
          ניידות חשמלית פרימיום במחיר חכם. <span className="strong">הצעת תשלום מותאמת תוך דקה</span>, ישירות לוואטסאפ.
        </p>
        <div className="hero-actions">
          <a href="#sim" className="btn btn-primary">קבל הצעת תשלום</a>
          <a href="#partner" className="btn btn-ghost">אני רוצה להיות שותף עסקי</a>
        </div>
        <div className="hero-trust">
          <span className="tchip"><Check />אחריות יבואן</span>
          <span className="tchip"><Check />אספקה מיידית בכפוף למלאי</span>
          <span className="tchip"><Check />0% ריבית בכפוף לאישור</span>
          <span className="tchip"><Check />4×4 אמיתי</span>
          <span className="tchip tchip-brand">Powered by Leasing.co.il 🎯</span>
        </div>

        <div className="stage">
          <div className="stage-card">
            <div className="stage-grid" />
            <img className="stage-watermark" src="/mia-four-logo.png" alt="" aria-hidden="true" />
            <span className="stage-label">MiaMe · Electric</span>
            <Image
              src="/mia-four.webp"
              alt="MiaMe Four"
              width={760}
              height={760}
              className="vehicle floaty"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
