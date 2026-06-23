import Image from "next/image";

function Ic({ d }: { d: string }) {
  return (
    <div className="feat-ic">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={d} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const PILLARS = [
  {
    d: "M13 3L4 14h6l-1 7 9-11h-6l1-7z",
    title: "עוצמה",
    text: "2 או 4 מנועים בהספק 1,800W כל אחד. סוללת ליתיום נשלפת 60V בקיבולת 25/35Ah, עם אפשרות להוספת סוללות להגדלת הטווח."
  },
  {
    d: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12c.6.6 1 1.3 1 2h6c0-.7.4-1.4 1-2a7 7 0 0 0-4-12z",
    title: "חדשנות",
    text: "מערכת מתלים מכנית פורצת דרך על פלטפורמה מוגנת פטנט. שיכוך מלא קדמי ואחורי לנסיעה יציבה ובטוחה בכל תוואי."
  },
  {
    d: "M21 7.5L12 3 3 7.5l9 4.5 9-4.5zM3 7.5v9l9 4.5 9-4.5v-9M12 12v9",
    title: "יעילות",
    text: "שחרור מהיר של הכיסא וקיפול הכידון ביד אחת. אחסון ושינוע נוחים גם ברכב קטן. אידיאלי לסיורים, תיירות ושילוח."
  }
];

const STATS = [
  { n: "1,800W", l: "לכל מנוע" },
  { n: "עד 4", l: "מנועים" },
  { n: "60V", l: "סוללה נשלפת" },
  { n: "פטנט", l: "פלטפורמה מוגנת" }
];

export default function Features() {
  return (
    <section className="block features-sec" id="features">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">הנדסה</div>
          <h2 className="sec-title">בנוי לשטח, חכם לעיר</h2>
          <p className="sec-desc">
            פלטפורמה מוגנת פטנט, מנועים עוצמתיים וסוללה נשלפת. הכל בכלי אחד.
          </p>
        </div>

        <div className="feat-show">
          <div className="feat-show-main">
            <Image src="/mia-four-side.webp" alt="MiaMe Four פרופיל" width={560} height={560} priority />
          </div>
          <div className="feat-show-detail">
            <Image src="/mia-four-wheel.webp" alt="צמיג שטח MiaMe Four" width={300} height={300} />
            <span className="feat-show-cap">צמיגי שטח · גלגלי סגסוגת</span>
          </div>
        </div>

        <div className="feat-grid">
          {PILLARS.map((p) => (
            <div className="feat-card" key={p.title}>
              <Ic d={p.d} />
              <div className="feat-title">{p.title}</div>
              <p className="feat-text">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="stat-strip">
          {STATS.map((s) => (
            <div className="stat" key={s.l}>
              <div className="stat-n">{s.n}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
