import MiaMark from "./MiaMark";
import LexIcon from "@/components/LexIcon";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-brand">
          <span className="foot-mark">
            <MiaMark size={46} title="MiaMe" />
          </span>
          <div className="foot-logo">
            Mia<span className="dot">Me</span>
          </div>
        </div>
        <div className="foot-tag">
          <LexIcon name="butterfly" /> Free Feel
          <span className="sep">·</span>
          <LexIcon name="globe" /> MiaMe.co.il
        </div>
        <div className="foot-powered">
          מבוסס מנוע העסקאות של{" "}
          <a href="https://www.leasing.co.il" target="_blank" rel="noopener">
            <b>Leasing.co.il</b>
          </a>{" "}
        </div>
        <nav className="foot-links" aria-label="עמודי מידע">
          <a href="/mia-four">מיה פור</a>
          <a href="/klnoit-4-galgalim">קלנועית 4 גלגלים</a>
          <a href="/klnoit-mitkapelet">קלנועית מתקפלת</a>
          <a href="/klnoit-shetach">קלנועית שטח</a>
          {/* The footer is this site's reachability floor: it renders on every content
              page and nothing in it is hidden at any width — unlike the header's nav
              links, which carry `hide-m` and vanish under 720px. Both routes below are
              an indexable page in the sitemap that no visitor could click on a phone:
              its only anchor was that hidden header link. Served, submitted, unreachable.

              /rent-eilat is NOT here on purpose. It is unpromoted by owner decision
              (84e6ec5, which pulled the rental fork out of the Free Feel block because
              it competed with the buy decision), and it is absent from the sitemap —
              so "served on a direct URL, not promoted" is the chosen third state, not
              a defect. Guarded by test/routeReachability.test.ts. */}
        </nav>
        <nav className="foot-links" aria-label="מידע משפטי">
          <a href="/legal/terms">תקנון ותנאי שימוש</a>
          <a href="/legal/privacy">מדיניות פרטיות</a>
          <a href="/legal/accessibility">הצהרת נגישות</a>
        </nav>
        <p className="foot-legal">
          המחירים, התשלומים החודשיים ותנאי המימון המוצגים באתר הם הערכה ראשונית
          בלבד לצורך התרשמות, ואינם מהווים הצעה מחייבת, ייעוץ או התחייבות למימון.
          התשלום החודשי המשוער מחושב כיתרה לאחר מקדמה, מחולקת למספר התשלומים שנבחר,
          ללא ריבית והצמדה, בכפוף לאישור עסקה. ההתקשרות הסופית, תנאיה והעמדת המימון כפופים לאישור פרטני
          ולחתימה על הסכם. כל הזכויות שמורות ל-Leasing.co.il · {year}.
        </p>
      </div>
    </footer>
  );
}
