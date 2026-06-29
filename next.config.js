/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
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
