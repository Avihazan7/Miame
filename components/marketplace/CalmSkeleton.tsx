// M30.1 — Calm agentic skeleton. A VISUAL-ONLY loading state shown before the demo
// comparison cards. It renders shimmer placeholders + the approved reassurance copy.
// It must NEVER call AI, a provider, Supabase, OpenAI, Canva, ZeroLight, or any network
// endpoint — there is no fetch, no timer that loads data, no renderer here. Pure markup.

import { SKELETON_STEPS } from "@/lib/marketplace-preview";

export default function CalmSkeleton() {
  return (
    <div className="mp-skeleton" role="status" aria-live="polite">
      <div className="mp-skel-cards" aria-hidden="true">
        <div className="mp-skel-card" />
        <div className="mp-skel-card" />
        <div className="mp-skel-card" />
      </div>
      <div className="mp-skel-caption">
        {SKELETON_STEPS.map((line, i) => (
          <div key={line} className="mp-skel-line" data-i={i + 1}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
