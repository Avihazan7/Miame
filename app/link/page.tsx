// app/link/page.tsx — the link-in-bio hub. The destination every social profile points at.
//
// WHY THIS EXISTS AT ALL. Instagram and TikTok give a profile ONE link. Sending it to
// the homepage wastes the click for anyone who came for a specific thing; sending each
// network to its own landing page would create three near-identical URLs competing with
// the real pages for the same Hebrew keywords — doorway pages, which Google penalises
// and which split the authority the links were meant to build. So: one hub, three
// UTM-tagged links into it, and the message — not the URL — is what varies by network.
//
// `noindex, follow` is deliberate and both halves carry weight. `noindex`: this page
// should never appear in a SERP, because for every query it could win, a better page of
// ours already exists. `follow`: link equity arriving from the profiles passes THROUGH
// this hub into those pages. Flipping either one breaks the design — index and it
// competes; nofollow and it absorbs.
import type { Metadata } from "next";
import Link from "next/link";
import { HUB_DESTINATIONS, channelFor } from "@/lib/social-campaign";
import WaCta from "@/components/WaCta";

export const metadata: Metadata = {
  title: "MiaMe · הקישורים",
  description: "מיה פור · ניידות חשמלית פרימיום. הצעת תשלום מותאמת תוך דקה, ישירות לוואטסאפ.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/link" },
  // A hub travels by being pasted, so it needs its own share card. Without one it
  // inherits the root layout's — announcing the homepage's title AND og:url, so the
  // preview describes a different page than the one being opened.
  openGraph: {
    title: "MiaMe · מיה פור",
    description: "ניידות חשמלית פרימיום במחיר חכם. הצעת תשלום מותאמת תוך דקה.",
    url: "/link",
    type: "website",
  },
};

export default function LinkHubPage({
  searchParams,
}: {
  searchParams?: { utm_source?: string };
}) {
  // The only thing the network changes. Unknown or absent source falls back to the
  // neutral copy rather than guessing — a wrong greeting is worse than none.
  const channel = channelFor(searchParams?.utm_source);

  return (
    <main id="main" className="block" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
      <div className="wrap" style={{ textAlign: "center", maxWidth: 520, padding: "40px 20px" }}>
        <h1 className="sec-title">{channel.headline}</h1>
        <p className="sec-desc" style={{ marginTop: 10 }}>{channel.sub}</p>

        <nav aria-label="קישורים" style={{ marginTop: 26, display: "grid", gap: 10 }}>
          {HUB_DESTINATIONS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className={d.primary ? "btn" : "btn btn-ghost"}
              style={{
                display: "grid",
                gap: 2,
                padding: "14px 18px",
                textAlign: "start",
                lineHeight: 1.3,
              }}
            >
              <span style={{ fontWeight: 700 }}>{d.label}</span>
              <span style={{ fontSize: 13, opacity: 0.75, fontWeight: 400 }}>{d.note}</span>
            </Link>
          ))}
        </nav>

        {/* The shared component, not a hand-rolled <a>. It fires WhatsAppClicked
            with this section's key, which is what keeps a click that arrived from
            a profile distinguishable from one that started on the homepage — the
            repo's own funnel guard caught this page doing it the other way. */}
        <div style={{ marginTop: 18 }}>
          <WaCta cta="social-hub" variant="light" />
        </div>

        <p className="ty-note" style={{ marginTop: 26 }}>
          המחירים, המפרטים והטווח מוצגים כנתוני יבואן/יצרן לצורך התרשמות, וכפופים לתנאי עסקה,
          זמינות מלאי ומפרט סופי. אינם מהווים הבטחה מוחלטת.
        </p>
      </div>
    </main>
  );
}
