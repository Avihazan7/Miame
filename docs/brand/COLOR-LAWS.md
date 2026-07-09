# Ultra Color P Master — Color Laws (M21-A11)

`styles/tokens.miame.css` is the **single source of truth** for color. No hex may be
authored outside it. Every foreground/background pair is measured to WCAG AA or better.
The visual board lives at `docs/brand/ULTRA-COLOR-P-MASTER.svg`.

## Semantic laws

- **חוק הזהב (Gold law).** Gold (`--ink-gold` on light, `--gold-bright` on dark)
  appears **only next to a monetary value** — price, saving, down-payment. Scarcity = value.
  Never decorative.
- **חוק המנטה (Mint law).** `--mint-zero` is used **only for risk-removal** copy
  ("ללא עלות", "0% ריבית", "ללא הצמדה") — always with `--mint-zero-ink` for the text.
- **חוק הקרח (Ice law).** `--glow-ice` / `--ink-blue` for **measurable data only** —
  range, speed, safety, spec.
- **חוק הזוהר (Glow law).** `--glow-teal` for **motion / energy / live-state** only —
  never running text, never on a light background.
- **Ratio 60·30·10.** neutrals · turquoise family · (gold + mint + ice).
- **Scroll narrative.** Hero (power) dark → Studio (offer) light → Gold (precision) →
  closes dark.

## Text-on-light rule

Bright accents (`#18E0BD` glow-teal, `#0ce5dd`) are **forbidden as text color** and
**forbidden on light backgrounds** — enforced by `scripts/verify-m21a.mjs`
(`/color:\s*#(18e0bd|0ce5dd)/i`). Text on light must use only `--ink-navy`,
`--ink-teal` (#0F6B5E), `--ink-gold` (#8A6D1F), or `--ink-blue` (#2E5E86).

## Simulator track coding (UI only, zero logic)

- Private → `--track-private` (glow-teal)
- Business → `--track-business` (gold-bright; down-payment shown in gold)
- Partner → `--track-partner` (glow-ice)

## Deprecated aliases

`--legacy-navy #081B33` and `--legacy-teal-ink #078c7b` are kept documented for
reference only. New code uses `--bg-abyss` / `--ink-teal`.
