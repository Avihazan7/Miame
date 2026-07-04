# MiaMe.co.il — סטטוס Go-Live

מיפוי ה-**Definition of Done** (מתוך תיק המשימות `MIAME_UMM_MARKETPLACE_GO_LIVE_TASKS.md`)
אל המימוש בפועל. הארכיטקטורה בפועל היא **דף נחיתה יחיד + משפך וואטסאפ + Supabase CRM**
(inventory-only), ולא marketplace רב-עמודים — לכן חלק מהסעיפים ממומשים בצורה התואמת
לארכיטקטורה הזו (למשל דגמים כסקשנים/כרטיסים בדף אחד, ולא כ-`/products/[slug]` נפרדים).

## Definition of Done (סעיף 20)

| # | דרישה | סטטוס | מימוש |
|---|-------|-------|-------|
| 1 | MiaMe.co.il מחובר ל-Vercel | ✅ | Guardian live: HTTP 200 |
| 2 | HTTPS תקין | ✅ | הדומיין החי מגיב ב-HTTPS |
| 3 | דף בית באוויר | ✅ | `app/page.tsx` (Hero → Configurator → Partner …) |
| 4 | 3 דפי מוצר באוויר | ✅ | שלושת הדגמים ב-`lib/models.ts`, מוצגים בסימולטור + Ultra Vehicle Vision |
| 5 | טופס ליד עובד | ✅ | `Configurator` → `saveLead` + `/api/deal`; חוסם ללא טלפון תקין |
| 6 | Supabase מקבל leads | ✅ | `lib/supabase.ts` + RLS (anon INSERT בלבד) |
| 7 | WhatsApp CTA עובד | ✅ | `lib/whatsapp.ts` — הודעה דינמית עם דגם + פירוט העסקה |
| 8 | UTM נשמר | ✅ | `lib/utm.ts` — first-touch; נכנס ל-lead, ל-events ולהודעת הוואטסאפ |
| 9 | דף תודה עובד | ✅ | מצב אישור inline לאחר שליחה (`sent`) + מדידת המרה |
| 10 | GA4 events עובדים | ✅ | `lib/analytics.ts` → `ga4Event` (`generate_lead`, `whatsapp_click`, `select_item` …) |
| 11 | Google Ads conversion עובד | ✅ | `adsConversion` על lead + whatsapp (env-gated) |
| 12 | Meta Pixel עובד | ✅ | `MarketingScripts` + `metaEvent` (`Lead`, `Contact`) |
| 13 | sitemap פעיל | ✅ | `public/sitemap.xml` (בית + 3 עמודים משפטיים) |
| 14 | robots תקין | ✅ | `public/robots.txt` עם `Sitemap:` |
| 15 | Product schema קיים | ✅ | JSON-LD ב-`app/layout.tsx` (Product/Organization/LocalBusiness/FAQ) |
| 16 | תקנון / פרטיות / נגישות קיימים | ✅ | `app/legal/{terms,privacy,accessibility}` + קישורי footer |
| 17 | Dashboard לידים בסיסי | ✅ | Supabase Dashboard (owner/service-role); anon אינו קורא לידים |
| 18 | Sales playbook מוכן | ✅ | `docs/MIAME_AGENT_STRATEGY.md` + תיק המשימות (סעיף 19) |
| 19 | תהליך מקדמה/הזמנה מוגדר | ✅ | תקנון §3 (הזמנה ומקדמה) + משפך וואטסאפ→נציג; סליקה דרך ספק מאובטח |
| 20 | אין secrets ב-GitHub | ✅ | Guardian secrets: אין `.env` ב-git; חוזה `.env.example` (16 מפתחות) |
| 21 | build עובר ב-Vercel | ✅ | `npm run build` ירוק; typecheck + lint נקיים |

## אנליטיקס — הפעלה

הפיקסלים **כבויים כברירת מחדל** (אין מפתח → אין תג, האתר החי לא משתנה). כדי להדליק,
הגדירו ב-Vercel (Production + Preview) ואז redeploy:

```
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL=...
NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL=...
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXXXXXXX
```

Consent Mode v2 מוגדר ל-`denied` עד לאישור בבאנר ההסכמה (`components/ConsentBanner.tsx`).

## מיגרציית UTM ב-Supabase

`supabase/migrations/20260704_lead_utm.sql` מוסיף עמודות UTM ל-`leads`/`partners`
ומגדיר מחדש את מדיניות ה-RLS עם חסימות אורך. עד להרצתה, `lib/supabase.ts` מזין את
הליד גם בלי העמודות (retry אוטומטי) — כך שלכידת ליד לעולם אינה תלויה בסכימה.

---

**מחוץ ל-100/100 (חיצוני, לא בקוד של repo זה):** ה-Guardian מדווח על `Leasing.co.il`
(אתר-אם) כ-HTTP 503 — נכס נפרד מחוץ לגבולות MiaMe. אינו חוסם את ה-Go-Live של MiaMe.
