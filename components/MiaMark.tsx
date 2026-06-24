/**
 * MiaMark — the MiaMe / MIA geometric brand glyph as a crisp vector.
 *
 * Rendered with `fill="currentColor"` so it can be tinted to any תכלת shade
 * (sky → cyan → azure) and scaled to any size without losing sharpness.
 * Used both in the enlarged header/footer logo lockup and as the scattered
 * "touch" mark across the site background.
 */
export default function MiaMark({
  className,
  size = 28,
  title
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="currentColor"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      {/* three forward-leaning blades — motion / "free feel" */}
      <path d="M34 18 H58 L30 96 H6 Z" />
      <path d="M62 10 H100 L70 110 H40 Z" opacity="0.92" />
      <path d="M104 26 H124 L100 90 H80 Z" opacity="0.85" />
      {/* accent triangle — the spark */}
      <path d="M6 100 H30 L6 122 Z" opacity="0.8" />
    </svg>
  );
}
