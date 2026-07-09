import type { MetadataRoute } from "next";

// PWA / install manifest. Deep-navy anchors the brand on the home-screen and PWA
// splash; the icon is the sharp mint-on-navy monogram (app/icon.svg).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MiaMe.co.il — Free Feel",
    short_name: "MiaMe",
    description: "MiaMe — ניידות חשמלית פרימיום, MIA FOUR, קנייה, ליסינג והשכרה.",
    start_url: "/",
    display: "standalone",
    background_color: "#081B33",
    theme_color: "#081B33",
    lang: "he",
    dir: "rtl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
