import type { Metadata } from "next";
import "./marketplace-preview.css";
import { TRUST_COPY } from "@/lib/marketplace-preview";
import SpatialHeroSlot from "@/components/marketplace/SpatialHeroSlot";
import MarketplaceLeadFlow from "@/components/marketplace/MarketplaceLeadFlow";

// M30.1 — demo-safe marketplace preview. A standalone, NON-INDEXED surface that showcases
// the calm lead flow, the agentic skeleton, and the spatial-ready hero slot WITHOUT any
// live action: no provider, no Supabase write, no network, no supplier transfer.
export const metadata: Metadata = {
  title: "תצוגת מרקטפלייס (דמו)",
  description: "תצוגה מקדימה שקטה של זרימת ההתאמה — דמו בלבד, ללא שליחת פנייה.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/marketplace-preview" },
};

export default function MarketplacePreviewPage() {
  return (
    <main id="main" className="mp-page">
      <header className="mp-head">
        <div className="mp-eyebrow">תצוגה מקדימה · דמו</div>
        <h1 className="mp-title">התאמה שקטה בין הצורך שלך להצעות ספקים</h1>
        <p className="mp-sub">
          זרימה מדורגת ורגועה — בלי טופס מאיים, בלי לחץ, ובלי שליחת פנייה בפועל.
        </p>
      </header>

      <p className="mp-trust">{TRUST_COPY}</p>

      <SpatialHeroSlot />

      <MarketplaceLeadFlow />
    </main>
  );
}
