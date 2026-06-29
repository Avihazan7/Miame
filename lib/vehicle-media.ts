export type SupabaseImageOptions = {
  bucket?: string;
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

export function supabasePublicImageUrl(
  pathOrUrl: string,
  {
    bucket = "vehicle-media",
    width = 1600,
    height,
    quality = 82,
    resize = "contain",
  }: SupabaseImageOptions = {}
) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for vehicle media rendering.");
  }

  const url = new URL(
    `/storage/v1/render/image/public/${bucket}/${pathOrUrl.replace(/^\/+/, "")}`,
    supabaseUrl
  );

  url.searchParams.set("width", String(width));
  if (height) url.searchParams.set("height", String(height));
  url.searchParams.set("quality", String(quality));
  url.searchParams.set("resize", resize);

  return url.toString();
}

export function supabasePublicFileUrl(pathOrUrl: string, bucket = "vehicle-media") {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL for vehicle media rendering.");
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${pathOrUrl.replace(/^\/+/, "")}`;
}
