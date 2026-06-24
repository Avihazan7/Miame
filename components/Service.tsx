import { buildWhatsAppUrl } from "@/lib/whatsapp";

const DEALERS: [string, string, string][] = [
  ["אקו פאן", "הוד-השרון", "09-3730188"],
  ["אורבניקו", "תל-אביב", "03-7207220"],
  ["אורבן רייד", "תל-אביב", "051-2872267"],
  ["אורסל", "ראשון לציון", "052-6387509"],
  ["פול גזז", "אשקלון", "050-4525183"],
  ["אופני הבירה", "ירושלים", "02-5326699"],
  ["הר ריידר", "בית שמש", "054-8424101"],
  ["MIA בני ברק", "בני ברק", "050-4171552"],
  ["גלגל יציב", "כנות", "1-700-557-744"],
  ["MOTOATV", "כרמיאל", "053-4000100"],
  ["ElectricMove", "חצור הגלילית", "050-5949416"],
  ["מחסני חשמל", "אילת", "073-2540171"],
  ["All Mobile", "אילת", "054-9188871"],
  ["מייק בייק", "אילת", "053-6500174"]
];

export default function Service() {
  return (
    <section className="block service-sec" id="service">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">שירות ותחזוקה · ארצי</div>
          <h2 className="sec-title">רשת הפצה ושירות בכל הארץ</h2>
          <p className="sec-desc">
            מיה פור מיובאת רשמית על ידי MEU · Mayer Electric Utilities, עם הגב האמין של חמישה עשורים בענף הרכב. שירות, חלפים ותחזוקה זמינים בכל הארץ לאורך זמן.
          </p>
        </div>
        <div className="flagship">
          <span className="flagship-tag">חנות הדגל</span>
          <div className="flagship-body">
            <div className="flagship-name">MEU · אליעזר קפלן 21, תל אביב</div>
            <div className="flagship-meta">
              מתחם דה וינצ׳י · א׳–ה׳ 10:00–19:00 · ו׳ וערב חג 10:00–14:00
            </div>
          </div>
          <div className="flagship-btns">
            <a className="flagship-tel" href="tel:0778038321">
              📞 077-8038321
            </a>
            <a
              className="flagship-nav"
              href="https://waze.com/ul?q=אליעזר קפלן 21 תל אביב"
              target="_blank"
              rel="noopener"
            >
              📍 ניווט
            </a>
          </div>
        </div>
        <div className="map-embed">
          <iframe
            title="מפה · MEU · אליעזר קפלן 21, תל אביב"
            src="https://maps.google.com/maps?q=%D7%90%D7%9C%D7%99%D7%A2%D7%96%D7%A8%20%D7%A7%D7%A4%D7%9C%D7%9F%2021%20%D7%AA%D7%9C%20%D7%90%D7%91%D7%99%D7%91&hl=he&z=15&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        <p className="dealers-title">משווקים מורשים · לחצו לחיוג או ניווט 📍</p>
        <div className="dealers-grid">
          {DEALERS.map(([name, city, phone]) => (
            <div className="dealer" key={name + city}>
              <div className="dealer-info">
                <b>{name}</b>
                <span>
                  {city} · {phone}
                </span>
              </div>
              <div className="dealer-btns">
                <a className="dealer-btn" href={"tel:" + phone.replace(/[^0-9]/g, "")}>
                  📞 חיוג
                </a>
                <a
                  className="dealer-btn nav"
                  href={"https://waze.com/ul?q=" + encodeURIComponent(name + " " + city)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📍 ניווט
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="rental-strip">
          <b>רוצים לשכור מיה פור לפי שעה?</b>
          <span>החל מ־45 ₪ לשעה · אתרו נקודת השכרה קרובה ברשת MiaMe Hub</span>
          <div className="rental-cta">
            <a
              className="btn btn-light btn-block"
              href={buildWhatsAppUrl(
                "היי, אשמח לאתר נקודת השכרה של מיה פור קרובה אליי 🛵"
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              אתרו נקודת השכרה
            </a>
          </div>
        </div>
        <div className="service-brands">
          <span>MEU · Mayer Electric Utilities</span>
          <span>MIA Dynamics</span>
        </div>
      </div>
    </section>
  );
}
