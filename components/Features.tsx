function Ic({ d }: { d: string }) {
  return (
    <div className="feat-ic">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={d} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ValIc({ d }: { d: string }) {
  return (
    <div className="value-ic">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={d} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function TruckIcon() {
  return (
    <svg className="db-ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

const VALUES = [
  { d: "M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9", n: "נוחיות", s: "קיפול ביד אחת · 42 ק״ג" },
  { d: "M12 3l8 4v5c0 4.5-3.5 7.5-8 9-4.5-1.5-8-4.5-8-9V7zM9 12l2 2 4-4", n: "בטיחות & איכות", s: "אחריות יבואן · תקן EN17128" },
  { d: "M13 2L4 14h6l-1 8 9-12h-6z", n: "עוצמתיות", s: "עד 4 מנועים · 1,800W" },
  { d: "M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM8.2 11.2L7 22l5-3 5 3-1.2-10.8", n: "אמינות", s: "MIA Dynamics · גב יבואן" }
];

export default function Features() {
  return (
    <section className="block features-sec" id="features">
      <div className="wrap">
        <div className="deliver-wrap">
          <span className="deliver-banner">
            <TruckIcon />
            <span>
              משלוח <b>MIA FOUR</b> עד אליך — <span className="db-free">עלינו.</span>
            </span>
          </span>
        </div>

        <div className="sec-head">
          <div className="sec-kicker">הנדסה</div>
          <h2 className="sec-title">בנוי לשטח, חכם לעיר</h2>
          <p className="sec-desc">
            פלטפורמה מוגנת פטנט, מנועים עוצמתיים וסוללה נשלפת. הכל בכלי אחד.
          </p>
        </div>

        <div className="feat-show">
          <div className="feat-show-main photo-frame">
            <img src="/mia-fold-trunk.jpg" alt="מיה פור מתקפלת ונכנסת לתא המטען" loading="lazy" />
            <span className="photo-tag">מתקפל · נייד</span>
            <div className="photo-cap">
              <b>מתקפל ונכנס לתא המטען</b>
              <span>42 ק״ג · מהבית לשטח, בלי טריילר</span>
            </div>
          </div>
          <div className="feat-show-detail photo-frame">
            <img src="/mia-studio.jpg" alt="מיה פור · עיצוב פרימיום" loading="lazy" />
            <div className="photo-cap">
              <b>MIA FOUR</b>
              <span>עיצוב פרימיום · פלטפורמת 4×4</span>
            </div>
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

        <div className="value-strip">
          {VALUES.map((v) => (
            <div className="value" key={v.n}>
              <ValIc d={v.d} />
              <div className="value-n">{v.n}</div>
              <div className="value-s">{v.s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
