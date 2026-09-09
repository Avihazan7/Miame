import type { MetadataRoute } from "next";

// PWA / install manifest. Raster PNGs (192/512 + maskable-512) are mandatory for
// installability — SVG alone is not enough.
//
// THE DESCRIPTION SOLD TWO PRODUCTS THAT DO NOT EXIST (fixed 2026-09-09). It read
// "MiaMe, ניידות חשמלית פרימיום, MIA FOUR, קנייה, ליסינג והשכרה." — advertising
// leasing AND rental. middleware.ts has answered 410 for /rent-eilat since
// 2026-09-02 with the note "Neither product exists", and public/llms.txt states
// flatly "MiaMe אינה משכירה ואינה מפעילה תוכנית שותפים". Two machine-readable files
// on the same origin contradicting each other is worse than either being wrong
// alone: an install prompt, an app-store-style listing and any crawler that reads
// the manifest were all still being offered the rental. It also opened on
// "ניידות חשמלית פרימיום" — the exact phrase app/layout.tsx struck from the meta
// description on 2026-09-01 as one nobody searches. The sales-campaign sweep read
// the components and the sitemap; nothing read this file. test/salesCampaign.test.ts
// now does.
//
// THEME COLOR TELLS THE TRUTH ABOUT WHAT IS PAINTED. theme_color was #04121F while
// app/globals.css:66 paints `html{background:var(--snow)}` = #ffffff and there is
// not one `prefers-color-scheme` rule in any stylesheet (:root pins
// `color-scheme:light`). So a phone in dark mode drew a near-black browser bar
// directly above a white page. background_color stays navy on purpose — that is the
// SPLASH, where the mint-on-navy monogram is shown, and it is a deliberate brand
// moment rather than a claim about the page.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MiaMe.co.il — Free Feel",
    short_name: "MiaMe",
    description:
      "מיה פור · קלנועית חשמלית על 4 גלגלים, מבית Leasing.co.il. בונים הצעת תשלום מותאמת תוך דקה ומקבלים אותה בוואטסאפ.",
    start_url: "/",
    display: "standalone",
    background_color: "#04121F",
    theme_color: "#FFFFFF",
    lang: "he",
    dir: "rtl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/miame-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/miame-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/miame-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
