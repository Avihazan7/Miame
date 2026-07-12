import { buildWhatsAppUrl } from "@/lib/whatsapp";
import LexIcon from "@/components/LexIcon";
import WaIcon from "./WaIcon";

// Eilat / Green Extreme activity point. Wording is deliberately careful — a
// planned activity/experience point, NOT an "official branch" (no such claim
// until a signed agreement). Only publicly-known facts are stated in copy.
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("גרין אקסטרים פארק הטרמינל אילת דרך הערבה 3");

const FACTS = [
  "פארק הטרמינל · דרך הערבה 3, אילת",
  "אטרקציות 16:00–22:00",
  "Green Extreme · חוויה חשמלית לכל המשפחה",
];

export default function EilatBranch() {
  const wa = buildWhatsAppUrl(
    "היי MiaMe, אשמח לבדוק מחיר אילת וזמינות סביב Green Extreme 🙂"
  );

  return (
    <section className="block eilat-branch" id="eilat" aria-labelledby="eilat-title">
      <div className="wrap">
        <div className="eilat-card">
          <span className="eilat-kicker">
            <LexIcon name="recycle" /> אילת · Green Extreme
          </span>
          <h2 className="eilat-title" id="eilat-title">
            MiaMe × Green Extreme, נקודת הפעילות שלנו באילת
          </h2>
          <p className="eilat-copy">
            מתחם Green Extreme בפארק הטרמינל אילת מתוכנן להיות נקודת החוויה והפעילות של
            MiaMe באילת, מקום חי, חשמלי, ירוק ואקסטרימי שמחבר בין תצוגה, נסיעת היכרות
            וחוויית Free Feel אמיתית. מחיר אילת זמין בכפוף לדין, מקום העסקה, תנאי החברה
            והפקת חשבונית כדין.
          </p>

          <div className="eilat-facts">
            {FACTS.map((f) => (
              <div className="eilat-fact" key={f}>
                {f}
              </div>
            ))}
          </div>

          <div className="eilat-actions">
            <a href="/#sim" className="btn btn-primary">
              בדוק מחיר אילת
            </a>
            <a href={wa} target="_blank" rel="noopener" className="btn btn-light">
              <WaIcon size={20} />
              דברו איתי על אילת
            </a>
            <a href={MAPS_URL} target="_blank" rel="noopener" className="btn btn-ghost">
              נווטו ל-Green Extreme
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
