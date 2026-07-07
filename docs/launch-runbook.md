# MiaMe.co.il — Launch Runbook

צעד-אחר-צעד להשקה ולניטור אחריה. משלים את `docs/go-live-audit-final.md` ואת `docs/GO_LIVE_STATUS.md`.

---

## 0. תנאי סף (כבר ירוקים)

- `npm run typecheck` ✅ · `npm run lint` ✅ (אזהרות `<img>` בלבד) · `npm test` ✅ (45/45) · `npm run build` ✅
- Guardian (code invariants + secrets) ✅ · gitleaks ✅ · `npm audit` critical=0 ✅
- אין secrets ב-git · אין שינויי env · אין כתיבות DB · אין מיגרציות שהוחלו.

---

## 1. Pre-deploy (merge → production)

1. מזג את ה-PR ל-`main` (draft → ready → merge). CI חייב להיות ירוק.
2. Vercel יבנה אוטומטית deploy לפרודקשן מ-`main`.
3. אמת שה-deploy האחרון **READY**.

---

## 2. אנליטיקס — הדלקה (אופציונלי, כשמוכנים לקמפיין)

הפיקסלים **כבויים כברירת מחדל** (אין id → אין תג). כדי להדליק, הגדר ב-Vercel (Production + Preview) ואז redeploy:

```
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL=...
NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL=...
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXXXXXXX
```

- Consent Mode v2 boot ל-`denied`; מתעדכן ל-granted רק אחרי אישור בבאנר.
- **אין להוסיף id חדשים בקוד** — env בלבד.

---

## 3. Smoke test בפרודקשן (ידני, אחרי deploy)

- [ ] `/` נטען; Hero + תמונת המוצר המרכזית + סימולטור מוצגים.
- [ ] רצועת "מבצע השקה" מופיעה בראש; CTA גולל לסימולטור.
- [ ] TrustSignalBar מוצג אחרי Hero.
- [ ] סקשן Deal Buzz מוצג אחרי הסימולטור; 4 הכרטיסים עובדים (sim scroll / WhatsApp).
- [ ] סימולטור מחשב תשלום חודשי; שינוי דגם/מסלול מעדכן.
- [ ] טופס ליד: חוסם בלי טלפון תקין; שורת consent מוצגת; honeypot קיים (נסתר).
- [ ] "קבל הצעת עסקה בוואטסאפ" → פותח wa.me עם דגם + פירוט + UTM, ומנווט ל-`/thank-you`.
- [ ] `/thank-you` → noindex, CTA להמשך WhatsApp, 3 צעדים, disclaimer.
- [ ] מובייל: sticky CTA למטה, WhatsApp צף, אין overflow אופקי, אין CLS.
- [ ] עמודי SEO (`/mia-four` וכו') נטענים; FAQ + CTA.
- [ ] עמודים משפטיים נגישים מה-footer.

---

## 4. אימותים חוצי-מערכת

- [ ] Supabase: ליד בדיקה נכתב ל-`leads`; anon לא קורא לידים (RLS); service-role רק בשרת.
- [ ] Vercel logs: אפס runtime errors; 416 (אם מופיע) רק על נכסים סטטיים, לא על `/api/*`.
- [ ] `/api/health` → 200.
- [ ] WhatsApp: ההודעה מגיעה לנציג עם כל השדות.

---

## 5. מיגרציית Supabase (אופציונלי, דורש אישור)

advisors מסמנים `search_path` mutable ל-`public.seo_touch_updated_at` ו-`public.catalog_touch_updated_at`
בפרויקט **`leasing-co-il-prod`**. הוכנה מיגרציה (לא הוחלה):

`supabase/migrations/20260707_harden_touch_updated_at_search_path.sql`

```sql
alter function public.seo_touch_updated_at()      set search_path = public, pg_temp;
alter function public.catalog_touch_updated_at()  set search_path = public, pg_temp;
```

- **סיכון:** אפס — behaviour-preserving (trigger, zero-arg, SECURITY INVOKER; רק `NEW.updated_at = now()`).
- **החלה רק אחרי** אמירת האישור המפורשת: **`APPROVE MIAME PRODUCTION MIGRATION`**.
- להחלה: `supabase db push` / MCP `apply_migration` על ה-ref הנכון (eu-central-1) — **לא** אוטומטית.

---

## 6. Rollback

- כל שינוי ה-Go-Live הוא **additive** (רכיבים חדשים + תוכן + טסטים). Rollback = revert של ה-PR ב-GitHub → Vercel redeploy אוטומטי.
- אין מיגרציה שהוחלה → אין מה לשחזר ב-DB.
- אין שינוי env → אין מה לבטל בהגדרות.

---

## 7. ניטור שוטף (post-launch)

ראה `docs/go-live-audit-final.md` §12. Guardian cron (`.github/workflows/arch-guardian.yml`)
פותח Issue על drift ב-code/live/seo/secrets.
