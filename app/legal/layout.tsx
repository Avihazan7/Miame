import Link from "next/link";
import MiaMark from "@/components/MiaMark";
import Footer from "@/components/Footer";

// Shared chrome for the policy pages (תקנון · פרטיות · נגישות): a slim brand bar
// back to the storefront and the standard footer. Each page supplies its own
// <main className="legal"> content and metadata.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="wrap nav">
          <Link href="/" className="brand" aria-label="MiaMe — לדף הבית">
            <span className="brand-mark">
              <MiaMark size={34} title="MiaMe" />
            </span>
            <span className="logo">
              Mia<span className="dot">Me</span>
            </span>
          </Link>
          <Link href="/" className="nav-link">
            חזרה לאתר
          </Link>
        </div>
      </header>
      {children}
      <Footer />
    </>
  );
}
