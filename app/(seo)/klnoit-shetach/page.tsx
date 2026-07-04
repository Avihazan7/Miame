import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLanding from "@/components/seo/SeoLanding";
import { getSeoPage } from "@/lib/seo-pages";

const page = getSeoPage("klnoit-shetach")!;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: `/${page.slug}` },
  openGraph: {
    title: page.title,
    description: page.description,
    url: `/${page.slug}`,
    type: "article",
    images: [{ url: page.hero.image, alt: page.hero.alt }]
  },
  robots: { index: true, follow: true }
};

export default function Page() {
  const p = getSeoPage("klnoit-shetach");
  if (!p) notFound();
  return <SeoLanding page={p} />;
}
