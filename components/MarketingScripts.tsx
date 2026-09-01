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
  TIKTOK_PIXEL_ID,
  hasGa4,
  hasGoogleAds,
  hasMetaPixel,
  hasTikTokPixel,
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

      {/* TikTok. Boots with consent REVOKED, exactly like Meta's above: the tag
          loads so a later grant can act on it, but it measures nothing until the
          visitor says yes. Anything else would make the consent banner a
          decoration. */}
      {hasTikTokPixel && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${TIKTOK_PIXEL_ID}');
ttq.disableCookie();
ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}
