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
            RAG knowledge (pgvector)           knowledge.ts — כל עובדה נושאת source
               ↓ (הכל נבדק ע"י)
            GUARDIAN (דטרמיניסטי, ללא LLM)      guardian.ts  — grounding · consent · PII · audit
```

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
| `knowledge.ts` | ממשק RAG + seed corpus (להחלפה ב-pgvector) |
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
**משתני סביבה:** `ANTHROPIC_API_KEY` (חובה להרצה) · `BRAIN_MODEL_ULTRA/MASTER/MAX` (אופציונלי).
ללא מפתח — `brainReady=false` וכל קריאת מודל זורקת שגיאה ברורה (לא רץ ב-build).

## אינטגרציה ל-MiaMe (כשתחליטו)
- **API route**: `app/api/brain/route.ts` שקורא ל-`runBrain` (server). *לא נוצר עדיין — בכוונה, לא לגעת באתר.*
- **n8n**: צומת function שקורא ל-`runBrain` (תואם Demand/Outbound engines של ULease).
- **RAG אמיתי**: החלף את `retrieve` ב-`knowledge.ts` בשאילתת pgvector על קורפוס MiaMe.

## סטטוס
שלד מאומת (TypeScript תקין, מנותק מהאתר). חי: Ultra routing · Guardian gates · seed-RAG · client.
Stub/לפיתוח: pgvector אמיתי · ה-API route · הרחבת ה-Masters/Max · eval runner מלא.
