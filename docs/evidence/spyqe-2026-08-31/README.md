# SPYQE specification — provenance

Source: `https://miadynamics.com/products/mia-spyqe-2x4-electric-scooter`
Model:  **SPYQE | URBAN | 2WD (4X2)** · manufacturer price €2.995,00 (tax included)

The build environment cannot reach miadynamics.com (the egress proxy answers 403
on the CONNECT tunnel). The owner — the importer's business partner — saved the
live product page and supplied it directly on **2026-08-31**. The two text files
here are extracted verbatim from that capture; nothing is paraphrased.

Saved page (MHTML), md5: `008c6518a8837e1f9f16ac918018fb00`

## What is published on MiaMe, and what is not

Everything in `technical-specifications.txt` and `key-features.txt` is published,
with **one deliberate omission**.

The source prints top speed as `25 km/h | 15 mph | 45 km/h`. MiaMe publishes
**25 km/h only**. The reason is regulatory, not editorial: the site sells on
Israeli קלנועית status under EN17128, whose whole basis is the 25 km/h ceiling —
the trust bar on the homepage says so. Publishing 45 km/h next to that would
advertise a vehicle outside the category being claimed. The manufacturer's own
Key Features list agrees: "Top speed up to 25 km/h", and its stat band prints 25.

The euro price is likewise not published. It is recorded here as a cross-check
(€2,995 ≈ the 11,900 ₪ Israeli list price) and nothing more; quoting a foreign
retail price beside an Israeli one invites an arbitrage question the site cannot
answer.

## What is still missing

The page's spec table ends at Max Mileage behind a "View all" control that the
capture did not expand. Not present, and therefore not published: battery
voltage and chemistry, charging time, vehicle weight, maximum load, motor power
in watts, IP rating, warranty term. `lib/spyqe.ts` carries no field for any of
them — see the rule in that file.
