"use client";

// components/MarketingScripts.tsx — loads GA4 / Google Ads / Meta Pixel and
// captures first-touch attribution. Always mounted, but each tag renders only
// when its NEXT_PUBLIC_ id is set, so with no ids configured this adds a single
// cheap effect (UTM capture) and zero network/scripts — the live site is
// unchanged until marketing ids are added in Vercel.

import { useEffect } from "react";
import Script from "next/script";
import {
  GA4_ID,
  GOOGLE_ADS_ID,
  META_PIXEL_ID,
  hasGa4,
  hasGoogleAds,
  hasMetaPixel,
  readConsent,
  setConsent
} from "@/lib/marketing";
import { captureUtm } from "@/lib/utm";

export default function MarketingScripts() {
  useEffect(() => {
    // First-touch attribution runs on every load, independent of any pixel, so
    // the WhatsApp funnel + Supabase CRM always know the campaign that sent the
    // visitor.
    captureUtm();
    // Re-apply a prior consent choice onto the freshly-loaded tags. Consent Mode
    // boots statically as "denied" (below) to avoid any SSR/client mismatch;
    // returning visitors who already accepted get re-granted here.
    if (readConsent() === "granted") setConsent("granted");
  }, []);

  const gtagId = GA4_ID || GOOGLE_ADS_ID;

  return (
    <>
      {gtagId && (
        <>
          <Script
            id="gtag-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
${hasGa4 ? `gtag('config','${GA4_ID}',{anonymize_ip:true});` : ""}
${hasGoogleAds ? `gtag('config','${GOOGLE_ADS_ID}');` : ""}`}
          </Script>
        </>
      )}

      {hasMetaPixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('consent','revoke');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
