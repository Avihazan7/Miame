/**
 * The live vehicle_media_assets row does not hold bucket paths for its stills — it
 * holds ABSOLUTE URLs on our own origin. Measured against the MiaMe project on
 * 2026-09-01: cover_path is `https://www.miame.co.il/mia-four-x4-hero.webp`, and
 * all six gallery_paths have the same shape. lib/vehicle-media.ts passes an
 * absolute URL straight through — deliberately — so that is what reaches <Image>.
 *
 * next/image refuses any remote host that is not in `images.remotePatterns`, and
 * that allowlist is pinned to the MiaMe Supabase project on purpose. So the one row
 * that IS published throws `Invalid src prop` the moment a consumer renders it.
 *
 * Widening the allowlist to our own domain would be the wrong repair twice over: it
 * re-opens the optimizer to a second host, and it makes the optimizer fetch over the
 * network a file that is already sitting in public/. Folding our own origin away
 * turns the URL back into the root-relative path it always was, which next/image
 * optimises locally with no allowlist involved.
 *
 * Anything else — a Supabase storage URL, a genuinely third-party host — is returned
 * untouched, so this can never quietly re-host somebody else's asset.
 */
export const SELF_HOSTED_ORIGINS = [
  "https://www.miame.co.il",
  "https://miame.co.il",
] as const;

export function toSelfHostedPath(url: string): string {
  for (const origin of SELF_HOSTED_ORIGINS) {
    // The trailing slash matters: without it `https://www.miame.co.il.example/x`
    // would read as ours and be rewritten into a path we do not serve.
    if (url.startsWith(`${origin}/`)) return url.slice(origin.length);
  }
  return url;
}
