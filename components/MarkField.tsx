import MiaMark from "./MiaMark";

/**
 * MarkField — the scattered "מיה" mark as a quiet brand touch.
 *
 * A fixed, behind-content field of geometric cyan glyphs that drift slowly,
 * tinted across the תכלת range. Purely decorative: pointer-events none,
 * aria-hidden, and frozen for reduced-motion visitors (handled in CSS).
 */
const MARKS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function MarkField() {
  return (
    <div className="mark-field" aria-hidden="true">
      {MARKS.map((n) => (
        <span className={`fm fm-${n}`} key={n}>
          <MiaMark size={120} />
        </span>
      ))}
    </div>
  );
}
