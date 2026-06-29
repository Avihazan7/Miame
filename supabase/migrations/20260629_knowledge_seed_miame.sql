-- MiaMe.co.il · RAG Knowledge Corpus — schema + seed
-- ---------------------------------------------------------------------------
-- Enlarges the brain's knowledge "database": the citable, brand-safe passages
-- the retrieval layer (brain/knowledge.ts) reads. Fully idempotent — safe to
-- run repeatedly and safe whether or not the table already exists in the shared
-- Supabase project.
--
-- Retrieval is VECTOR-FIRST (cosine via match_knowledge over pgvector) with a
-- Hebrew-safe keyword fallback that reads (id, source, body) directly. Seed rows
-- carry no embedding; the embeddings pipeline backfills them later. Until then
-- the keyword path keeps the brain grounded. Mirrors the FALLBACK corpus in
-- brain/knowledge.ts (single source of truth: lib/models.ts, Specs, LegalStatus).

create extension if not exists vector;

create table if not exists public.knowledge (
  id          text primary key,
  source      text not null,
  body        text not null,
  embedding   vector(1536),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists knowledge_source_idx on public.knowledge (source);

-- Anonymous SELECT only (reads use the anon key). No anon writes.
alter table public.knowledge enable row level security;

drop policy if exists "public can read knowledge" on public.knowledge;
create policy "public can read knowledge"
on public.knowledge
for select
using (true);

drop policy if exists "service can manage knowledge" on public.knowledge;
create policy "service can manage knowledge"
on public.knowledge
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Cosine similarity RPC used by the vector retrieval path. Filters rows that
-- have no embedding yet so the caller can gracefully fall back to keywords.
create or replace function public.match_knowledge(
  query_embedding vector(1536),
  match_count int default 4
)
returns table (id text, source text, body text, similarity float)
language sql
stable
set search_path = ''
as $$
  select k.id, k.source, k.body,
         1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

-- ── Seed corpus ─────────────────────────────────────────────────────────────
insert into public.knowledge (id, source, body) values
  ('spec-range',          'MiaMe/Specs',       'טווח ריאלי עד 100 ק"מ; יצרן עד 120 ק"מ. ניתן להאריך טווח בעזרת סוללות נוספות.'),
  ('spec-motors',         'MiaMe/Specs',       'מיה פור מונעת ב-2 או 4 מנועים חשמליים, בהספק 1,800W כל אחד (x2/x4). הנעה חשמלית שקטה וירוקה.'),
  ('spec-battery',        'MiaMe/Specs',       'סוללת ליתיום נשלפת 60V בקיבולת 25/35Ah, עם שכבת הגנה מאלומיניום במשקל 10 ק"ג. תאי LG 21700. זמן טעינה עד 8 שעות במטען סטנדרטי.'),
  ('spec-speed',          'MiaMe/Specs',       'מהירות מרבית 12 קמ"ש, בהתאם לתקנות הקלנועית בישראל. בלימה: דיסק הידראולי כפול 140 מ"מ.'),
  ('spec-fold',           'MiaMe/Specs',       'כידון מתקפל וכיסא בשחרור מהיר ביד אחת — קל לאחסון ושינוע, נכנס גם לרכב קטן. משקל הכלי כ-42 ק"ג (דגם 4×2).'),
  ('spec-suspension',     'MiaMe/Engineering', 'מערכת מתלים מכנית פורצת דרך על פלטפורמה מוגנת פטנט: שיכוך מלא קדמי ואחורי, מתלה עצמאי לכל גלגל — יציבות ובטיחות בתוואי רכיבה משתנה.'),
  ('usecase',             'MiaMe/Lifestyle',   'חוויה של דו-גלגלי עם יציבות ובטיחות של ארבעה גלגלים. אידיאלי לפעילות, סיורים, תיירות ושילוח. אפשרות ישיבה או עמידה.'),
  ('price-4x2',           'MiaMe/Models',      'מיה פור 4×2 (העירוני החכם) — החל מ-19,900 ש"ח.'),
  ('price-2x4lr',         'MiaMe/Models',      'מיה פור 2×4 Long Range (הטווח המורחב) — החל מ-21,900 ש"ח, סוללה 35Ah.'),
  ('price-4x4',           'MiaMe/Models',      'מיה פור 4×4 (הכוח לכל מסלול) — החל מ-27,900 ש"ח, ארבעה מנועים והנעה כפולה לשטח.'),
  ('legal-status',        'MiaMe/LegalStatus', 'מיה פור מסווגת כקלנועית: מזוהה במספר שילדה ייחודי (לא לוחית רישוי), ללא אגרות רישוי, פטורה מהדוחות שדו-גלגלי ממונע סופג. תואמת תקן EN17128 ולתקנות הקלנועית בישראל.'),
  ('patents',             'MiaMe/Patents',     'פלטפורמת המזעור של MIA Dynamics מוגנת פטנטים רשומים בארה"ב ובישראל: US 11,878,763 B2, US 12,097,926 B2, IL 280339, IL 285336.'),
  ('service',             'MiaMe/Service',     'אחריות יבואן רשמי 12 חודשים · MEU · Mayer Electric Utilities. שירות ארצי ורשת מורשים.'),
  ('method-arch',         'MiaMe/Brain',       'ארכיטקטורת המוח: Ultra (אורקסטרציה) → Masters (החלטות איכות, Sonnet) → Max (פעולות מהירות, Haiku) → Guardian (ציות ובטיחות דטרמיניסטיים). דוקטרינה: RAG על פני fine-tuning, מקור-אמת יחיד.'),
  ('method-bigfive',      'MiaMe/Brain',       'התאמת Big Five Deal: מודל OCEAN ממפה את פרופיל הלקוח לדגם ולמסלול (4×2 · 2×4 LR · 4×4 · השכרה Hub). ההתאמה מוסברת, לא קופסה שחורה.'),
  ('method-gametheory',   'MiaMe/Brain',       'שער תורת-משחקים: הצעות נבחנות לאופטימליות פארטו — אין ביצוע אוטומטי להצעה שאינה Pareto-efficient, כדי שכל עסקה תהיה win-win ללקוח ולמערכת.'),
  ('method-enrichment',   'MiaMe/Brain',       'העשרה אינסטרומנטלית (Feuerstein): המערכת לומדת ומשתפרת מכל אינטראקציה (Perceive → Reason → Act → Learn → Deliver), ומעשירה את בסיס הידע באופן מתודולוגי ומתמשך.')
on conflict (id) do update
set source = excluded.source,
    body = excluded.body,
    updated_at = now();
