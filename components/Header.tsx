import { buildWhatsAppUrl } from "@/lib/whatsapp";
import WaIcon from "./WaIcon";

export default function Header() {
  const waUrl = buildWhatsAppUrl("היי MiaMe, אשמח לפרטים על הדגמים 🙂");
  return (
    <header className="site-header">
      <div className="wrap nav">
        <div className="brand">
          <span className="logo">
            Mia<span className="dot">Me</span>
          </span>
          <span className="brand-tag">Free Feel</span>
        </div>
        <nav className="nav-cta">
          <a href="#features" className="nav-link hide-m">יכולות</a>
          <a href="#models" className="nav-link hide-m">דגמים</a>
          <a href="#sim" className="nav-link hide-m">סימולטור</a>
          <a href="#partner" className="nav-link hide-m">שותף עסקי</a>
          <a href={waUrl} target="_blank" rel="noopener" className="btn btn-wa btn-sm">
            <WaIcon size={18} />
            דברו איתי
          </a>
        </nav>
      </div>
    </header>
  );
}
