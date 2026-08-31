import WaCta from "@/components/WaCta";

export default function Spyqe() {
  return (
    <section className="block">
      <div className="wrap">
        <div className="soon-card">
          <div className="soon-media">
            <span className="soon-badge">בקרוב · Coming Soon</span>
            <div className="soon-gallery">
              <div className="soon-tile main">
                <img className="floaty" src="/mia-four-teal-side.webp" alt="SPYQE · פרופיל" loading="lazy" />
              </div>
              <div className="soon-tile">
                <img src="/mia-four-teal-wheel.webp" alt="SPYQE · גלגל שטח" loading="lazy" />
              </div>
              <div className="soon-tile">
                <img src="/mia-four-teal-cockpit.webp" alt="SPYQE · תא נהג" loading="lazy" />
              </div>
            </div>
          </div>
          <div className="soon-txt">
            <div className="soon-title">SPYQE</div>
            <p className="soon-sub">
              פלטפורמת MIA Dynamics מתרחבת · דגמים חדשים בדרך. MiaMe תהיה הבית הדיגיטלי לכל הקו · עסקה אחת, מנוע אחד, אינסוף אפשרויות.
            </p>
            <div className="soon-cta">
              <WaCta cta="spyqe" variant="primary" block />
              <p className="soon-note">
                ההרשמה שומרת לכם מקום בתור ואינה מחייבת ברכישה · נעדכן אתכם ברגע
                שההזמנה נפתחת, עם המחיר והתנאים המלאים.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
