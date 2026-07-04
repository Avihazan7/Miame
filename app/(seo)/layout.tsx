import Link from "next/link";
import MiaMark from "@/components/MiaMark";
import Footer from "@/components/Footer";
import FloatingWa from "@/components/FloatingWa";

// Shared chrome for the SEO landing pages: a slim brand bar back to the
// storefront, the standard footer, and the floating WhatsApp button — so every
// keyword entry point keeps the same conversion surface as the homepage.
export default function SeoLayout({ children }: { children: React.ReactNode }) {
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
          <Link href="/#sim" className="nav-link">
            סימולטור תשלומים
          </Link>
        </div>
      </header>
      {children}
      <Footer />
      <FloatingWa />
    </>
  );
}
