import type { Metadata } from "next";
import "./marketplace-preview.css";
import { TRUST_COPY, TRUST_TIE_IN } from "@/lib/marketplace-preview";
import SpatialHeroSlot from "@/components/marketplace/SpatialHeroSlot";
import HowItWorksFlow from "@/components/marketplace/HowItWorksFlow";
import MarketplaceLeadFlow from "@/components/marketplace/MarketplaceLeadFlow";
import LeasingTermsExplainer from "@/components/marketplace/LeasingTermsExplainer";

// M30.1 — demo-safe marketplace preview. A standalone, NON-INDEXED surface that showcases
// the calm lead flow, the agentic skeleton, and the spatial-ready hero slot WITHOUT any
// live action: no provider, no Supabase write, no network, no supplier transfer.
export const metadata: Metadata = {
  title: "תצוגת מרקטפלייס (דמו)",
  description: "תצוגה מקדימה שקטה של זרימת ההתאמה, דמו בלבד, ללא שליחת פנייה.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/marketplace-preview" },
  // A demo surface is shared by link more often than an indexed one, not less.
  // Without its own openGraph this page inherited the root layout's and showed
  // the homepage's title and og:url — a share card that promises the product
  // page and opens a demo. The "דמו" label belongs in the card too, so nobody
  // forwards this as the live marketplace. Next fills the X card from here.
  openGraph: {
    title: "תצוגת מרקטפלייס (דמו) · MiaMe",
    description: "תצוגה מקדימה שקטה של זרימת ההתאמה. דמו בלבד — לא נשלחת פנייה.",
    url: "/marketplace-preview",
    type: "website",
  },
};

export default function MarketplacePreviewPage() {
  return (
    <main id="main" className="mp-page">
      <header className="mp-head">
        <div className="mp-eyebrow">תצוגה מקדימה · דמו</div>
        <h1 className="mp-title">התאמה שקטה בין הצורך שלך להצעות ספקים</h1>
        <p className="mp-sub">
          זרימה מדורגת ורגועה, בלי טופס מאיים, בלי לחץ, ובלי שליחת פנייה בפועל.
        </p>
      </header>

      <p className="mp-trust">{TRUST_COPY}</p>

      <SpatialHeroSlot />

      <HowItWorksFlow />

      <p className="mp-tie-in">{TRUST_TIE_IN}</p>

      <MarketplaceLeadFlow />

      <LeasingTermsExplainer />
    </main>
  );
}
