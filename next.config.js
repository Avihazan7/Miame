/** @type {import('next').NextConfig} */

// The ONLY approved remote image host: the project's Supabase storage (vehicle
// media / GLB posters). Everything else on the landing page ships from /public.
// Derived from the env so a project move needs no code change; the fallback is
// the current project host (public by design — it is already in lib/supabase.ts).
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://thhyfwoeybkptxvbpcmg.supabase.co")
      .hostname;
  } catch {
    return "thhyfwoeybkptxvbpcmg.supabase.co";
  }
})();

// M3 security headers. CSP notes:
// - script-src needs 'unsafe-inline' (Next inline bootstrap + the intro gate; no
//   nonce infra yet) + the two marketing-pixel loaders + vercel.live (staff
//   toolbar / preview feedback).
// - connect-src covers Supabase (REST + storage + realtime), GA4 regional
//   collectors, Meta, and vercel.live's websocket.
// - frame-src allows the Google-Maps embed (components/Service.tsx), the
//   privacy-mode YouTube player for the cinematic stage (components/CinematicVideo.tsx),
//   and vercel.live; frame-ancestors allows vercel.live so preview commenting keeps
//   working while everyone else is denied.
// - img-src stays https:-broad on purpose: tracking pixels and the image
//   optimizer's remote fetches render from third-party hosts; the write-side
//   optimizer abuse is closed by the remotePatterns allowlist above.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://vercel.live wss://*.pusher.com",
      "frame-src https://maps.google.com https://www.google.com https://www.youtube-nocookie.com https://vercel.live",
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
