# MiaMe 🛵 · מיה פור · Free Feel 🗽

> שיווק, מכירה, מימון ושיתופי השכרה · תהליך איבחון וזיהוי גולש/לקוח, טיפול · כל מה שקשור
> לרכישת MiaMe ותנאי מימון מיוחדים לקלנועית. קנייה ושירות Online.
>
> **MiaMe.co.il** · זרוע הביצוע הצרכנית (storefront) של מנוע ה‑U.M.M Marketplace.
> מבית **Leasing.co.il** 🎯 ULease.

אתר נחיתה ומשפך מכירה לקלנועית החשמלית הפרימיום **מיה פור** · פלטפורמת 4 גלגלים מוגנת פטנט.
RTL · מובייל‑first · סימולטור תשלומים אינטראקטיבי · ניתוב לוואטסאפ.

---

## הארכיטקטורה (U.M.M Marketplace Engine)

```
Leasing.co.il · U.M.M Brain   (AI + Data + Deal Score · black box)   ← המוח
        │
ULease Engine · Deal-Execution Rails (multi-tenant)                  ← הפלטפורמה
        │
MiaMe (tenant #1) · tenant #2 · tenant #N ...                        ← הדיירים
```

MiaMe מוכיחה את המנוע על מיה פור. אותו מנוע משוכפל לדגמים/יבואנים הבאים ללא בנייה מחדש.
המתודולוגיה (Big Five Dealer · תורת המשחקים/Nash · העשרה אינסטרומנטלית) ושכבת הנתונים
מסונכרנות מההורים (Leasing.co.il / ULease) · בנושא **המוח והטכנולוגיות** בלבד. העסק עצמו
(קלנועיות מול רכבי ליסינג) נפרד.

## ⚠️ שער רגולטורי · P0 (חובה)

עד לקבלת **חוות דעת משפטית** על מודל השליחות (MEU = principal / merchant of record / בעל
רישיון הסליקה), המערכת רצה במצב **ליד → תיק עסקה → סגירה אנושית בלבד**, ללא חיוב חי.

- הסימולטור = **להמחשה בלבד**, עם גילוי נאות. אינו הצעת אשראי.
- כל CTA מוביל ל‑**וואטסאפ / יצירת קשר**, לא לסליקה.
- אין בקוד מסלקה/חיוב. `MiaMe מתווכת · אינה מלווה ואינה מסלקת כספים בעצמה.`

(מקור: `UMM-Deal-Engine-Spec` §3/§8/§9 · `leasing-api/brand-voice.md` §9.4)

## מבנה

```
index.html                 דף הנחיתה (כל הסקשנים, RTL)
assets/styles.css          מערכת עיצוב (azure + gold premium)
assets/app.js              דגמים · סימולטור · ניתוב וואטסאפ · טופס ליד
api/lead.js                שמירת ליד אופציונלית (Supabase REST, env-gated)
supabase/migrations/       0001_leads.sql · טבלת leads + RLS
vercel.json                headers אבטחה + cache
.env.example               משתני סביבה (כולם אופציונליים ל‑P0)
```

## הרצה מקומית

אתר סטטי · ללא build. כל שרת סטטי יספיק:

```bash
npx serve .        # או: python3 -m http.server 3000
```

## פריסה (Vercel)

הפרויקט הוא static + serverless `/api` · אפס הגדרת build.

1. חברו את הריפו ל‑Vercel (team: Hi‑tech Top) · Framework Preset = **Other**.
2. (אופציונלי) הוסיפו משתני סביבה ל‑Production:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` · להפעלת שמירת לידים.
   - `MIAME_WHATSAPP` · מספר הוואטסאפ העסקי (ספרות בלבד, בפורמט בינ"ל).
3. הוסיפו דומיין `miame.co.il` ב‑Vercel → הצביעו DNS (A/CNAME) לפי ההוראות.
4. Supabase: הריצו את `supabase/migrations/0001_leads.sql` בפרויקט.

ללא משתני הסביבה האתר חי ועובד במלואו · הלידים זורמים בוואטסאפ.

## TODO לפני go‑live מלא

- [ ] מספר וואטסאפ עסקי אמיתי (`MIAME_WHATSAPP`).
- [ ] אישור מחירי 3 הדגמים (City/Sport/Max · מחיר ה‑Max הוא הערכה לאישור).
- [ ] תמונות מוצר אמיתיות (מחליפות את ה‑SVG/אימוג'י כ‑placeholder).
- [ ] חיבור דומיין miame.co.il + DNS.
- [ ] (אופציונלי) הפעלת Supabase לשמירת לידים.
- [ ] חוות דעת משפטית → פתיחת שלב הסליקה (P1).
