# MiaMe Brain — U.M.M (Ultra · Master · Max)

חיבור **המוח והמתודולוגיה הבלעדית** של ULease 🎯 Leasing.co.il, מותאם ל-MiaMe.
**רק המוח והמתודולוגיה** — מודול עצמאי לחלוטין, **לא נוגע** ב-`app/`, `components/`, `lib/`,
ולא נכנס ל-bundle של האתר (אף קובץ באתר לא מייבא אותו).

> מקורות מתודולוגיה: `leasing-api-co-il/CASES/ULEASE_SPEC.md` §7 (U.M.M, RAG §7.1, Evals §7.2) ·
> `CASES/ULEASE_METHODOLOGY.md` (Big Five/OCEAN) · `AI_PROJECT_STRUCTURE.md` · `AGENT_BLUEPRINT.md` §10.

## הארכיטקטורה
```
BrainEvent → ULTRA (ניתוב דטרמיניסטי)        ultra.ts
               ↓
            MASTER specialists (Sonnet)        masters.ts   — match · deal · content · support
               ↓ (משתמשים ב-)
            MAX workers (Haiku)                max.ts       — leadScorer · intentRouter
               ↓ (כולם מבוססים על)
            RAG knowledge (pgvector)           knowledge.ts — vector-first (cosine) → keyword fallback
               ↑ embeddings                    embeddings.ts — Voyage (1024-d), gated
               ↓ (הכל נבדק ע"י)
            GUARDIAN (דטרמיניסטי, ללא LLM)      guardian.ts  — grounding · consent · PII · audit

מנוע ביקוש:  Lead → score ∥ segment (Max) → nurture מבוסס-מקור (Master) → Guardian   pipeline.ts

## עקרונות המתודולוגיה (מה ייחודי)
1. **U.M.M** — מנצח דק ודטרמיניסטי (Ultra) מעל מומחים יקרים (Master) מעל פועלים מהירים (Max). סולם המודלים: `config.ts`.
2. **RAG over fine-tuning** (D-022) — הידע ב-pgvector, מוזן מאירועים. כל תשובה מבוססת-מקור.
3. **Guardian דטרמיניסטי** — שער grounding (אין מחיר/מפרט בלי מקור), consent (תיקון 40 — inbound-first), redaction של PII, ו-audit מלא. ללא LLM כדי שיהיה non-bypassable.
4. **Big Five (OCEAN)** — התאמת לקוח↔דגם/מסלול (Match-Master).
5. **Evals כשער שחרור** — golden-set · grounding · red-team (`evals.ts`).

## מפת קבצים
| קובץ | שכבה |
|---|---|
| `types.ts` | טיפוסי ליבה (BrainEvent, BigFive, AgentResult, GuardianVerdict…) |
| `config.ts` | סולם המודלים (env-configurable) + מפתח API |
| `client.ts` | קליינט Anthropic דק (fetch, server-side) |
| `ultra.ts` | אורקסטרטור — טבלת ניתוב אירוע→Masters |
| `masters.ts` | מומחי Sonnet מבוססי-RAG |
| `max.ts` | פועלי Haiku (ניקוד ליד, ניתוב כוונה) |
| `knowledge.ts` | RAG על pgvector — `retrieve` vector-first (RPC `match_knowledge`) → keyword fallback |
| `embeddings.ts` | ספק embeddings (Voyage, 1024-d) — gated על `VOYAGE_API_KEY` |
| `pipeline.ts` | מנוע הביקוש — `processLead`: score ∥ segment → nurture מבוסס-מקור → Guardian |
| `guardian.ts` | guardrails דטרמיניסטיים + audit |
| `evals.ts` | שלד eval suite |
| `index.ts` | `runBrain(event, now)` — הצנרת המלאה |

## הרצה (server-side בלבד)
```ts
import { runBrain } from "@/brain";
const result = await runBrain(
  { type: "lead_inbound", payload: { message: "מה הטווח של מיה פור?" }, source: "whatsapp" },
  new Date().toISOString()
);
```
**משתני סביבה:**
- `ANTHROPIC_API_KEY` — חובה להרצת המודלים (Max/Master). ללא מפתח: `brainReady=false`, וכל קריאת מודל זורקת שגיאה ברורה (לא רץ ב-build).
- `BRAIN_MODEL_ULTRA/MASTER/MAX` — אופציונלי, דריסת סולם המודלים.
- `VOYAGE_API_KEY` — אופציונלי, **מפעיל את חיפוש הווקטור** (cosine). ללא מפתח: `retrieve` נופל אוטומטית ל-keyword (מדויק בגודל הקורפוס הנוכחי).
- `BRAIN_EMBED_MODEL` — אופציונלי (ברירת מחדל `voyage-3.5`, 1024-d).
- `SUPABASE_SERVICE_ROLE_KEY` — נדרש **רק** ל-backfill של ה-embeddings (כתיבה). anon יכול רק לקרוא.

## אינטגרציה ל-MiaMe (פעיל)
- **`POST /api/brain`** → `runBrain` (הצ'אט "שאל את MiaMe" קורא לזה).
- **`POST /api/lead`** → `processLead` (מנוע הביקוש: score · segment · nurture). gated על `ANTHROPIC_API_KEY`.
- **`POST /api/embed`** → backfill embeddings (gated על `VOYAGE_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`). `GET` מחזיר כמה שורות עדיין חסרות embedding.
- **n8n**: צומת function שקורא ל-`runBrain`/`processLead` (תואם Demand/Outbound engines של ULease).

## נתיב הווקטור (RAG cosine)
הטבלה `public.knowledge` (pgvector, `embedding vector(1024)`), אינדקס ivfflat וה-RPC `match_knowledge` — **כבר קיימים** ומאוכלסים ב-30 עובדות.
חסר רק backfill של עמודת ה-embedding: הוסף `VOYAGE_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` והרץ `POST /api/embed` (פעם אחת). מאותו רגע `retrieve` הוא vector-first; עד אז — keyword (זהה איכותית ב-30 עובדות).

## סטטוס
מאומת (TypeScript תקין, מנותק מהאתר). **חי:** Ultra routing · Masters (כולל concierge) · Max · Guardian · RAG keyword על קורפוס חי (30 עובדות) · `runBrain` · `processLead` · 3 ה-API routes.
**מוכן-להפעלה (env אחד):** חיפוש וקטור (`VOYAGE_API_KEY` → `POST /api/embed`).
