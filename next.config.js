/** @type {import('next').NextConfig} */

// The ONLY approved remote image host: MiaMe's governed Supabase storage.
 // URL + key are treated as one pair. A partial Vercel override, or a complete
 // override aimed at the central U.Lease project, falls back to MiaMe atomically.
const MIAME_SUPABASE_PROJECT_REF = "thhyfwoeybkptxvbpcmg";
const MIAME_SUPABASE_HOST = `${MIAME_SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseHost = (() => {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!envUrl || !envAnon) return MIAME_SUPABASE_HOST;

  try {
    const host = new URL(envUrl).hostname;
    return host === MIAME_SUPABASE_HOST ? host : MIAME_SUPABASE_HOST;
  } catch {
    return MIAME_SUPABASE_HOST;
  }
})();

// M3 security headers. CSP notes:
// - script-src needs 'unsafe-inline' (Next inline bootstrap + the intro gate; no
//   nonce infra yet) + the two marketing-pixel loaders + vercel.live (staff
//   toolbar / preview feedback).
// - connect-src covers Supabase (REST + storage + realtime), GA4 regional
//   collectors, Meta, and vercel.live's websocket.
// - frame-src covers ONLY the two privacy-mode YouTube players
//   (components/CinematicVideo.tsx, components/HowToVideo.tsx) and vercel.live.
//   The Google-Maps hosts were dropped when the sales campaign replaced the
//   flagship map embed with an inline SVG coverage illustration — no third-party
//   frame, no address leak. Do not re-add a map host without a live consumer.
//   frame-ancestors allows vercel.live so preview commenting keeps working while
//   everyone else is denied.
// - img-src stays https:-broad on purpose: tracking pixels and the image
//   optimizer's remote fetches render from third-party hosts; the write-side
//   optimizer abuse is closed by the remotePatterns allowlist above.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'wasm-unsafe-eval' permits WebAssembly compilation ONLY (three.js/@react-three
      // decoders for the lazy 3D product viewer) — it does NOT enable JS eval().
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://vercel.live wss://*.pusher.com",
      "frame-src https://www.youtube-nocookie.com https://vercel.live",
      "media-src 'self' blob: https://*.supabase.co",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self' https://vercel.live",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: supabaseHost }]
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  // Canonical host: apex (miame.co.il) → https://www.miame.co.il (308).
  //
  // The same redirect is also configured on the Vercel domain, but keeping it in
  // the repo makes the canonical reproducible and version-controlled (GitHub =
  // source of truth) so it survives a project rebuild / domain reattach instead
  // of living only as an invisible dashboard setting.
  //
  // Loop-safe: at request time Next matches the `host` value as an anchored regex
  // (`new RegExp("^" + value + "$")`) against the lowercased Host header. The dots
  // are escaped here (`miame\.co\.il`) so the value matches the bare apex
  // literally and ONLY the apex — the extra `www.` label cannot fit an anchored
  // apex pattern, and `*.vercel.app` previews / localhost never match. So this
  // rule is inert outside production. (The value is a regex, not a literal — an
  // unescaped `.` would be a single-char wildcard.)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'miame\\.co\\.il' }],
        destination: 'https://www.miame.co.il/:path*',
        permanent: true
      }
    ];
  }
};
module.exports = nextConfig;
