import { buildWhatsAppUrl } from "@/lib/whatsapp";
import WaIcon from "./WaIcon";

export default function FloatingWa() {
  const url = buildWhatsAppUrl("היי MiaMe, אשמח לפרטים ולהצעת תשלום 🙂");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="wa-float"
      aria-label="דברו איתנו בוואטסאפ"
    >
      <WaIcon size={30} />
    </a>
  );
}
