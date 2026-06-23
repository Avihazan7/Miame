import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap"
});

const SITE_URL = "https://miame.co.il";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MiaMe — החופש שלך על ארבעה גלגלים",
  description:
    "ניידות חשמלית פרימיום במחיר חכם. בנה הצעת תשלום מותאמת תוך דקה וקבל אותה ישירות בוואטסאפ. מבית Leasing.co.il.",
  keywords: ["MiaMe", "רכב חשמלי", "ניידות חשמלית", "ליסינג", "השכרה", "Leasing.co.il"],
  openGraph: {
    title: "MiaMe — החופש שלך על ארבעה גלגלים",
    description:
      "ניידות חשמלית פרימיום במחיר חכם. הצעת תשלום מותאמת תוך דקה, ישירות לוואטסאפ.",
    url: SITE_URL,
    siteName: "MiaMe",
    locale: "he_IL",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>{children}</body>
    </html>
  );
}
