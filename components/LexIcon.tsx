// components/LexIcon.tsx — MiaMe Brand Lexicon icon (Ultra Master Hero Gate V3).
//
// A thin, decorative renderer for the brand glyphs in public/brand/lexicon/sprite.svg.
// The icons are ALWAYS aria-hidden — the meaning lives in the surrounding text, so
// this never adds a system emoji to the DOM (V3 §1.1). Color comes from CSS
// `color` (currentColor); bolt/butterfly carry a fixed brand gradient.

export type LexName =
  | "check"
  | "liberty"
  | "m-roundel"
  | "bolt"
  | "p-roundel"
  | "globe"
  | "butterfly"
  | "cart"
  | "handshake"
  | "recycle"
  | "gift"
  | "phone"
  | "pin"
  | "shield"
  | "search"
  | "trophy"
  | "wrench"
  | "percent"
  | "chat"
  | "receipt"
  | "clipboard"
  | "wheel"
  | "brake";

export default function LexIcon({
  name,
  className,
}: {
  name: LexName;
  className?: string;
}) {
  return (
    <svg
      className={className ? `lex-icon ${className}` : "lex-icon"}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`/brand/lexicon/sprite.svg#${name}`} />
    </svg>
  );
}
