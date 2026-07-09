import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWa from "@/components/FloatingWa";
import Tribute from "@/components/Tribute";
import LegalStatus from "@/components/LegalStatus";

// Dedicated conversion route for the defence-forces eligibility funnel. Reuses the
// existing Tribute + LegalStatus sections; legal-safe wording, no automatic claims.
export const metadata: Metadata = {
  title: "זכאות כוחות הביטחון",
  description:
    "בדיקת התאמה וזכאות לנכי צה\"ל, נפגעי פעולות איבה ומשפחות שכולות. הזכאות, ההיקף והתנאים כפופים לאישור הגורם המוסמך ולדין.",
  alternates: { canonical: "/eligibility" },
  openGraph: {
    title: "MiaMe לזכאי כוחות הביטחון · בדיקת התאמה וזכאות",
    description: "ניידות חשמלית פרימיום לזכאי משרד הביטחון — בדיקת התאמה אישית, בכפוף לאישור.",
    url: "/eligibility",
    type: "website",
  },
};

export default function EligibilityPage() {
  return (
    <>
      <Header />
      <main id="main">
        <h1 className="sr-only">זכאות כוחות הביטחון · MiaMe</h1>
        <Tribute />
        <LegalStatus />
      </main>
      <Footer />
      <FloatingWa />
    </>
  );
}
