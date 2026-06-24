# MiaMe · המוח (Agent) + קמפיין עסקאות — בריף אסטרטגי

> מקור: חילוץ מ-`leasing-api-co-il` (ULease Claude OS) והתאמה ל-MiaMe.co.il.
> מטרה: מסמך החלטה לארוחת אסטרטגיה (ישראל → גלובלי). MiaMe = "ה-Waze של הניידות העולמית" — **מכירה · השכרה שיתופית · שירות**.

---

## 1. סטאק הסוכנים של ULease (להעתקה ל-MiaMe)

```
אירועי ביקוש/היצע → ULTRA (Orchestrator)
                       ↓ מנתב ל-
                  MASTER (מומחי תחום · Sonnet 4.6)
                  ├─ Pricing/Margin · Match (Big Five) · Negotiation
                  ├─ Content/Marketing · Financing/Compliance
                  └─ [חדש ל-MiaMe: Logistics/Rental Master]
                       ↓ מאציל ל-
                  MAX (Workers · Haiku 4.5 · ביצוע מהיר)
                  ├─ Offer-Builder · Contract/e-Sign · Inventory-Sync
                  └─ [חדש ל-MiaMe: Rental-Slot Allocator · Service Scheduler]
                       ↓ נבדק ע"י
                  GUARDIAN (בטיחות/ציות · דטרמיניסטי, בלי LLM)
                  └─ Audit-Log · Consent (תיקון 40/GDPR) · Guardrails · Evals
```

**ליבה** (`CASES/ULEASE_SPEC.md` v1.5.0 §7): Ultra=אורקסטרציה · Masters=Sonnet (החלטות איכות) · Max=Haiku (פעולות מהירות) · Guardian=ציות דטרמיניסטי.
**שכבת ידע (RAG, §7.1):** pgvector — קטלוג, מחירים, רגולציה, playbooks. **דוקטרינה: RAG על פני fine-tuning** (D-022).

---

## 2. מה למשוך ל-MiaMe — מטריצת שימוש-חוזר

| נכס ULease | מיפוי ל-3 העמודים | רמת שימוש | התאמה |
|---|---|---|---|
| **Ultra Orchestrator** | כל ה-3 | ✅ כמו שהוא | אירועי הזמנה (מכירה) → אירועי booking (השכרה) → אירועי tickets (שירות) על אותו גרף. |
| **Match Master (Big Five)** | מכירה + השכרה | ✅ + התאמה | פרופיל קונה → פרופיל ניידות משתמש; "נוסע עסקי" = מנוי 6 חודשים אמין. |
| **Deal Score** | מכירה | ⚠️ התאמה | מחיר מול מתחרים (Xiaomi/NIU) + כושר אשראי + גיל מלאי + **בריאות סוללה**. |
| **Pricing Master** | מכירה | ⚠️ התאמה | עלות ייצור קבועה → תמחור B2C משתנה + B2B2C לצי (הנחות כמות). |
| **Negotiation + Playbooks** | כל ה-3 | ✅ + הרחבה | `ULEASE_OUTREACH_SCRIPTS.md` v1.3.0: 4 סגמנטי ספק → 4 סגמנטי לקוח. |
| **Content/Marketing Master** | כל ה-3 | ✅ כמו שהוא | Deal-to-Content: עסקה סגורה → סיפור אנונימי → SEO → GEO (ציטוט ב-AI). |
| **RAG / Knowledge** | כל ה-3 | ✅ בסיס | אותו chunking/retrieval; קורפוס משתנה (מפרט סקוטר + גיל סוללה + דירוג Hubs). |
| **n8n Outbound Engine** | אקוויזיציית צד-היצע | ✅ ~כמו שהוא | `ULEASE_OUTBOUND_ENGINE.md` v1.2.1 (8 שכבות) → גיוס **מפעילי צי**. אותם Haiku+Sonnet+HITL. |
| **n8n Demand Engine** | מכירה + השכרה | ✅ + fork | `ULEASE_DEMAND_ENGINE.md` v1.2.1 (18 צמתים → **12** ל-MiaMe). השכרה = booking חוזר, לא close חד-פעמי. |
| **Guardian + Evals** | כל ה-3 | ✅ + הרחבה | grounding ≥100% למחירים/מפרט · opt-out · audit-log. הוסף: בטיחות סוללה, דירוג שותפי צי. |
| **Automation Map (42)** | כל ה-3 | ⚠️ סלקטיבי | `ULEASE_AUTOMATION_MAP.md` v1.5.0 — **~28/42 ישימות** (Lead Scoring, Q&A Bot, Reconciliation…). |
| **Demand Playbook** | מכירה | ✅ מסגרת | CPL יעד ₪80–150 · payback 2–3 ח' (מול ULease שנה) · פרסונות commuter/fleet. |

---

## 3. ה"מוח" של MiaMe — v1 מינימלי (2 סוכנים = ערך מקסימלי בחודש הראשון)

MiaMe כבר מחזיקה: אתר Next.js חי · Supabase CRM (leads/partners/events + RLS) · משפך WhatsApp · אנליטיקס events. לכן:

### סוכן 1 — Deal Assistant (WhatsApp + צ'אט אתר)
- **תפקיד:** לסנן לידים, לענות על שאלות מוצר, לנתב ל-checkout / מכירות צי.
- **מודלים:** Haiku 4.5 (ניתוב כוונה) · Sonnet 4.6 (תשובה מותאמת — השוואת מוצר, מימון, SLA).
- **כלים:** Supabase (מפרט/מלאי/דירוגים/FAQ) · CRM upsert.
- **זיכרון:** pgvector (מפרט, מסמכי סוללה, SLA, סיפורי לקוח) — `AI_RAG_DESIGN.md` (15 מניעות-שגיאה).
- **Guardrails:** grounding ≥100% על טווח/טעינה · אין מחיר בלי נתון אמיתי · opt-out.
- **ציות:** inbound-only (תיקון 40).

### סוכן 2 — Lead Scorer + Nurture (n8n + Claude, 12 צמתים)
- **תפקיד:** ניקוד ליד → nurture לעסקה (מכירה) או מנוי (השכרה); ניתוב מפעילי צי לשותפות.
- **מודלים:** Haiku (ניקוד 0–100) · Sonnet (קופי nurture).
- **זרימה:** מקור → העשרה (Supabase) → ניקוד Haiku → ניתוב (חם≥70 שיחה · פושר 50–69 מייל · קר רשימה) → nurture Sonnet → קביעת פגישה → עסקה → Content Generator.
- **KPI (90 יום):** nurture→booking ≥15% · עלות/booking ≤ ₪150.
- **בנייה:** fork ל-`ULEASE_DEMAND_ENGINE.n8n.json` (18→12 צמתים), חיבור ל-Supabase + Sonnet.

---

## 4. קמפיין עסקאות — שלד

### סגמנטים
| סגמנט | מי | הוק | ערוץ | CAC יעד |
|---|---|---|---|---|
| 🚴 **Commuter** | עירוני 25–45 | "מ-₪3.5/יום, מהיר מאוטובוס, אפס תחזוקה" | Google Ads · TikTok · Reddit | ₪80–120 |
| 🏢 **מפעיל צי** | מיקרו-מוביליטי 5–50 | "₪200/ח' ניהול צי כולל החלפות סוללה + ביטוח" | LinkedIn · outreach ישיר | ₪500–1K (חד-פעמי) |
| 🅿️ **שותף חניון/מתחם** | קניון/פארק/בניין | "20 סקוטרים, ₪500/ח' + עמלה לנסיעה" | מכירות ישירות | ₪0 (rev-share) |

### תקציב seed (₪3K, חודש 1)
Google Ads ₪1,500 (15 לידים) · Reddit ₪400 (6) · TikTok ₪600 (5) · Referral ₪300 (4) · Organic/SEO ₪0 (2, מתגבר) · Fleet outreach ₪200 (1–2 שותפויות).

### משפך ו-KPI
```
32 לידים → ~10 אמיתיים → ~5 עסקאות (B2C + 1–2 פיילוטי צי)
הכנסה: 5×₪2,500 + 1 צי×₪500 ≈ ₪13,000 · CAC ממוצע ₪600 · Payback 2–3 ח'
```

### ביצוע (לשותף/מייסד)
1. **Demand Engine** צמתים 1–5 (fork 12 צמתים) + Supabase + Haiku/Sonnet + HITL על כל outreach קר.
2. **Outbound לצי:** מייל 1-touch (Sonnet, SLA + מחיר + עדות) + CRM ידני + Calendly. יעד: 2–3 פיילוטים.
3. **תוכן/GEO:** 3 פוסטים ("האם סקוטר מתאים לך?", "מיתוסי סוללה", "מחשבון חיסכון") → GEO.
4. **מדידה:** baseline = 0 inbound היום. יעד ח' 1: 5–10 לידים, 2–3 עסקאות, 1 שותפות צי. כלל 90 הימים (`AUTOMATION_MAP` §12).

---

## 5. סיכונים ו-Guardrails (מה לא להעתיק עיוור)

| הנחת ULease | מציאות MiaMe | מיטיגציה |
|---|---|---|
| תיקון 40 / inbound-only | חל 1:1 | ✅ Guardian + Consent כמו שהם. אין שיחות קרות; WhatsApp/מייל/מודעות + opt-out. |
| Marketplace תלת-צדדי | D2C + B2B2C (השכרה) | ⚠️ Match Master: הסר מו"מ ספק; הוסף user→product + product→fleet. "מרווח" → "מרווח יחידה". |
| עסקה חד-פעמית ₪150K | חוזר (₪200–800/ח') + מחזור חיי סוללה | ⚠️ Churn Prediction קריטי. GMV → MRR + LTV. לולאת retention: שירות → המלצה → שדרוג. |
| Tech Lead בשלב 1 | מייסד + CTO חוזה | ⚠️ בלי over-engineering: Monolith-first (`AI_MICROSERVICES.md` §6), Claude Agent SDK (D-022), בלי K8s ב-MVP. |
| Guardian דטרמיניסטי בלבד | צריך גם soft-guardrails | ✅ דטרמיניסטי למחיר/PII/ציות; soft (threshold) ל-SLA צי (renewal <70% → flag). |
| RAG קורפוס סטטי | צריך live (מלאי, בריאות סוללה, דירוגים) | ⚠️ pgvector + רענון בזמן אמת + בדיקת freshness ב-retrieval. |

---

## 6. רודמאפ v1
- **שבוע 1–2 (Pre-Launch):** schema · WhatsApp Business · n8n 12 צמתים מקומי · 3 פוסטים · סוכנים ב-HITL.
- **שבוע 3–4 (Soft Launch):** Demand Engine ל-production · Deal Assistant חי · Scorer ב-assist · Google Ads+Reddit. יעד: 32 לידים, 5 המרות, 1 פיילוט צי.
- **שבוע 5–8 (Scale):** TikTok+Referral · outreach לצי · 5 פוסטים · אוטונומיה מנוטרת (Haiku auto, Sonnet pre-approved). CAC ≤ ₪150.
- **חודש 2+ (V1):** GEO · Rental Booking Agent · Deal-to-Content חי · supervised autonomy (10% audit). יעד: >25% לידים אורגניים.

---

## שורה תחתונה לקלדרון
**Reuse ~90%** מהארכיטקטורה של ULease (Ultra·Master·Max + RAG + Guardian + מנועי n8n). מחליפים סוגי אירוע ומודלי תחום (רכב→סקוטר, חד-פעמי→חוזר, מרווח-ספק→עלות-יחידה). **זמן בנייה −60%**, השקה 2–3 שבועות, payback 2–3 חודשים.

**מסמכי מקור:** `ULEASE_SPEC.md` v1.5.0 §7 · `ULEASE_DEMAND_ENGINE.md` v1.2.1 · `ULEASE_OUTBOUND_ENGINE.md` v1.2.1 · `ULEASE_AUTOMATION_MAP.md` v1.5.0 · `ULEASE_DEMAND_PLAYBOOK.md` v1.2.0 · `AI_PROJECT_STRUCTURE.md` v1.1.0 · `AGENT_BLUEPRINT.md` v1.2.0 §10.
