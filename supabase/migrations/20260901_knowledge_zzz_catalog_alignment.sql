-- 20260901_knowledge_zzz_catalog_alignment.sql
-- MiaMe · Brain RAG · make the catalogue answer to the names the buyer is shown.
--
-- WHY — MEASURED ON THE LIVE CORPUS, 2026-09-01:
--     rows containing "4x2"        ... 3
--     rows containing "2×4 City"   ... 0     ← the name every rendered surface uses
--     rows containing "Pro Max"    ... 0     ← the flagship's actual name
--     pricing rows / of them SPYQE ... 3 / 0
--
--   lib/models.ts — the single source of truth the whole site derives from — names
--   the three models "2×4 City", "2×4 City Long Range" and "4×4 Pro Max". The corpus
--   called them "4x2", "2x4 Long Range" and "4x4": internal ids, not product names.
--   No surface a visitor has ever seen says "4x2".
--
--   Retrieval is the Hebrew keyword path (every embedding is NULL) and it matches on
--   BODY TEXT. So a buyer typing the two names the site actually showed them —
--   "2×4 City" or "Pro Max" — matched NOTHING in the catalogue rows. Worse, "2x4"
--   matched the LONG RANGE row, so a question about the entry model was answered with
--   the more expensive one. A catalogue that cannot be addressed by the names on the
--   storefront is not a catalogue.
--
-- WHAT
--   · Rewrites the three model rows to lead with the real name, keep the id-style
--     designation as a searchable alias, and carry the tagline and price from
--     lib/models.ts (19,900 / 21,900 / 27,900 — unchanged, verified against source).
--   · Adds `price-spyqe` so the catalogue category covers BOTH products. SPYQE's
--     terms already live in a `finance` row; a buyer asking "what do you sell and for
--     how much" reaches the pricing category, and SPYQE was absent from it.
--   · Clears the embedding of every row it rewrites: a vector of the old text must
--     not outlive the text.
--
-- WHAT IT DELIBERATELY DOES NOT DO
--   It does not move the catalogue into the database. lib/models.ts stays the source
--   of truth: it is compile-checked, and a dozen tests already fail if any surface
--   drifts from it. This migration makes the corpus AGREE with that source; it does
--   not become a second one. The prices below are transcribed from it, and
--   test/catalogAlignment.test.ts fails if the two ever disagree.
--
-- REPLAY ORDER
--   "zzz" sorts after both 20260901 seeds and after the "zz" SPYQE rename, so on a
--   fresh database the rows are inserted, renamed, then aligned — same end state.
--
-- ROLLBACK: 20260901_knowledge_zzz_catalog_alignment.rollback.sql

do $catalog$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[catalog-align] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$מיה פור 2×4 City (העירוני החכם), הידוע גם כ-4x2 — מחיר MiaMe החל מ-19,900 ש"ח. עירוני וזריז, מנוע 1,800W, סוללה נשלפת 60V.$b$,
         embedding = null, updated_at = now()
   where id = 'price-4x2';

  update public.knowledge
     set body = $b$מיה פור 2×4 City Long Range (הטווח המורחב) — מחיר MiaMe החל מ-21,900 ש"ח. סוללה 35Ah לטווח מורחב, סוללה נשלפת 60V, יציבות בכל תוואי.$b$,
         embedding = null, updated_at = now()
   where id = 'price-2x4lr';

  update public.knowledge
     set body = $b$מיה פור 4×4 Pro Max (הכוח לכל מסלול), הידוע גם כ-4x4 — מחיר MiaMe החל מ-27,900 ש"ח. ארבעה מנועים 1,800W, הנעה כפולה לשטח, סוללה נשלפת 60V.$b$,
         embedding = null, updated_at = now()
   where id = 'price-4x4';

  -- SPYQE belongs in the catalogue, not only in `finance`: "what do you sell and for
  -- how much" reaches the pricing category, and SPYQE was not in it.
  insert into public.knowledge (id, source, category, body)
  values ('price-spyqe', 'MiaMe/Spyqe', 'pricing',
    $b$SPYQE (ספייק) בהזמנה מוקדמת — סה"כ 10,990 ש"ח במקום מחיר יבואן 11,990 ש"ח: מקדמה 1,000 ש"ח ליבואן בהרשמה, והיתרה 9,990 ש"ח ב-18 תשלומים של 555 ש"ח. ל-248 הזוכים הראשונים. זהו דגם נפרד ממיה פור, במחצית המחיר בערך.$b$)
  on conflict (id) do update
    set source = excluded.source, category = excluded.category,
        body = excluded.body, embedding = null, updated_at = now();

  -- Postconditions, absolute: the catalogue must be reachable by the names the buyer
  -- is shown, and must cover both products. A replay that cannot satisfy these has
  -- produced a catalogue the storefront cannot be asked about — fail loudly.
  if not exists (select 1 from public.knowledge where body like '%2×4 City%') then
    raise exception '[catalog-align] no row names the entry model as the site does';
  end if;
  if not exists (select 1 from public.knowledge where body like '%Pro Max%') then
    raise exception '[catalog-align] no row names the flagship as the site does';
  end if;
  if (select count(*) from public.knowledge
       where category = 'pricing' and body ilike '%spyqe%') = 0 then
    raise exception '[catalog-align] the pricing category does not cover SPYQE';
  end if;

  raise notice '[catalog-align] catalogue answers to its storefront names.';
end
$catalog$;
