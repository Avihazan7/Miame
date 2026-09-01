-- 20260901_knowledge_zzzzz_model_names_everywhere.sql
-- MiaMe · Brain RAG · the model names are fixed EVERYWHERE, not only in the price rows.
--
-- WHY — MEASURED 2026-09-01, AFTER the alignment phase landed. FOUR rows, in two
-- different places, and the second pair is the reason this is a phase and not a patch:
--
--   LIVE (production corpus, 37 rows) — 2 rows designate a model by its internal id:
--       model-choose  "איך לבחור דגם: 4×2 לעיר וזריזות · 2×4 Long Range … · 4×4 …"
--       spec-weight   "משקל הכלי 42 ק\"ג (דגם 4x2); …"
--
--   REPLAY ONLY (present on a freshly migrated database, absent from production) —
--   2 more, from the 20260629 seed, which production no longer carries:
--       spec-fold        "… משקל הכלי כ-42 ק\"ג (דגם 4×2)."
--       method-bigfive   "… (4×2 · 2×4 LR · 4×4 · השכרה Hub) …"
--
--   The second pair is NOT dead text. CI applies every migration to a fresh database
--   on each PR, and any restore or new environment replays the same files — so those
--   two rows exist, with those names, every time the corpus is built from git. A
--   defect that is absent from production and present in every rebuild is the kind
--   that returns quietly, on the day someone points the brain at a new database.
--   Updating them here is a no-op against production (0 rows) and a correction
--   everywhere else, which is exactly the asymmetry needed.
--
--   Phase 14 (`..._zzz_catalog_alignment`) fixed the catalogue: price-4x2 · price-2x4lr
--   · price-4x4 · price-spyqe. It fixed FOUR rows because four rows were the catalogue.
--   But naming a model is not the catalogue's privilege — any row may do it, and two
--   did. They were outside the list, so nothing looked at them, and they kept the
--   defect the whole phase existed to remove.
--
--   `model-choose` is the worst place for it to survive. It is the row that answers
--   "איך לבחור דגם" — the comparison question, the one a buyer asks BEFORE picking a
--   model, which is exactly when the name has to match the storefront. It named all
--   three by internal id. And its entry-model token was "4×2": not even the id, which
--   is `4x2` — the digits are reversed relative to the real name, "2×4 City". So the
--   answer offered a designation that exists on no surface and in no source.
--
--   THE ASYMMETRY THAT KEPT THIS INVISIBLE. The offline fallback in brain/knowledge.ts
--   already carried the correct names, and so did lib/seo-pages.ts. Every rendered
--   surface was right; only the LIVE corpus was wrong. So no page ever showed the
--   defect — it surfaced only when the brain answered a buyer, which is the one
--   output nobody reads while developing.
--
-- WHAT
--   · Rewrites the two rows to the names in lib/models.ts, and nothing else.
--   · Clears their embedding: a vector of the old text must not outlive the text.
--     (`retrieve` is vector-first with a keyword top-up, so a cleared row stays
--     reachable while it waits for the backfill — degraded, not lost.)
--
-- WHAT IT DELIBERATELY DOES NOT DO
--   It adds no id-style alias to these two. The aliases belong where someone would
--   type them — the price rows already carry "הידוע גם כ-4x2" / "…4x4" — and repeating
--   them here would lengthen two short rows for nothing. Retrieval normalises by
--   length, so padding a row pushes it DOWN for the question it exists to answer;
--   that was measured in phase 15 and is not re-learned here.
--
-- REPLAY ORDER
--   "zzzzz" sorts after "zzz" (alignment) and "zzzz" (vocabulary gaps), so on a fresh
--   database the rows are seeded, aligned, then corrected — same end state as live.
--
-- ROLLBACK: 20260901_knowledge_zzzzz_model_names_everywhere.rollback.sql
--   Its two bodies were md5-checked against the LIVE rows before this was applied and
--   matched byte-for-byte — 4c78bd6a1068121984c960080779c6ee (model-choose) and
--   83279c0b1a890bccc72db0a646951ade (spec-weight) — so the undo is verified, not
--   asserted.

do $names$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[model-names] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$איך לבחור דגם: 2×4 City לעיר וזריזות · 2×4 City Long Range לטווח מורחב (35Ah) · 4×4 Pro Max לארבעה מנועים והנעה כפולה בשטח.$b$,
         embedding = null, updated_at = now()
   where id = 'model-choose';

  update public.knowledge
     set body = $b$משקל הכלי 42 ק"ג (דגם 2×4 City); עומס מרבי עד 136 ק"ג.$b$,
         embedding = null, updated_at = now()
   where id = 'spec-weight';

  -- The two below do not exist in production and this updates 0 rows there. They DO
  -- exist on every freshly replayed database, which is where the defect would come
  -- back. The wording is taken verbatim from the offline fallback in
  -- brain/knowledge.ts, which already carried the corrected names — so after this the
  -- two grounded corpora say the same thing rather than merely both being "right".
  update public.knowledge
     set body = $b$כידון מתקפל וכיסא בשחרור מהיר ביד אחת — קל לאחסון ושינוע, נכנסת גם לרכב קטן. משקל הקלנועית כ-42 ק"ג (דגם 2×4 City).$b$,
         embedding = null, updated_at = now()
   where id = 'spec-fold';

  update public.knowledge
     set body = $b$התאמת Big Five Deal: מודל OCEAN ממפה את פרופיל הלקוח לדגם ולמסלול (2×4 City · 2×4 City LR · 4×4 Pro Max · השכרה Hub). ההתאמה מוסברת, לא קופסה שחורה.$b$,
         embedding = null, updated_at = now()
   where id = 'method-bigfive';

  -- Postconditions, absolute. A replay that cannot satisfy these has produced a
  -- corpus that answers a buyer in names the storefront does not use — fail loudly
  -- rather than serve it.

  -- 1 · "4×2" is ALWAYS wrong, in any row. The real names are "2×4 City" and
  --     "4×4 Pro Max"; the ASCII ids `4x2`/`4x4` are legitimate as aliases inside
  --     "הידוע גם כ-", but this multiplication-sign form with the digits reversed
  --     matches no name and no id, and never did.
  if exists (select 1 from public.knowledge where body like '%4×2%') then
    raise exception '[model-names] a row still carries "4×2" — a designation that exists in no source';
  end if;

  -- 2 · No row may DESIGNATE a model by its internal id. "(דגם 4x2)" is the shape
  --     spec-weight used: an id standing where the product's name belongs.
  --     ASCII `x` is the whole tell, and the reason this can be a simple pattern:
  --     the real names use the multiplication sign (2×4 City), the internal ids use
  --     a letter (4x2). So "דגם" followed by a LETTER-x form is always an id in a
  --     name's place, and "דגם 2×4 City" — the corrected text — is never matched.
  if exists (select 1 from public.knowledge where body ~ 'דגם\s+[0-9]x[0-9]') then
    raise exception '[model-names] a row designates a model by its internal id rather than its name';
  end if;

  -- 3 · The comparison row must name all three, as the buyer is shown them. Without
  --     this the first two checks pass on a row that simply dropped the names.
  if not exists (
    select 1 from public.knowledge
     where id = 'model-choose'
       and body like '%2×4 City%' and body like '%2×4 City Long Range%' and body like '%4×4 Pro Max%'
  ) then
    raise exception '[model-names] model-choose does not name all three models as the storefront does';
  end if;

  raise notice '[model-names] every row names the models as the buyer is shown them.';
end
$names$;
