# MiaMe.co.il — Go-Live Audit (Final)

תאריך: 7 ביולי 2026 · ענף: `claude/miame-final-go-live-buzz-polish-y16nmh` · בסיס: `main` (כולל PR #92)

אודיט קוד מקצה-לקצה לקראת השקה. כל הבדיקות בוצעו **קריאה-בלבד** על הקוד + כלים read-only
(Vercel/Supabase MCP). **אין** כתיבות DB, מיגרציות, שינויי env או קריאות בתשלום.

---

## 1. מפת נתיבים (Route map)

| נתיב | סוג | Index | קובץ |
|---|---|---|---|
| `/` | דף בית (static) | ✅ index,follow | `app/page.tsx` |
| `/mia-four` | SEO landing | ✅ | `app/(seo)/mia-four/page.tsx` |
| `/klnoit-4-galgalim` | SEO landing | ✅ | `app/(seo)/klnoit-4-galgalim/page.tsx` |
| `/klnoit-mitkapelet` | SEO landing | ✅ | `app/(seo)/klnoit-mitkapelet/page.tsx` |
| `/klnoit-shetach` | SEO landing | ✅ | `app/(seo)/klnoit-shetach/page.tsx` |
| `/legal/terms` | משפטי | ✅ | `app/legal/terms/page.tsx` |
| `/legal/privacy` | משפטי | ✅ | `app/legal/privacy/page.tsx` |
| `/legal/accessibility` | משפטי | ✅ | `app/legal/accessibility/page.tsx` |
| `/thank-you` | אישור ליד | 🚫 **noindex,nofollow** | `app/thank-you/page.tsx` |
| `/_not-found` (404) | מערכת | 🚫 **noindex** | `app/not-found.tsx` |
| `error` boundary | מערכת | — (client) | `app/error.tsx` |
| `/icon.svg` | favicon | — | `app/icon.svg` |

**מסקנה:** אין noindex בטעות על עמוד ציבורי; עמודי מערכת (תודה/404) חסומים לאינדוקס.

---

## 2. מפת API (API map)

כל נתיבי ה-POST הציבוריים עוברים את שרשרת ה-`guardJsonPost` (Origin allowlist → per-IP rate limit → body cap → JSON parse) לפני עבודה כלשהי, ולעולם לא מדליפים שגיאת ספק גולמית.

| נתיב | Method | הגנה | Secrets | הערה |
|---|---|---|---|---|
| `/api/lead` | POST/GET | guard + zod + honeypot | server-only (`ANTHROPIC_API_KEY`) | ליד → pipeline; GET=health |
| `/api/deal` | POST/GET | guard + honeypot | server-only relay | דיל → central brain, sealed score; soft-degrade |
| `/api/signal` | POST | guard + bounded fields | server-only relay | Big Five signal |
| `/api/catalog-match` | POST | guard + ref regex | server-only relay | Master Match; degrade→grid |
| `/api/catalog` | GET | — (read) | server-only relay | catalog מ-read model; fallback ריק |
| `/api/brain` | POST/GET | guard | server-only (`ANTHROPIC_API_KEY`) | U.M.M brain; GET=health |
| `/api/embed` | POST/GET | **admin gate (timing-safe)** | `EMBED_ADMIN_TOKEN` + service-role | fail-closed; backfill embeddings |
| `/api/vehicle-media-events` | POST | guard + zod | service-role (server) | insert אירועי מדיה |
| `/api/vehicles/[id]/media` | GET | — (read) | service-role (server) | soft-degrade ל-503 ללא env |
| `/api/health` | GET | — | ללא | uptime, secret-free, תמיד 200 |

**מסקנה:** אין service-role בקוד client; שגיאות upstream ממופות ל-503/500 גנריים.

---

## 3. מפת משפך הליד (Lead funnel)

```
Configurator (בחירת דגם + סימולטור)
  → ולידציית טלפון (≥9 ספרות; חוסם "ליד" ריק)
  → honeypot (שדה website מוסתר)
  → saveLead()  →  Supabase leads  (anon INSERT בלבד, RLS)
  → POST /api/deal  →  central brain (sealed Deal Score, additive)
  → buildWhatsAppUrl()  →  wa.me/972547477477 (הודעה עם דגם + פירוט העסקה + UTM)
  → router.push('/thank-you')  →  עמוד אישור + מדידת המרה
```

- **Attribution:** `lib/utm.ts` — first-touch, נשמר ל-session, נכנס ל-lead, להודעת WA ולכל event.
- **עמידות:** WA + Supabase יורים תחילה; כשל ב-brain לעולם לא עולה בליד.
- **הסכמה:** שורת consent חדשה מתחת ל-CTA ("מאשר/ת יצירת קשר טלפוני ובוואטסאפ… בהתאם למדיניות הפרטיות").

---

## 4. מפת אירועי אנליטיקס (Analytics event map)

`lib/analytics.ts` → 3 sinks (Supabase `events` · GA4 · Ads/Meta), כולם env-gated ו-best-effort.

| Event פנימי | GA4 | Google Ads | Meta Pixel |
|---|---|---|---|
| `PageViewed` | (config page_view) | — | PageView |
| `ModelSelected` | `select_item` | — | ViewContent |
| `SimulatorChanged` | `configure_deal` | — | — |
| `LeadSubmitted` | `generate_lead` | conversion (lead label) | Lead |
| `WhatsAppClicked` | `whatsapp_click` | conversion (WA label) | Contact |
| `PartnerInterest` | `generate_lead` (b2b) | — | Lead (b2b) |
| `DealBuzzClicked` **(חדש)** | `select_promotion` | — (engagement, לא conversion) | `DealBuzzClick` (custom) |

- **Consent Mode v2:** boot ל-`denied` (סטטי), granted רק אחרי אישור בבאנר.
- **Env-gated:** ללא `NEXT_PUBLIC_*` id → אין תג נטען, ההלפרים no-op (מאומת ב-`test/analyticsSafety.test.ts`).
- **UTM/gclid/fbclid:** נלכדים ב-`lib/utm.ts` ומצורפים לכל event ולהודעת ה-WA.

---

## 5. מפת עמודי SEO (SEO page map)

- **Metadata:** לכל עמוד title/description/canonical ייעודיים (`app/layout.tsx` + כל `(seo)/*`).
- **JSON-LD:** בית — Organization + Product(AggregateOffer) + LocalBusiness + FAQPage; עמודי SEO — FAQPage + BreadcrumbList (נגזר מאותו content model → אין drift).
- **Sitemap:** `public/sitemap.xml` — בית + 4 עמודי SEO + 3 משפטיים (ללא thank-you/api).
- **Robots:** `public/robots.txt` — `Allow: /` + `Sitemap:`.
- **GEO/AEO:** `public/llms.txt` עם הערת מקור-אמת וכפיפות תנאים.
- **Keywords:** עבריים וטבעיים ("קלנועית 4 גלגלים / מתקפלת / שטח", "מיה פור"); אין עמודים דקים או מקניבלים (מאומת ב-`test/goLive.test.ts`).

---

## 6. מפת משפטי/ציות (Legal/compliance map)

| נושא | סטטוס | מקור |
|---|---|---|
| מדיניות פרטיות | ✅ (חוק הגנת הפרטיות תשמ"א-1981) | `app/legal/privacy` |
| תקנון ותנאי שימוש | ✅ (כולל מחיר/מלאי/מימון/ביטול/אחריות) | `app/legal/terms` |
| הצהרת נגישות | ✅ (ת"י 5568 · WCAG 2.1 AA) | `app/legal/accessibility` |
| Disclaimer מימון/מחיר/מלאי | ✅ (footer + סימולטור + Deal Buzz + thank-you) | `Footer` / `Configurator` / `lib/deal-buzz` |
| "כפוף לאישור החברה/היבואן" | ✅ (נוסח מנדטורי מוטמע) | `BUZZ_DISCLAIMER` |
| הסכמת ליד / וואטסאפ | ✅ (שורת consent חדשה על הטופס) | `Configurator` |
| Consent עוגיות/אנליטיקס | ✅ (Consent Mode v2, default denied) | `ConsentBanner` / `MarketingScripts` |

---

## 7. בקרות אבטחה (Security controls)

- **API guards:** Origin allowlist + per-IP fixed-window rate limit + body-size cap + JSON parse (`lib/apiGuard.ts`).
- **Honeypot:** שדה `website` מוסתר; מדמה הצלחה בלי לשמור/למדוד/לפתוח WA.
- **Admin gate:** `/api/embed` fail-closed, `timingSafeEqual` על `EMBED_ADMIN_TOKEN`.
- **Secrets:** anon key ציבורי-בכוונה (RLS: anon INSERT בלבד); service-role רק בצד שרת. אין `.env` ב-git.
- **Headers (next.config.js):** CSP מהודק, HSTS, X-Frame-Options=SAMEORIGIN, X-Content-Type-Options=nosniff, Referrer-Policy, Permissions-Policy.
- **Image optimizer:** `remotePatterns` מוגבל ל-host ה-Supabase של הפרויקט בלבד.
- **CI:** typecheck + lint + test + build + gitleaks (redacted) + npm audit על כל PR.

---

## 8. Supabase (verified read-only)

- **בחירת פרויקט לפי שמות env בלבד:** `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client) + `SUPABASE_SERVICE_ROLE_KEY` (server). לא הודפס אף ערך env.
- **ברירת מחדל בקוד:** ref `thhyfwoeybkptxvbpcmg` (שם: `supabase-crimson-lever`).
- **advisors שב-task:** `public.seo_touch_updated_at` + `public.catalog_touch_updated_at` (search_path mutable) — **אושרו על פרויקט `leasing-co-il-prod`** (ref `xfihhcojfiajbxozanwi`, eu-central-1), ה-DB המרכזי המשותף שאליו ה-env החי של MiaMe מפנה כ-tenant. שתי הפונקציות: trigger, zero-arg, SECURITY INVOKER, ללא search_path.
- **מיגרציה מוכנה (לא הוחלה):** `supabase/migrations/20260707_harden_touch_updated_at_search_path.sql`. סיכון: אפס (behaviour-preserving). דורש אישור מפורש: `APPROVE MIAME PRODUCTION MIGRATION`.
- **Advisor נוסף** בפרויקט crimson-lever: `extension_in_public` (vector) — WARN, לא חוסם.

---

## 9. סיכונים ידועים (Known risks)

| סיכון | חומרה | סטטוס |
|---|---|---|
| `next@14.2.35` — 2 advisories ברמת high (DoS/cache — image optimizer/RSC) | בינוני | **לא חוסם** לפי מדיניות CI (critical-only). מומלץ לתכנן שדרוג Next בנפרד (breaking). |
| תגובות 416 בפרודקשן | נמוך | ארטיפקט range-request בשכבת CDN/סטטי, לא שגיאת אפליקציה (ראה §11). לא שבור. |
| advisors search_path (leasing-co-il-prod) | נמוך | מיגרציה מוכנה, ממתינה לאישור. |
| `<img>` ידני ב-8 רכיבי מדיה | נמוך | אזהרת lint בלבד; תמונות מקומיות מ-`/public`. לא חוסם. |

---

## 10. חוסמי השקה (Launch blockers)

**אין חוסמי go-live בקוד.** כל השערים ירוקים: typecheck ✅ · lint ✅ (אזהרות בלבד) · test ✅ (45/45) · build ✅ · guardian invariants ✅ · secrets ✅ · npm audit (critical-only) ✅.

פריטים לא-חוסמים לתשומת לב: תכנון שדרוג Next; החלטה על מיגרציית search_path (אישור).

---

## 11. תגובות 416 — ממצא (Vercel observability)

**מגבלת גישה:** פרויקט `miame` ב-Vercel מחוץ ל-scope של חיבור ה-MCP (צוות "Hi-tech Top" מכיל רק פרויקטי leasing), וה-egress של הסביבה חוסם גישה ל-`www.miame.co.il`. לכן לא בוצע שחזור חי; הניתוח מבוסס קוד + עקרונות HTTP.

**מהו 416:** *Range Not Satisfiable* (RFC 9110 §15.5.17) — בקשה עם כותרת `Range:` שאין אפשרות לספק (offset מעבר לגודל המשאב).

**למה זה כמעט בוודאות לא-מזיק כאן:**
1. **שכבת CDN/סטטי, לא אפליקציה.** ה-API של MiaMe מחזיר JSON בלבד ואינו משטח range (מאומת ב-`test/goLive.test.ts`: אין `Accept-Ranges`/`Content-Range`). 416 יכול לנבוע רק מנכסי `/public`, מ-Next Image Optimizer, מפונטים או מ-`_next/static` — כולם מוגשים ב-edge של Vercel שתומך מלא ב-range. עקבי עם "אפס runtime errors ב-24 שעות" (416 סטטי לא מפעיל serverless).
2. **200 + 304 באותם נכסים = הנכסים תקינים.** נכס חסר = 404 (לא 416); optimizer שבור = 5xx. תמהיל 200/304 + זנב 416 קטן הוא חתימה קלאסית של clients ששולחים Range probe (Safari media, בוטי preview כמו WhatsApp/Facebook ל-OG, download managers, סורקי AV) — לעיתים range לא-ספיק.
3. **תוכן תמונות + GLB זעיר** (`/public/models/mia-four-x4.glb`, 12KB); אין וידאו/סטרימינג. נפח 416 צפוי נמוך ומתקן-עצמו.

**מתי זה כן שבור (לשלול):** 416 על נכס first-paint קריטי (`/mia-four.webp`, hero, פונט Heebo) עבור range *ספיק* — היה גורר גם 404/5xx ופגיעה ב-LCP. לא דווח.

**מסקנה:** 416 = ארטיפקט משא-ומתן range תקין בשכבת CDN/סטטי. **אין תיקון קוד נדרש.** נוסף regression guard שנועל את המשטח הדינמי כלא-range (כדי ש-416 ברמת אפליקציה לא ייווצר בטעות ע"י route עתידי).

---

## 12. Post-launch monitoring checklist

- [ ] Vercel: אפס runtime errors; latency תקין ל-`/api/lead` ו-`/api/deal`.
- [ ] Vercel status codes: 416 נשאר שבריר קטן מתעבורת נכסים סטטיים, ולעולם לא על `/api/*` או על נכס first-paint (200-קריטי).
- [ ] Supabase: `leads`/`partners` מתמלאים; RLS מונע קריאת anon; advisors ללא ממצא חדש.
- [ ] Analytics: `generate_lead` / `whatsapp_click` / `select_promotion` נספרים; Consent Mode מכבד סירוב.
- [ ] Guardian cron: code/live/seo/secrets ירוקים אחרי כל deploy.
- [ ] npm audit: אפס critical; מעקב אחר שדרוג Next.
- [ ] WhatsApp funnel: הודעות נכנסות עם דגם + פירוט העסקה + UTM.
- [ ] Uptime: `/api/health` מחזיר 200.
