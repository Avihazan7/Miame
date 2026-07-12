import { buildWhatsAppUrl } from "@/lib/whatsapp";
import WaIcon from "./WaIcon";

export default function StickyCta() {
  const waUrl = buildWhatsAppUrl("היי MiaMe, אשמח לפרטים ולהצעת תשלום 🦋");
  return (
    <div className="sticky-cta">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener"
        className="sticky-wa"
        aria-label="דברו איתנו בוואטסאפ"
      >
        <WaIcon size={24} />
      </a>
      <a href="#sim" className="btn btn-primary sticky-main">
        בדיקת התאמה
      </a>
    </div>
  );
}
