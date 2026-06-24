import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default function TestRide() {
  return (
    <section className="block" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="testride-card">
          <div className="testride-txt">
            <div className="testride-kicker">חוויה לפני הכל</div>
            <div className="testride-title">רוצים להרגיש את זה?</div>
            <p className="testride-sub">
              קבעו תיאום אישי, עלו על מיה פור, ותרגישו את החופש לפני שאתם מחליטים.
            </p>
          </div>
          <a
            className="btn btn-testride"
            href={buildWhatsAppUrl("היי, אשמח לתאם נסיעת מבחן על מיה פור 🛵")}
            target="_blank"
            rel="noopener noreferrer"
          >
            תיאום נסיעת מבחן
          </a>
        </div>
      </div>
    </section>
  );
}
