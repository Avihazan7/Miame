"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";

const VehicleModelStage = dynamic(
  () => import("./VehicleModelStage").then((mod) => mod.VehicleModelStage),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[540px] items-center justify-center rounded-[2rem] border border-cyan-100 bg-white/75 text-sm font-semibold text-slate-600 shadow-xl">
        מכין תצוגת 3D…
      </div>
    ),
  }
);

export type VehicleMediaImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  label?: string;
};

export type VehicleMediaModel = {
  glbUrl?: string;
  usdzUrl?: string;
  posterUrl?: string;
};

export type UltraVehicleMedia = {
  id: string;
  make: string;
  model: string;
  trim?: string;
  year?: number;
  dealScore?: number;
  monthlyPaymentLabel?: string;
  cover: VehicleMediaImage;
  gallery: VehicleMediaImage[];
  spin360?: VehicleMediaImage[];
  model3d?: VehicleMediaModel;
  badges?: string[];
};

type TabKey = "photos" | "spin" | "model";

type Props = {
  media: UltraVehicleMedia;
  brand?: "ulease" | "miame";
  className?: string;
  onInteraction?: (event: {
    type: "gallery_view" | "spin360_view" | "model3d_view" | "cta_click";
    vehicleId: string;
    payload?: Record<string, unknown>;
  }) => void;
};

const brandCopy = {
  ulease: {
    eyebrow: "ULease Ultra Vehicle Vision",
    cta: "קבל הצעת ליסינג חכמה",
    accent: "from-cyan-500 to-teal-500",
  },
  miame: {
    eyebrow: "MiaMe X4 Freedom Studio",
    cta: "שריין תצוגת MiaMe",
    accent: "from-sky-400 to-cyan-500",
  },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function useSpin360(frames: VehicleMediaImage[] = []) {
  const [index, setIndex] = useState(0);
  const pointer = useRef<{ startX: number; startIndex: number; active: boolean }>({
    startX: 0,
    startIndex: 0,
    active: false,
  });

  const current = frames[index] ?? frames[0];

  return {
    index,
    current,
    bind: {
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointer.current = { startX: event.clientX, startIndex: index, active: true };
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        if (!pointer.current.active || frames.length < 2) return;
        const delta = event.clientX - pointer.current.startX;
        const next = Math.round(pointer.current.startIndex + delta / 9);
        const normalized = ((next % frames.length) + frames.length) % frames.length;
        setIndex(normalized);
      },
      onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
        pointer.current.active = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      },
      onPointerCancel: () => {
        pointer.current.active = false;
      },
    },
  };
}

export function UltraVehicleMediaStage({
  media,
  brand = "ulease",
  className,
  onInteraction,
}: Props) {
  const [tab, setTab] = useState<TabKey>("photos");
  const [activeImage, setActiveImage] = useState(0);
  const spin = useSpin360(media.spin360);
  const copy = brandCopy[brand];

  const allImages = useMemo(() => {
    const merged = [media.cover, ...(media.gallery ?? [])];
    return merged.filter(Boolean);
  }, [media.cover, media.gallery]);

  const hasSpin = Boolean(media.spin360?.length);
  const has3d = Boolean(media.model3d?.glbUrl);
  // Only surface the tab row when there is more than one view to switch between.
  // For a photos-only vehicle this hides the bar entirely — a clean image, no
  // empty "coming soon" chips.
  const tabCount = 1 + (hasSpin ? 1 : 0) + (has3d ? 1 : 0);

  function selectTab(next: TabKey) {
    setTab(next);
    if (next === "photos") onInteraction?.({ type: "gallery_view", vehicleId: media.id });
    if (next === "spin") onInteraction?.({ type: "spin360_view", vehicleId: media.id });
    if (next === "model") onInteraction?.({ type: "model3d_view", vehicleId: media.id });
  }

  return (
    <section
      className={cx(
        "relative isolate overflow-hidden rounded-[2.5rem] border border-cyan-100/80 bg-white/75 p-4 shadow-[0_30px_100px_rgba(15,23,42,.12)] backdrop-blur-2xl md:p-6",
        className
      )}
      dir="rtl"
    >
      <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-12 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="min-w-0">
          {tabCount > 1 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => selectTab("photos")}
                className={cx(
                  "rounded-full px-5 py-2 text-sm font-bold transition",
                  tab === "photos"
                    ? "bg-slate-950 text-white shadow-lg"
                    : "bg-white/80 text-slate-700 ring-1 ring-cyan-100 hover:bg-cyan-50"
                )}
              >
                תמונות
              </button>

              {hasSpin && (
                <button
                  onClick={() => selectTab("spin")}
                  className={cx(
                    "rounded-full px-5 py-2 text-sm font-bold transition",
                    tab === "spin"
                      ? "bg-slate-950 text-white shadow-lg"
                      : "bg-white/80 text-slate-700 ring-1 ring-cyan-100 hover:bg-cyan-50"
                  )}
                >
                  360° VR
                </button>
              )}

              {has3d && (
                <button
                  onClick={() => selectTab("model")}
                  className={cx(
                    "rounded-full px-5 py-2 text-sm font-bold transition",
                    tab === "model"
                      ? "bg-slate-950 text-white shadow-lg"
                      : "bg-white/80 text-slate-700 ring-1 ring-cyan-100 hover:bg-cyan-50"
                  )}
                >
                  3D Pro
                </button>
              )}
            </div>
          )}

          {tab === "photos" && (
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-100 shadow-2xl">
              <Image
                src={allImages[activeImage]?.url ?? media.cover.url}
                alt={allImages[activeImage]?.alt ?? `${media.make} ${media.model}`}
                width={1800}
                height={1200}
                priority
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="aspect-[16/10] h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950/80 to-transparent p-5 text-white">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-200">
                    {copy.eyebrow}
                  </p>
                  <h2 className="mt-2 text-3xl font-black md:text-5xl">
                    {media.make} {media.model}
                  </h2>
                </div>
                {media.dealScore ? (
                  <div className="rounded-3xl border border-white/20 bg-white/15 px-5 py-4 text-center backdrop-blur-xl">
                    <div className="text-4xl font-black">{media.dealScore}</div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                      Deal Score
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {tab === "spin" && spin.current && (
            <div
              {...spin.bind}
              className="relative cursor-ew-resize touch-none overflow-hidden rounded-[2rem] border border-cyan-100 bg-[radial-gradient(circle_at_50%_12%,rgba(52,180,235,.2),transparent_38%),#f7fcff] shadow-2xl"
              aria-label="360 degree vehicle viewer"
            >
              <Image
                src={spin.current.url}
                alt={spin.current.alt}
                width={1800}
                height={1200}
                draggable={false}
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="aspect-[16/10] w-full select-none object-contain p-6"
              />
              <div className="absolute inset-x-6 bottom-6 rounded-full border border-white/70 bg-white/75 px-5 py-3 text-center text-sm font-bold text-slate-700 shadow-xl backdrop-blur-xl">
                גרור ימינה/שמאלה לסיבוב 360° · פריים {spin.index + 1}/{media.spin360?.length}
              </div>
            </div>
          )}

          {tab === "model" && media.model3d?.glbUrl && (
            <VehicleModelStage
              glbUrl={media.model3d.glbUrl}
              posterUrl={media.model3d.posterUrl}
              title={`${media.make} ${media.model} 3D model`}
            />
          )}
        </div>

        <aside className="relative rounded-[2rem] border border-cyan-100 bg-white/80 p-5 shadow-xl backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">
            {copy.eyebrow}
          </p>
          <h3 className="mt-3 text-3xl font-black text-slate-950">
            {media.year ? `${media.year} ` : ""}
            {media.make} {media.model}
          </h3>
          {media.trim ? <p className="mt-1 text-lg font-semibold text-slate-500">{media.trim}</p> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {(media.badges ?? ["תמונות 4K", hasSpin ? "VR 360°" : "גלריה", has3d ? "3D" : "CDN"]).map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-900"
                >
                  {badge}
                </span>
              )
            )}
          </div>

          {media.monthlyPaymentLabel ? (
            <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <p className="text-sm font-semibold text-cyan-200">החל מ־</p>
              <p className="mt-1 text-4xl font-black">{media.monthlyPaymentLabel}</p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-4 gap-2">
            {allImages.slice(0, 8).map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                onClick={() => {
                  setActiveImage(index);
                  selectTab("photos");
                }}
                className={cx(
                  "overflow-hidden rounded-2xl border bg-white transition hover:scale-[1.02]",
                  activeImage === index ? "border-cyan-500 ring-2 ring-cyan-200" : "border-cyan-100"
                )}
                aria-label={`Open image ${index + 1}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={240}
                  height={180}
                  className="aspect-square w-full object-cover"
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => onInteraction?.({ type: "cta_click", vehicleId: media.id })}
            className={cx(
              "mt-7 w-full rounded-2xl bg-gradient-to-l px-6 py-4 text-lg font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl",
              copy.accent
            )}
          >
            {copy.cta}
          </button>

          <p className="mt-4 text-center text-xs font-semibold text-slate-400">
            Powered by Leasing.co.il · Ultra media layer
          </p>
        </aside>
      </div>
    </section>
  );
}
