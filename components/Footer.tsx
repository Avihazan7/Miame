import MiaMark from "./MiaMark";
import LexIcon from "@/components/LexIcon";
import Link from "next/link";

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
          <Link href="/mia-four">מיה פור</Link>
          <Link href="/klnoit-4-galgalim">קלנועית 4 גלגלים</Link>
          <Link href="/klnoit-mitkapelet">קלנועית מתקפלת</Link>
          <Link href="/klnoit-shetach">קלנועית שטח</Link>
          {/* The footer is this site's reachability floor: it renders on every content
              page and nothing in it is hidden at any width — unlike the header's nav
              links, which carry `hide-m` and vanish under 720px.

              /eligibility ADDED 2026-09-09. It was the owner's stated priority topic
              and it had exactly ONE inbound link in the whole tree: the deep-link at
              the bottom of <Tribute deepLink /> on the homepage, in the sixth of nine
              movements. From all four keyword landing pages and all three legal pages
              it was unreachable, and /legal/privacy — which sells nothing — carried
              eleven inbound links to its one. test/routeReachability.test.ts passed
              throughout, correctly: its rule is that ONE unhidden anchor exists, which
              is the floor for "can a visitor get there", not a link profile.

              The anchor text is the query, not the page's internal name. "מסלולי
              זכאות" told neither a visitor nor a crawler which authority or which
              vehicle this is about.

              /rent-eilat is NOT here: it was removed by owner decision on 2026-09-02
              and middleware.ts answers 410 for it. */}
          <Link href="/eligibility">קלנועית במימון משרד הביטחון</Link>
        </nav>
        <nav className="foot-links" aria-label="מידע משפטי">
          <Link href="/legal/terms">תקנון ותנאי שימוש</Link>
          <Link href="/legal/privacy">מדיניות פרטיות</Link>
          <Link href="/legal/accessibility">הצהרת נגישות</Link>
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
