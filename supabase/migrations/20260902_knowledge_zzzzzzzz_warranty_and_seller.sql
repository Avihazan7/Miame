-- 20260902_knowledge_zzzzzzzz_warranty_and_seller.sql
-- MiaMe · Brain RAG · the corpus can answer "how long is the warranty" and "who sells it".
--
-- WHY — MEASURED ON THE LIVE CORPUS, 2026-09-02:
--     rows naming the importer .................. 4
--     rows stating the warranty PERIOD .......... 0
--
--   The site displays "12 חודשים" in three places (the Hero strip, the Importer
--   block and the Configurator's spec table, all derived from WARRANTY_MONTHS in
--   lib/content.ts). The corpus says "אחריות יבואן רשמי" and stops. So a buyer who
--   asks the assistant the single most common question after price — how long am I
--   covered — is answered with a reassurance and no number, while the same number
--   sits on the page behind them. That is not a missing keyword; it is the answer
--   being withheld at the moment it is asked for.
--
--   The owner states the term as "שנה" and the code states it as 12 months. They are
--   the same fact, so both are written, in that order: the word a buyer uses, and the
--   number the rest of the site shows.
--
-- AND WHO SELLS IT. Three parties are easy to confuse and the corpus named only two:
--     MIA Dynamics (מיה דיינמיקס)  manufactures
--     MEU · Mayer Electric Utilities  imports, and backs the warranty
--     MiaMe.co.il  SELLS — the online sale runs here
--   `lead` described the mechanism (WhatsApp, the simulator's offer) without ever
--   saying whose sale it is. An answer engine asked "where do I buy MIA FOUR in
--   Israel" could name the importer, because the importer is who the corpus named.
--
-- WHAT IT DELIBERATELY DOES NOT DO
--   It publishes no phone number for MEU. MEU is named as the official importer and
--   as the party behind the warranty, and nothing more — by owner instruction. The
--   only contact channel remains the one the site already runs on, which is why the
--   `contact` row ("אין סניפים ואין קווי טלפון נוספים") is left exactly as it is: it
--   is still true, and it is the sentence that keeps it true.
--
-- REPLAY ORDER
--   "zzzzzzzz" sorts after "zzzzzzz" (sell-one-thing), so a fresh database ends where
--   production is.
--
-- ROLLBACK: 20260902_knowledge_zzzzzzzz_warranty_and_seller.rollback.sql
--   Its three bodies were md5-checked against the LIVE rows before this was applied
--   and matched byte-for-byte — warranty ec94883f…, service 4a6e69d5…, lead d9e41fe4…

do $warranty$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[warranty-seller] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$אחריות וגיבוי של יבואן רשמי MEU · Mayer Electric Utilities, חמישה עשורים בענף הרכב. תקופת האחריות היא שנה (12 חודשים).$b$,
         embedding = null, updated_at = now()
   where id = 'warranty';

  update public.knowledge
     set body = $b$יבואן רשמי MEU · Mayer Electric Utilities; אחריות יבואן רשמי לשנה (12 חודשים), שירות וחלפים מקוריים. מסירה מתואמת בכל אזורי הארץ.$b$,
         embedding = null, updated_at = now()
   where id = 'service';

  update public.knowledge
     set body = $b$איך מזמינים מיה פור: המכירה המקוונת מתנהלת ב-MiaMe.co.il. ההזמנה והרכישה דרך וואטסאפ - הסימולטור שולח הצעה מלאה (דגם, מקדמה, מספר תשלומים ותשלום חודשי) ישירות לוואטסאפ.$b$,
         embedding = null, updated_at = now()
   where id = 'lead';

  -- Postconditions, absolute.

  -- 1 · The period must be answerable. Both forms, because a buyer types either.
  if not exists (select 1 from public.knowledge where body like '%12 חודשים%') then
    raise exception '[warranty-seller] no row states the warranty period as a number';
  end if;
  if not exists (select 1 from public.knowledge where body like '%שנה%' and body like '%אחריות%') then
    raise exception '[warranty-seller] no row states the warranty period in words';
  end if;

  -- 2 · The seller must be nameable.
  if not exists (select 1 from public.knowledge where body like '%MiaMe.co.il%') then
    raise exception '[warranty-seller] no row says where the sale actually happens';
  end if;

  -- 3 · And the instruction that matters most here: MEU is named, never dialled.
  --     A phone number for the importer must not enter the corpus by any route.
  if exists (select 1 from public.knowledge where body ~ '0[2-9][0-9]?[- ]?[0-9]{7}') then
    raise exception '[warranty-seller] a phone number appeared in the corpus';
  end if;

  raise notice '[warranty-seller] the warranty has a term and the sale has a seller.';
end
$warranty$;
