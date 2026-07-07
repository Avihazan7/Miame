// components/TrustSignalBar.tsx — a compact, non-interactive row of real trust
// signals, placed high on the page (before user fatigue). Each label is a
// checkable fact grounded in the site's own content (LegalStatus · seo-pages ·
// models) — not a marketing superlative. Server component: pure display.

import { TRUST_SIGNALS } from "@/lib/deal-buzz";

export default function TrustSignalBar() {
  return (
    <section className="trustbar" aria-label="סימני אמון ואחריות">
      <div className="wrap trustbar-inner">
        {TRUST_SIGNALS.map((s) => (
          <span className="trust-item" key={s.label}>
            {s.icon && (
              <span className="trust-ic" aria-hidden="true">
                {s.icon}
              </span>
            )}
            <span>{s.label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
