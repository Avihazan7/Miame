---
name: arch-guardian
description: "Architecture Guardian — האחראי הישיר 24/7 על תקינות הארכיטקטורה מקצה-לקצה של MiaMe.co.il (מבית Leasing.co.il). מאמת 4 תחומים: code (typecheck/lint/build + אינווריאנטים: Configurator/סימולטור, משפך WhatsApp, Supabase CRM+RLS, api/lead, המוח), live (זמינות אתר + /api/lead), SEO/GEO/AEO (sitemap, schema, llms.txt), ו-secrets/deps (חוזה env, אין דליפת .env, npm audit). פותח GitHub Issue על drift ומנסה PR-fix. Triggers on: architecture, guardian, ארכיטקטורה, תקינות, health check, drift, integrity, end-to-end, 24/7, arch audit."
user-invocable: true
argument-hint: "[check|report|fix] [code|live|seo|secrets|all]"
license: MIT
metadata:
  author: ULease Claude OS
  version: 1.0.0
---

# 🛡️ Architecture Guardian — מגן הארכיטקטורה 24/7 (MiaMe)

> **שער מותג:** כל פלט פומבי (issue, דוח, PR) עברית RTL · מובייל-first · בלי הבטחות מוחלטות.

## תפקיד

ה-Guardian הוא **האחראי הישיר** על **MiaMe.co.il** (מכירה · השכרה שיתופית · שירות).
בכל זמן נתון הוא מוודא שהארכיטקטורה **תקינה מקצה-לקצה** — מהקוד דרך ה-API ועד האתר החי
ומנועי-התשובות (AI). דטרמיניסטי בלבד, כמו ה-`GUARDIAN` ב-[`docs/MIAME_AGENT_STRATEGY.md`](../../../docs/MIAME_AGENT_STRATEGY.md).

## מנגנון 24/7

GitHub Actions cron — לא תלוי בסשן: [`.github/workflows/arch-guardian.yml`](../../../.github/workflows/arch-guardian.yml)
(כל 6 שעות + push + ידני). מנוע דטרמיניסטי: [`scripts/arch-guardian.mjs`](../../../scripts/arch-guardian.mjs).

## 4 תחומי הבדיקה

### 1. Code
- `npm run typecheck` (critical) · `npm run lint` · `npm run build`.
- **אינווריאנטים** — קבצי ליבת המוצר:
  - `components/Configurator.tsx` — סימולטור התשלומים (ליבה).
  - `lib/finance.ts` — מנוע המימון · `lib/whatsapp.ts` — משפך הלידים ל-WhatsApp.
  - `lib/supabase.ts` + `supabase/schema.sql` — CRM + **RLS** (ציות תיקון 40 / GDPR).
  - `app/api/lead/route.ts` — לכידת ליד (critical) · `brain/index.ts` — המוח / Deal Assistant.
  - `app/layout.tsx` — SEO metadata.

### 2. Live / Health
- דף הבית של `miame.co.il` עונה 2xx/3xx · `/api/lead` נגיש.
- `leasing.co.il` (אתר-אם) זמין.

### 3. SEO / GEO / AEO
- `sitemap.xml` תקין · `robots.txt` עם `Sitemap:` · `schema` JSON-LD בדף הבית · `llms.txt` (GEO/AEO).

### 4. Secrets / Deps
- חוזה `.env.example` שלם · **אין** `.env` ב-git · `npm audit` נקי מ-high/critical.

## פרוטוקול פעולה על drift

1. סיווג כל כשל לפי חומרה → `arch-guardian-report.json`.
2. ה-workflow פותח/מעדכן GitHub Issue (label `arch-guardian`).
3. לכשלים בני-תיקון (npm audit) — PR-draft אוטומטי.
4. דיווח נאמן: כשל מדווח עם הפלט; הצלחה רק אחרי שעברה.

## הרצה ידנית

```bash
npm run guardian                                      # כל התחומים
GUARDIAN_DOMAINS=live,seo node scripts/arch-guardian.mjs
GUARDIAN_SKIP_HEAVY=1 node scripts/arch-guardian.mjs  # בלי build
```
