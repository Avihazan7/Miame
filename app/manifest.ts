import type { MetadataRoute } from "next";

// PWA / install manifest. Deep-navy anchors the brand on the home-screen and PWA
// splash; the icon is the sharp mint-on-navy monogram. Raster PNGs (192/512 +
// maskable-512) are mandatory for installability — SVG alone is not enough.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MiaMe.co.il — Free Feel",
    short_name: "MiaMe",
    description: "MiaMe, ניידות חשמלית פרימיום, MIA FOUR, קנייה, ליסינג והשכרה.",
    start_url: "/",
    display: "standalone",
    background_color: "#04121F",
    theme_color: "#04121F",
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
