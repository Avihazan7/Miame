-- 20260902_zzknowledge_site_truths.sql
-- MiaMe · Brain RAG · the corpus answers what the SITE already publishes.
--
-- WHY — MEASURED, NOT REASONED. Every question below was run through the real
-- retrieval path (brain/knowledge.ts) against the live 38-row corpus, 2026-09-02.
-- These are the rows a buyer gets today, not a prediction of them:
--
--   "מה המידות של מיה פור"   → spyqe-spec          6.26   ← ANOTHER PRODUCT'S numbers
--   "כמה זמן טעינה"          → spyqe-spec-missing  6.36   ← "not published yet" — of SPYQE
--   "כמה זמן לוקח לטעון"     → spyqe-register      2.60   ← a pre-order form
--   "צריך רישיון לקלנועית"   → spec-speed          3.69   ← top speed and a standard
--   "מה מספר הפטנט"          → patent              3.95   ← says "patented", no numbers
--   "האם היא נכנסת לתא מטען" → testride            5.40   ← book a test ride
--
-- THE FIRST TWO ARE NOT GAPS, THEY ARE WRONG ANSWERS. `spyqe-spec` is the only row
-- in the corpus containing the word "מידות", so a question that NAMES מיה פור is
-- answered with SPYQE's 562×1225×1248 and its 439mm folded height. The row ends
-- "אלה נתוני SPYQE ולא של מיה פור" — a guard the previous author added for exactly
-- this risk — but that sentence only helps if the model reads it. Retrieval already
-- chose the wrong document. The fix is to give MIA FOUR its own row, not a louder
-- disclaimer on SPYQE's.
--
-- AND THE DEGRADED PATH KNEW MORE THAN THE PRIMARY ONE. brain/knowledge.ts ships
-- FALLBACK — the offline corpus used only when Supabase is unreachable. It carries
-- the charging time (`spec-battery`), the four patent numbers (`patents`) and a whole
-- `legal-status` row. The live corpus carried none of the three. So when the database
-- was UP the buyer got the worse answer. That inversion is the kind of defect nothing
-- reports: no error, no log line, just a thinner answer on the healthy path.
--
-- PROVENANCE — NOT ONE NEW CLAIM IS MADE HERE. Every figure is already published on a
-- live surface, and the wording follows it:
--     689 × 1,244 × 1,190 מ"מ · עד 8 שעות · מטען סטנדרטי   components/Specs.tsx
--     שילדה · אפס אגרות · חשיפה לדוחות · EN17128            components/LegalStatus.tsx
--     US 11,878,763 B2 · US 12,097,926 B2 · IL 280339 · IL 285336
--                                                            components/Patents.tsx
--   The corpus is being brought into agreement with the storefront. It does not become
--   a second source of truth, and it invents nothing — the same rule catalogAlignment
--   holds for the model names.
--
-- AND WHAT IS *NOT* PUBLISHED IS SAID SO. MIA FOUR has no published FOLDED height. The
--   row states that rather than leaving a silence for SPYQE's 439mm to fill — the same
--   discipline as `spyqe-spec-missing`, applied in the other direction.
--
-- THE LEGAL ROW CARRIES THE PAGE'S OWN HEDGES, verbatim in substance: "לפי המעמד
--   החוקי … ובכפוף לדין", "אינה חשופה לחלק מהקנסות", and the disclaimer that the
--   information is general and not legal advice. It does NOT answer whether a licence,
--   insurance or a minimum age is required — the site makes no such determination, so
--   neither does the corpus.
--
-- REPLAY ORDER: "zzknowledge" sorts after "zknowledge" (the tyre phase) of the same
--   date, so a fresh database ends where production does.
--
-- ROLLBACK: 20260902_zzknowledge_site_truths.rollback.sql — deletes the three rows it
--   inserts and restores `patent` and `spec-battery` to their exact prior bodies,
--   md5-checked against the LIVE rows BEFORE this was applied:
--       patent        d776d21bc8d4af2663fb2f864948ff1d   (71 chars)
--       spec-battery  e3587caa349c4130ebede3884e080902   (69 chars)

do $truths$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[site-truths] public.knowledge absent - skipped.';
    return;
  end if;

  -- 1 · DIMENSIONS. The row that stops "מה המידות" from being answered with SPYQE's.
  --     It also carries "תא מטען", which is the form the question is actually asked in
  --     ("האם היא נכנסת לתא מטען") and which reached the test-ride row before this.
  insert into public.knowledge (id, source, category, body, embedding, updated_at)
  values (
    'spec-dimensions',
    'MiaMe/Specs',
    'specs',
    $b$מידות מיה פור: 689 × 1,244 × 1,190 מ"מ (רוחב × אורך × גובה). משקל 42 ק"ג, הכידון מתקפל והכיסא משתחרר ביד אחת, ולכן היא נכנסת לתא מטען של רכב פרטי. גובה מיה פור במצב מקופל טרם פורסם — אין למסור עבורו מספר.$b$,
    null,
    now()
  )
  on conflict (id) do update
    set body = excluded.body, source = excluded.source, category = excluded.category,
        embedding = null, updated_at = now();

  -- 2 · CHARGING TIME. Deliberately SINGLE-PURPOSE and short. The first draft also
  --     repeated the battery spec ("הסוללה נשלפת — ליתיום 60V, 25/35Ah") and MEASURABLY
  --     stole "מה הסוללה" from spec-battery, 3.05 against 2.92 — the exact case
  --     test/retrievalRanking.test.ts exists to hold. Length normalisation makes a
  --     short row win, so a short row must not be about two things.
  insert into public.knowledge (id, source, category, body, embedding, updated_at)
  values (
    'spec-charging',
    'MiaMe/Specs',
    'specs',
    $b$זמן הטעינה של מיה פור: עד 8 שעות במטען סטנדרטי.$b$,
    null,
    now()
  )
  on conflict (id) do update
    set body = excluded.body, source = excluded.source, category = excluded.category,
        embedding = null, updated_at = now();

  -- 3 · LEGAL STATUS. components/LegalStatus.tsx calls this the site's conversion
  --     lever, and the corpus held half a sentence of it inside mia-four-what. The id
  --     matches the one the offline FALLBACK already uses, so the two paths now agree
  --     by name as well as by content.
  insert into public.knowledge (id, source, category, body, embedding, updated_at)
  values (
    'legal-status',
    'MiaMe/LegalStatus',
    'legal',
    $b$מיה פור מסווגת כקלנועית ואינה רכב. כל כלי מזוהה במספר שילדה ייחודי, בלי רישוי ובלי לוחית רישוי; אין אגרת רישוי ואין עלויות רישוי שנתיות. לפי המעמד החוקי של קלנועית ובכפוף לדין, היא אינה חשופה לחלק מהקנסות והדוחות שדו-גלגלי ממונע סופג. תואמת תקן EN17128 ומותאמת לתקנות הקלנועית בישראל. המידע כללי ואינו ייעוץ משפטי; השימוש כפוף לדין, לתקנות הקלנועית ולהוראות הרשויות.$b$,
    null,
    now()
  )
  on conflict (id) do update
    set body = excluded.body, source = excluded.source, category = excluded.category,
        embedding = null, updated_at = now();

  -- 4 · THE PATENT NUMBERS. The site prints all four; the corpus said only that a
  --     patent exists. "מספרי" is in the body on purpose: without the word the buyer
  --     types, the shorter spec-brakes row (which happens to contain "פטנט") outranked
  --     this one 3.61 to 3.29 when it was first drafted longer.
  update public.knowledge
     set body = $b$מספרי הפטנטים של פלטפורמת MIA Dynamics: US 11,878,763 B2, US 12,097,926 B2, IL 280339, IL 285336 — רשומים בארה"ב ובישראל. טכנולוגיית מזעור ארבעה גלגלים.$b$,
         embedding = null, updated_at = now()
   where id = 'patent';

  -- 5 · The battery row names the charging time too, so a question that lands on the
  --     battery is not a dead end — the same move the tyre phase made on spec-brakes.
  --     This is also the sentence the offline FALLBACK has carried all along.
  update public.knowledge
     set body = $b$סוללת ליתיום נשלפת 60V, קיבולת 25/35Ah, תאי LG 21700, משקל כ-6.3 ק"ג. זמן טעינה עד 8 שעות במטען סטנדרטי.$b$,
         embedding = null, updated_at = now()
   where id = 'spec-battery';

  -- POSTCONDITIONS — absolute, so a partial apply cannot report success.
  if (select count(*) from public.knowledge
       where id in ('spec-dimensions', 'spec-charging', 'legal-status')) <> 3 then
    raise exception '[site-truths] postcondition failed: expected 3 new rows, found %',
      (select count(*) from public.knowledge
        where id in ('spec-dimensions', 'spec-charging', 'legal-status'));
  end if;
  if (select count(*) from public.knowledge where body like '%1,244%') <> 1 then
    raise exception '[site-truths] postcondition failed: no row states the dimensions.';
  end if;
  if (select count(*) from public.knowledge where body like '%US 11,878,763 B2%') <> 1 then
    raise exception '[site-truths] postcondition failed: the patent numbers are absent.';
  end if;
  -- Two rows must state the charging time: the dedicated one and the battery row.
  if (select count(*) from public.knowledge where body like '%8 שעות%') <> 2 then
    raise exception '[site-truths] postcondition failed: expected 2 rows naming the charging time, found %',
      (select count(*) from public.knowledge where body like '%8 שעות%');
  end if;
  -- The claim this phase must NOT make. SPYQE's folded height is 439mm; MIA FOUR's is
  -- unpublished, and a number appearing here would mean it had been borrowed.
  if (select count(*) from public.knowledge
       where id = 'spec-dimensions' and body like '%439%') <> 0 then
    raise exception '[site-truths] postcondition failed: spec-dimensions quotes a folded height.';
  end if;

  raise notice '[site-truths] spec-dimensions, spec-charging and legal-status written; patent and spec-battery updated.';
end
$truths$;
