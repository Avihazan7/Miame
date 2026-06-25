import Image from "next/image";

export default function About() {
  return (
    <section className="block about-sec" id="about">
      <div className="wrap about-wrap">
        <div className="sec-kicker">אודותינו</div>
        <h2 className="about-title">
          לחיות את החלום
          <br />
          <span style={{ color: "var(--azure)" }}>להרגיש חופשי</span>
        </h2>

        <div className="about-logo" aria-label="MIA FOUR">
          <span className="about-logo-halo" aria-hidden="true" />
          <span className="about-logo-disc">
            <Image
              src="/mia-four-badge.png"
              alt="MIA FOUR"
              width={420}
              height={420}
              className="about-logo-img"
            />
          </span>
        </div>

        <p className="about-text">
          <b>MiaMe.co.il</b> נולדה מתוך אמונה פשוטה · שלכל אחד מגיע החופש לזוז בביטחון, בנוחות ובסטייל. אנחנו מביאים את הדור הבא של ניידות חשמלית · קלנועית <b>מיה פור</b> · ומרכזים במקום אחד את כל הפתרונות, אפשרויות השימוש והרכישה, מותאמים בדיוק אליכם. בלי פשרות על ניידות · רק חופש, ביטחון והנאה מכל נסיעה.
        </p>
      </div>
    </section>
  );
}
