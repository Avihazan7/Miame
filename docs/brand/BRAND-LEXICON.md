# MiaMe — Brand Lexicon (Ultra Master, official language)

The word-pairs + emoji below are the **official MiaMe language**. Keep them verbatim.
On the site DOM they render as sharp brand **SVG icons** (`public/brand/lexicon/`) — never
system emoji (which look different per device and break "high resolution & sharpness").
Real emoji are used **only** in native channels — WhatsApp prefills, OG description, social —
where they are native and pixel-perfect.

## The pairs (verbatim)

| # | Pair | Emoji | Role in the message | Icon |
|---|------|-------|---------------------|------|
| L1 | החופש שלך עכשיו · בתנועה | ✅ 🗽 | H1 — the promise | `check` + `liberty` |
| L2 | MIA FOUR | Ⓜ️ | product name | `m-roundel` |
| L3 | ניידות חשמלית | ⚡️ | the category | `bolt` |
| L4 | פרימיום על ארבעה גלגלים | 🅿️ | the positioning | `p-roundel` |
| L5 | MiaMe.co.il | 🌐 | the digital home | `globe` |
| L6 | Free Feel | 🦋 | the emotion — brand signature | `butterfly` |

## Placement matrix

| Placement | Lexicon | Form |
|-----------|---------|------|
| Hero eyebrow | L2 + L3 | `m-roundel` + Latin text + `bolt` |
| Hero H1 | L1 | `liberty` accent after "עכשיו בתנועה." (cap-height, not inline in text flow) |
| Hero finance | ✅ | `check` before "עד 18 תשלומים…" |
| Free chip | L6 | `butterfly` + "FREE FEEL" |
| Trust line | 🅿️ | `p-roundel` opens "יבואן מורשה" |
| Footer brand line | L5 | `globe` + MiaMe.co.il |
| wa.me prefill | real emoji | open "✅ החופש שלך עכשיו · בתנועה 🗽", sign "Free Feel 🦋 · MiaMe.co.il 🌐" |
| OG / opengraph-image | L1 + L6 | caption: "החופש שלך. עכשיו בתנועה. · Free Feel 🦋" |
| `<title>` / meta | — | no emoji (A3) |

## Palette (Hero scope — energy evolution of Ultra Color P Master)

Scoped under `.hero-v2{}` in `app/miame-hero-v2.css` (does NOT replace `tokens.miame.css`).
Petrol = Abyss · Cyan = Glow · Lime = Mint-Zero.

| Token | Hex | Use |
|-------|-----|-----|
| `--hero-black` | `#03151B` | petrol base |
| `--hero-navy` | `#071F2F` | optical navy |
| `--hero-cyan` | `#28C7E8` | accent / H1 strong |
| `--hero-blue` | `#4AA8FF` | data / secondary |
| `--hero-lime` | `#A5F35A` | energy / primary CTA |
| `--hero-white` | `#F7FBFF` | precision white text |
| `--hero-silver` | `#B9C8D4` | trust / muted |

**Law:** Cyan/Lime are accents & buttons on dark **only** — never as text on a light background.

## Typography — three voices

| Voice | Font | Use |
|-------|------|-----|
| Hebrew-power | Heebo 900 (`--font-heebo`) | Hero H1 (tracking −0.012em, Hebrew never clamps) |
| Latin-technical | Space Grotesk 500/700 (`--font-grotesk`) | eyebrow, MIA FOUR, FREE FEEL, numbers (`tnum`) |
| Hebrew-editorial | Suez One (`--font-display`) | section `h2` below the Hero only |

Logotype: `public/brand/miame-logotype-{dark,light,mono}.svg` — Space Grotesk 700 "MiaMe",
the **i-dot replaced by the butterfly** (Free Feel lives inside the name).

## Model lineup (verbatim names · prices frozen)

The product line is **MIA FOUR**; the three trims are the canonical `name` in
`lib/models.ts` (internal `id`s stay `4x2`/`2x4lr`/`4x4` for stability).

| id | Model name | Tagline | Price (frozen) |
|----|-----------|---------|----------------|
| `4x2`   | **2×4 City** | העירוני החכם | 19,900 ₪ |
| `2x4lr` | **2×4 City Long Range** | הטווח המורחב | 21,900 ₪ |
| `4x4`   | **4×4 Pro Max** | הכוח לכל מסלול | 27,900 ₪ |

Prices are frozen — never change them. Brand+model reads "MIA FOUR 4×4 Pro Max".
In SEO copy the drive-config token `4×4` doubles as a keyword ("קלנועית שטח
4×4", "הנעה כפולה 4×4"): keep it in h1/title/labels; the model **name** is
"4×4 Pro Max".

## Positioning line

**MIA FOUR · מחקר ופיתוח ישראלי 🇮🇱** — Israeli R&D. A trust signal (hero trust
row). The 🇮🇱 is a country flag (semantic data, native — the lexicon's
system-emoji ban is for decorative glyphs, not country flags).
