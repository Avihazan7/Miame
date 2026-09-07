-- 20260902_zzknowledge_site_truths.rollback.sql
--
-- ⚠️ THIS REINSTATES MEASURED WRONG ANSWERS, not merely missing ones. Running it
--    returns the corpus to a state where:
--      · "מה המידות של מיה פור" is answered from spyqe-spec — ANOTHER PRODUCT'S
--        dimensions and its 439mm folded height, because that becomes the only row
--        in the corpus containing the word "מידות" again;
--      · "כמה זמן טעינה" is answered from spyqe-spec-missing — "טרם פורסם" — for a
--        figure the site publishes on the MIA FOUR spec table;
--      · "מה מספר הפטנט" returns a row that says a patent exists and names none;
--      · "האם היא נכנסת לתא מטען" returns the test-ride row.
--    All four figures stay on the site either way; only the assistant loses them.
--    Run it only to undo the migration.
--
-- The two bodies restored below were md5-checked against the LIVE rows BEFORE the
-- forward migration was applied, and matched byte-for-byte:
--     patent        d776d21bc8d4af2663fb2f864948ff1d   (71 chars)
--     spec-battery  e3587caa349c4130ebede3884e080902   (69 chars)

do $truths_rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[site-truths/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  delete from public.knowledge
   where id in ('spec-dimensions', 'spec-charging', 'legal-status');

  update public.knowledge
     set body = $b$הפלטפורמה מוגנת פטנט — יציבות ובטיחות בארבעה גלגלים, יתרון ייחודי בשוק.$b$,
         embedding = null, updated_at = now()
   where id = 'patent';

  update public.knowledge
     set body = $b$סוללת ליתיום נשלפת 60V, קיבולת 25/35Ah, תאי LG 21700, משקל כ-6.3 ק"ג.$b$,
         embedding = null, updated_at = now()
   where id = 'spec-battery';

  -- POSTCONDITIONS — the undo has to be as provable as the change.
  if (select count(*) from public.knowledge
       where id in ('spec-dimensions', 'spec-charging', 'legal-status')) <> 0 then
    raise exception '[site-truths/rollback] postcondition failed: a new row survived.';
  end if;
  if (select md5(body) from public.knowledge where id = 'patent')
       is distinct from 'd776d21bc8d4af2663fb2f864948ff1d' then
    raise exception '[site-truths/rollback] postcondition failed: patent was not restored byte-for-byte.';
  end if;
  if (select md5(body) from public.knowledge where id = 'spec-battery')
       is distinct from 'e3587caa349c4130ebede3884e080902' then
    raise exception '[site-truths/rollback] postcondition failed: spec-battery was not restored byte-for-byte.';
  end if;

  raise notice '[site-truths/rollback] three rows removed; patent and spec-battery restored.';
end
$truths_rb$;
