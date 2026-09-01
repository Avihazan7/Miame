"use client";

// components/WaCta.tsx — the one WhatsApp button used across the site.
//
// One component, one behaviour: open the section's prefilled chat and fire a
// tracked WhatsAppClicked event carrying WHICH section produced it. That is the
// whole point of having a shared component — without it, per-section attribution
// drifts the moment someone hand-rolls another <a href={wa}>.

import { track } from "@/lib/analytics";
import { buildCampaignWhatsAppUrl } from "@/lib/whatsapp";
import { WA_CTA, waHref, type WaCtaKey } from "@/lib/wa-cta";
import WaIcon from "./WaIcon";

export default function WaCta({
  cta,
  variant = "light",
  block = false,
  label,
  className,
}: {
  cta: WaCtaKey;
  /** Visual tier — `primary` for the buying moment, `light`/`ghost` elsewhere. */
  variant?: "primary" | "light" | "ghost";
  block?: boolean;
  /** Override the default label (the prefilled message never changes). */
  label?: string;
  className?: string;
}) {
  const item = WA_CTA[cta];
  const classes = [
    "btn",
    `btn-${variant}`,
    block ? "btn-block" : "",
    "wa-cta",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      className={classes}
      href={waHref(cta)}
      target="_blank"
      rel="noopener noreferrer"
      data-wa={cta}
      data-intent={item.intent}
      onClick={(e) => {
        void track("WhatsAppClicked", { placement: cta, intent: item.intent });
        // The href above is rendered on the server, so the campaign the visitor
        // arrived on — which exists only in this browser's storage — cannot be
        // in it. Rebuild it here, while we still control the navigation, so the
        // campaign is in the message TEXT the rep opens: that is the only place
        // a human sorting WhatsApp can see that a lead was paid for. Nothing
        // leaves the device, and doing this during render instead would make the
        // server HTML and the first client render disagree.
        e.currentTarget.href = buildCampaignWhatsAppUrl(item.message);
      }}
    >
      <WaIcon size={19} />
      {label ?? item.label}
    </a>
  );
}
