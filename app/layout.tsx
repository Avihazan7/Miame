import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import AmbientLight from "@/components/AmbientLight";
import MarkField from "@/components/MarkField";
import MotionFx from "@/components/MotionFx";
import HeroIntro from "@/components/HeroIntro";
import ScrollTop from "@/components/ScrollTop";
import StaffToolbar from "@/components/StaffToolbar";

// Gate the cinematic entrance before first paint (no flash, no-JS safe).
// Full sequence on first visit per session, a quick settle afterwards,
// and nothing at all for reduced-motion visitors.
const INTRO_GATE = `(function(){try{var d=document.documentElement;
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var s=sessionStorage.getItem('miame_intro');
d.classList.add('intro-go',s?'intro-quick':'intro-full');
sessionStorage.setItem('miame_intro','1');}catch(e){}})();`;

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap"
});

const SITE_URL = "https://www.miame.co.il";
// Social/OG preview: the branded lifestyle scene (real background, reads well in
// social cards). Product schema uses the clean cutout of the actual Mia FOUR X4.
const OG_IMAGE = "/mia-four-lifestyle.webp";
const PRODUCT_IMAGE = "/mia-four-x4-hero.webp";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MiaMe — החופש שלך על ארבעה גלגלים",
  description:
    "ניידות חשמלית פרימיום במחיר חכם. בנה הצעת תשלום מותאמת תוך דקה וקבל אותה ישירות בוואטסאפ. מבית Leasing.co.il.",
  keywords: ["MiaMe", "רכב חשמלי", "ניידות חשמלית", "ליסינג", "השכרה", "Leasing.co.il"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "MiaMe — החופש שלך על ארבעה גלגלים",
    description:
      "ניידות חשמלית פרימיום במחיר חכם. הצעת תשלום מותאמת תוך דקה, ישירות לוואטסאפ.",
    url: SITE_URL,
    siteName: "MiaMe",
    locale: "he_IL",
    type: "website",
    images: [
      { url: OG_IMAGE, width: 1200, height: 1200, alt: "MiaMe Four — ניידות חשמלית פרימיום" }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MiaMe — החופש שלך על ארבעה גלגלים",
    description:
      "ניידות חשמלית פרימיום במחיר חכם. הצעת תשלום מותאמת תוך דקה, ישירות לוואטסאפ.",
    images: [OG_IMAGE]
  },
  robots: { index: true, follow: true }
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": SITE_URL + "/#organization",
      name: "MiaMe",
      url: SITE_URL,
      logo: SITE_URL + "/miame-logo.webp",
      description: "ניידות חשמלית פרימיום במחיר חכם, מבית Leasing.co.il.",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+972-54-747-7477",
        contactType: "sales",
        areaServed: "IL",
        availableLanguage: ["he"]
      }
    },
    {
      "@type": "Product",
      "@id": SITE_URL + "/#product",
      name: "MiaMe Four",
      image: SITE_URL + PRODUCT_IMAGE,
      description:
        "רכב ניידות חשמלי פרימיום על פלטפורמה מוגנת פטנט, סוללת ליתיום נשלפת 60V ועד 4 מנועים.",
      brand: { "@type": "Brand", name: "MiaMe" },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "ILS",
        lowPrice: "19900",
        highPrice: "27900",
        offerCount: "3",
        availability: "https://schema.org/InStock",
        url: SITE_URL
      }
    },
    {
      "@type": "LocalBusiness",
      "@id": SITE_URL + "/#localbusiness",
      name: "MiaMe · חנות הדגל",
      image: SITE_URL + PRODUCT_IMAGE,
      url: SITE_URL,
      telephone: "+972-54-747-7477",
      address: {
        "@type": "PostalAddress",
        streetAddress: "אליעזר קפלן 21",
        addressLocality: "תל אביב",
        addressCountry: "IL"
      },
      priceRange: "₪₪"
    },
    {
      "@type": "FAQPage",
      "@id": SITE_URL + "/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "האם המימון ב-0% ריבית?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "כן, מסלולי התשלום הם ב-0% ריבית, בכפוף לאישור עסקה ולתנאי הספק."
          }
        },
        {
          "@type": "Question",
          name: "מה זמן האספקה?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "אספקה מיידית, בכפוף לזמינות מלאי."
          }
        },
        {
          "@type": "Question",
          name: "מהו טווח הנסיעה של מיה פור?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "טווח שימוש ריאלי עד 100 ק\"מ; נתון יצרן עד 120 ק\"מ. הסוללה נשלפת וניתנת להחלפה להגדלת הטווח."
          }
        },
        {
          "@type": "Question",
          name: "איך הופכים ל-MiaMe Hub?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "מודל שותפות רזה: אתם מחזיקים את הצי, MiaMe מביאה את הביקוש, ומשלמים 13% Success Fee מהפניות בלבד."
          }
        }
      ]
    }
  ]
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
        <ScrollTop />
        <AmbientLight />
        <MarkField />
        {children}
        <MotionFx />
        <HeroIntro />
        <StaffToolbar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </body>
    </html>
  );
}
