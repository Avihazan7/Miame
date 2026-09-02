-- 20260902_knowledge_zzzzzzzz_warranty_and_seller.rollback.sql
--
-- ⚠️ THIS REINSTATES A MEASURED GAP. Running it returns the corpus to a state where
--    NO row states the warranty period — so a buyer asking the assistant "how long
--    is the warranty" is answered with "אחריות יבואן רשמי" and no number, while the
--    site displays 12 months on the page behind them. It also removes the only
--    sentence saying the online sale runs through MiaMe.co.il.
--
--    Run it only to undo the migration.
--
-- The three bodies below were md5-checked against the LIVE rows before the forward
-- migration was applied and matched byte-for-byte:
--     warranty  ec94883f1d18f7490c073330c5ebdc39
--     service   4a6e69d52251d34be29345cd11e28599
--     lead      d9e41fe40b7d463e79531cd914729e34

do $warranty_rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[warranty-seller/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$אחריות וגיבוי של יבואן רשמי MEU · Mayer Electric Utilities, חמישה עשורים בענף הרכב.$b$,
         embedding = null, updated_at = now()
   where id = 'warranty';

  update public.knowledge
     set body = $b$יבואן רשמי MEU · Mayer Electric Utilities; אחריות יבואן רשמי, שירות וחלפים מקוריים. מסירה מתואמת בכל אזורי הארץ.$b$,
         embedding = null, updated_at = now()
   where id = 'service';

  update public.knowledge
     set body = $b$איך מזמינים מיה פור: הזמנה ורכישה דרך וואטסאפ. הסימולטור שולח הצעה מלאה - דגם, מקדמה, מספר תשלומים ותשלום חודשי - ישירות לוואטסאפ.$b$,
         embedding = null, updated_at = now()
   where id = 'lead';

  raise notice '[warranty-seller/rollback] the warranty period is unanswerable again.';
end
$warranty_rb$;
