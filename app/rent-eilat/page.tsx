import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWa from "@/components/FloatingWa";
import RentalFleet from "@/components/RentalFleet";
import EilatBranch from "@/components/EilatBranch";

// Dedicated conversion route for the Eilat / Green Extreme rental funnel. Reuses
// the existing rental modules; the homepage keeps only a reduced secondary link.
export const metadata: Metadata = {
  title: "השכרת MIA FOUR באילת · Green Extreme",
  description:
    "השכרת ניידות חשמלית MiaMe באילת לפי שעה, סביב מתחם Green Extreme בפארק הטרמינל. זמינות, מחיר ותנאים כפופים לאישור הסניף.",
  alternates: { canonical: "/rent-eilat" },
  openGraph: {
    title: "MiaMe באילת · השכרה לפי שעה · Green Extreme",
    description: "צי MiaMe להשכרה באילת — חוויית Free Feel חשמלית, ירוקה ומשפחתית.",
    url: "/rent-eilat",
    type: "website",
  },
};

export default function RentEilatPage() {
  return (
    <>
      <Header />
      <main id="main">
        <RentalFleet />
        <EilatBranch />
      </main>
      <Footer />
      <FloatingWa />
    </>
  );
}
