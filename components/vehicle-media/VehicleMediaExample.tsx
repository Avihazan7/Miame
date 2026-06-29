// VehicleMediaExample — the Supabase-DRIVEN mount of the Ultra stage (the data
// path, complementing the Configurator's static feed). An async server component:
// it fetches the curated media for a vehicle from /api/vehicles/[vehicleId]/media
// (Supabase-backed, ISR-cached 60s), maps the row to the stage's shape via the
// storage-URL helpers, and renders it. Drop <VehicleMediaExample vehicleId="…" />
// on any server page once that vehicle has a published vehicle_media_assets row.
import {
  UltraVehicleMediaStage,
  type UltraVehicleMedia,
} from "@/components/vehicle-media/UltraVehicleMediaStage";
import {
  supabasePublicFileUrl,
  supabasePublicImageUrl,
} from "@/lib/vehicle-media";

type ApiMedia = {
  id: string;
  make: string;
  model: string;
  trim?: string;
  year?: number;
  coverPath: string;
  galleryPaths: string[];
  spin360Paths: string[];
  glbPath?: string;
  usdzPath?: string;
  altText?: string;
};

function toUltraMedia(row: ApiMedia): UltraVehicleMedia {
  const alt = row.altText || `${row.make} ${row.model}`;

  return {
    id: row.id,
    make: row.make,
    model: row.model,
    trim: row.trim,
    year: row.year,
    cover: {
      url: supabasePublicImageUrl(row.coverPath, { width: 1800, quality: 86 }),
      alt,
    },
    gallery: row.galleryPaths.map((path, index) => ({
      url: supabasePublicImageUrl(path, { width: 1400, quality: 82 }),
      alt: `${alt} gallery image ${index + 1}`,
    })),
    spin360: row.spin360Paths.map((path, index) => ({
      url: supabasePublicImageUrl(path, { width: 1500, quality: 78 }),
      alt: `${alt} 360 frame ${index + 1}`,
    })),
    model3d: {
      glbUrl: row.glbPath ? supabasePublicFileUrl(row.glbPath) : undefined,
      usdzUrl: row.usdzPath ? supabasePublicFileUrl(row.usdzPath) : undefined,
      posterUrl: supabasePublicImageUrl(row.coverPath, { width: 1200, quality: 82 }),
    },
    badges: ["4K", "360° VR", "3D", "Deal Score Ready"],
  };
}

export async function VehicleMediaExample({ vehicleId }: { vehicleId: string }) {
  // Server component reading a PUBLIC NEXT_PUBLIC_ value to build an absolute
  // server-side fetch URL — no secret crosses to the client, so the client-bundle
  // secret-boundary lint doesn't apply here.
  // eslint-disable-next-line no-restricted-properties
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/vehicles/${vehicleId}/media`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;

  const payload = await res.json();
  const media = toUltraMedia(payload.media);

  return <UltraVehicleMediaStage media={media} brand="ulease" />;
}
