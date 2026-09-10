import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLanding from "@/components/seo/SeoLanding";
import { getSeoPage } from "@/lib/seo-pages";
import { OG_BASE } from "@/lib/seo/og";

const page = getSeoPage("klnoit-4-galgalim")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: `/${page.slug}` },
  openGraph: {
    // OG_BASE first: Next replaces the whole openGraph object per route, so
    // og:site_name and og:locale — declared only in app/layout.tsx — were dropped
    // here. `images` below intentionally overrides OG_BASE's generic card: these
    // pages have their own photograph. width/height are the file's REAL intrinsic
    // pixels (asserted by test/seoHeroIntrinsic.test.ts), and without them a
    // scraper must fetch and decode the image before it can lay the card out —
    // which is why a first share often renders as a blank frame.
    ...OG_BASE,
    title: page.title,
    description: page.description,
    url: `/${page.slug}`,
    type: "article",
    images: [
      {
        url: (page.ogImage ?? page.hero).image,
        alt: (page.ogImage ?? page.hero).alt,
        width: (page.ogImage ?? page.hero).w,
        height: (page.ogImage ?? page.hero).h,
      },
    ],
  },
  robots: { index: true, follow: true }
};

export default function Page() {
  const p = getSeoPage("klnoit-4-galgalim");
  if (!p) notFound();
  return <SeoLanding page={p} />;
}
