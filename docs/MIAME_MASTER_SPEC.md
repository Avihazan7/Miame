# MiaMe.co.il — Master Spec

The canonical design + motion doctrine for MiaMe.co.il. This is the source of
truth for **how the site should feel**; it does not restate component APIs (see
the code) or the rental scope (see `docs/rental-fleet-os.md`). Keep it grounded:
every principle below points at where it already lives in the codebase.

The site should feel like a **cinematic luxury mobility-tech interface**: calm,
dark-premium, mint-crystal accents, product in motion, sharp typography, and a
living operating-system feeling behind **Buy / Rent / Eligibility / Partner Hub**.

---

## Motion & Cinematic Reference Doctrine

**YouTube (and any video) references are not meant to be copied.** They define
the *motion feeling* and *premium energy* only — never a shot-for-shot layout.
Translate the reference into the website as the ten principles below.

1. **Cinematic product-tech atmosphere.**
2. **Deep navy / luxury black anchors.**
3. **Mint-cyan light accents used like controlled motion trails.**
4. **Product-first framing, not text-first overload.**
5. **Subtle scroll reveals and section transitions.**
6. **Premium dark product stages for MIA FOUR.**
7. **CTA buttons that feel physical, polished, and expensive.**
8. **No excessive bloom, no white haze, no noisy animation.**
9. **Mobile must remain fast, readable, and calm.**
10. **The user should feel: this is a real mobility operating system, not a
    regular landing page.**

### Guardrails (hard constraints)

- **Do not embed heavy videos** unless explicitly approved. Use the video mood as
  inspiration for *depth, timing, contrast, and movement* — not as an asset to ship.
- **Do not redesign from scratch.** Refine, sharpen, and elevate the existing
  Ultra Primum system. Every change is additive and surgical.
- The vibrant campaign zones (Eilat / Green Extreme) stay a **bounded Jewel Box**,
  never the global mood. The global tone stays calm dark-premium.

---

## Grounding — where each principle already lives

The doctrine is enforceable because it is already implemented. When elevating,
extend these anchors rather than inventing parallel systems.

| # | Principle | Where it lives today |
|---|-----------|----------------------|
| 1 | Cinematic atmosphere | `HeroIntro` cinematic entrance (session-gated in `app/layout.tsx` `INTRO_GATE`), `AmbientLight`, `MotionFx` |
| 2 | Deep-navy / luxury-black anchors | `--lux-navy-950:#081B33`, `--lux-navy-900:#0E2747`, `--lux-black:#05070D` in `app/miame-ultra.css`; brand background/theme color `#081B33` in `app/manifest.ts` |
| 3 | Mint-cyan light accents (motion trails) | `--mint`/`--mint-2`/`--lux-mint-500:#57E0B4`, `--lux-cyan-400:#6EE7F3`; `ScrollProgress`, `MarkField` |
| 4 | Product-first framing | `PRODUCT_IMAGE` hero cutout, `Specs`/`Lifestyle`/`Patents` lead with imagery; the icon monogram (`app/icon.svg`) |
| 5 | Subtle scroll reveals | `MotionFx` + `ScrollProgress` + `ScrollTop`; respects `prefers-reduced-motion` (no reveal for reduced-motion visitors) |
| 6 | Premium dark product stages | `.product-stage-dark` in `app/miame-ultra.css` (future 3D/360 showroom container) |
| 7 | Physical, expensive CTAs | `.btn-primary` / `.btn-wa` mint-crystal buttons (`app/globals.css` + `app/miame-ultra.css`), tactile ring + depth shadow |
| 8 | No bloom / haze / noise | ULTRA PRIMUM anti-bloom pass in `app/miame-ultra.css` (`text-shadow:none` on light surfaces, `::before/::after` bloom dialed to `opacity:.38`, crisp edge lines) |
| 9 | Fast, readable, calm mobile | Heebo `display:swap`, static PNG icons, single-column form grids at ≤560px, no heavy video assets |
| 10 | Operating-system feeling | The four living entry paths — Buy / Rent / Eligibility / Partner Hub (`EntryPaths`, `Configurator`, `RentalFleet`, `PartnerHubForm`) behind one calm shell |

### Bounded exception — the Jewel Box

Vibrant campaign energy is allowed **only** inside `.campaign-jewel`
(`app/miame-ultra.css`) — the Eilat / Green Extreme module. It is a controlled,
rounded, high-saturation container; it does not leak into the global dark-premium
tone (principle 8) or the calm mobile baseline (principle 9).

---

## Definition of "done" for a design change

A design/motion change honors this spec when:

- It reads as **calm dark-premium** globally; any vibrance is inside a Jewel Box.
- It adds **no** new bloom, white haze, or noisy/looping animation.
- It ships **no** heavy video unless explicitly approved in the task.
- Motion **respects `prefers-reduced-motion`** and never blocks first paint.
- Mobile (390px) stays fast, readable, and uncluttered — verified in a preview.
- It **refines** existing Ultra Primum anchors above; it does not fork them.
