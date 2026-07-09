import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWa from "@/components/FloatingWa";
import Partner from "@/components/Partner";

// Dedicated conversion route for the MiaMe Hub B2B partner funnel. Reuses the
// existing Partner section (with PartnerHubForm → existing public.partners table).
export const metadata: Metadata = {
  title: "MiaMe Hub · שותפות עסקית",
  description:
    "הפכו ל-MiaMe Hub: מודל שותפות רזה להפעלת צי השכרה רווחי — אתם מחזיקים את הצי, MiaMe מביאה את הביקוש. מלונות, אטרקציות ומתחמי תיירות מוזמנים.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "MiaMe Hub · פתחו נקודת השכרה/מכירה",
    description: "מודל שותפות רזה: אתם הבעלים, MiaMe מביאה את הביקוש. Success Fee מהפניות בלבד.",
    url: "/partners",
    type: "website",
  },
};

export default function PartnersPage() {
  return (
    <>
      <Header />
      <main id="main">
        <Partner />
      </main>
      <Footer />
      <FloatingWa />
    </>
  );
}
