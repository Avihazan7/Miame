# MiaMe.co.il · ספר הפעלה (RUNBOOK)

מסמך זה מרכז כל מה שצריך כדי להעלות את MiaMe.co.il לאוויר ולהתחיל לייצר לידים.
הקוד מוכן. נשארו רק חיבורים (Supabase, וואטסאפ, דומיין) והזנת תוכן אמיתי.

---

## 0. מה כבר בנוי

דף נחיתה אחד, מובייל-פירסט, בעברית מלאה (RTL), הכולל:

- Hero עם מיתוג MiaMe ו-Powered by Leasing.co.il.
- שלושה דגמים: 4×2 (19,900), 2×4 Long Range (21,900), 4×4 (27,900).
- סימולטור תשלומים חי עם שלושה מסלולים: פרטי, עסקי, שותף.
- טופס ליד שנפתח ישירות לוואטסאפ עם כל פרטי הסימולציה.
- סקשן שותפים (MiaMe Hub) עם מודל 13% Success Fee ומחירון לדוגמה.
- שמירת לידים ואירועים ל-Supabase (Lead Engine + Analytics).

המחירים והתשלומים הם הערכה בלבד, ללא ריבית והצמדה (יתרה לאחר מקדמה ובלון, חלקי מספר התשלומים).

---

## 1. שלושה ערכים שצריך למלא לפני העלייה

1. מספר וואטסאפ עסקי (בפורמט בינלאומי, לדוגמה 972501234567).
2. כתובת ומפתח Supabase (URL + anon key).
3. תמונות רכב אמיתיות (כרגע יש איור וקטורי זמני).

בלי 1 ו-2 האתר עדיין יעלה ויעבוד, אבל הלידים לא יישמרו והוואטסאפ יפנה למספר ברירת מחדל.

---

## 2. הרצה מקומית

```bash
npm install
cp .env.example .env.local
# למלא ערכים ב-.env.local (ראו סעיף 3)
npm run dev
# נפתח ב-http://localhost:3000
```

בנייה לבדיקה:

```bash
npm run build
npm start
```

---

## 3. משתני סביבה (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_WHATSAPP_NUMBER=972501234567
```

הערה: כל המשתנים מתחילים ב-NEXT_PUBLIC כי הם רצים בצד הלקוח. ה-anon key מיועד לחשיפה ציבורית. המפתח הסודי (service_role) לא נמצא בקוד ואסור להכניס אותו לכאן.

---

## 4. Supabase

1. צרו פרויקט חדש ב-supabase.com.
2. Settings > API: העתיקו את ה-Project URL ואת ה-anon public key אל .env.local.
3. SQL Editor > New query: הדביקו את כל התוכן של `supabase/schema.sql` והריצו (Run).
4. זה יוצר את הטבלאות leads, partners, events ומפעיל RLS.

מדיניות האבטחה (RLS): הציבור יכול רק להוסיף שורות (INSERT), ולא לקרוא. צפייה בלידים נעשית מתוך לוח הבקרה של Supabase (Table Editor) שמשתמש בהרשאת בעלים.

קריאת לידים חדשים: Table Editor > leads, ממוין לפי created_at יורד.

---

## 5. פריסה ל-Vercel

1. דחפו את הקוד ל-GitHub (ראו סעיף 8).
2. ב-vercel.com: Add New > Project > בחרו את ה-repo.
3. Framework מזוהה אוטומטית כ-Next.js. אין צורך לשנות Build Command.
4. Environment Variables: הוסיפו את שלושת המשתנים מסעיף 3 (זהה ל-.env.local).
5. Deploy.

---

## 6. חיבור הדומיין MiaMe.co.il

1. ב-Vercel: Project > Settings > Domains > Add > הקלידו miame.co.il (וגם www.miame.co.il).
2. Vercel ייתן רשומות DNS (A / CNAME).
3. אצל רשם הדומיין: הצביעו את הרשומות לפי ההנחיה של Vercel.
4. המתינו להפצת DNS (לרוב דקות עד שעות). ה-SSL מונפק אוטומטית.

---

## 7. נקודות עריכת תוכן (איפה משנים מה)

- מחירים, שמות דגמים וטקסט שיווקי: `lib/models.ts`.
- חוקי המסלולים (מקדמה, בלון, תשלומים, הנחת שותף): `lib/finance.ts`.
- נוסח הודעת הוואטסאפ של הליד ושל השותף: `lib/whatsapp.ts`.
- כותרת ראשית, סאב-כותרת וכפתורים: `components/Hero.tsx`.
- מחירון ההשכרה ומודל השותפות: `components/Partner.tsx`.
- כתב ויתור משפטי בתחתית: `components/Footer.tsx`.
- צבעים ועיצוב כללי: `app/globals.css` ו-`tailwind.config.ts`.
- האיור הזמני של הרכב: `components/VehicleSvg.tsx`. להחלפה בתמונה אמיתית, אפשר להחליף ל-`<img>` או ל-`next/image` בתוך הכרטיס ב-`components/Configurator.tsx` וב-`Hero.tsx`.

---

## 8. העלאה ל-GitHub

```bash
cd miame
git init
git add .
git commit -m "MiaMe MVP"
git branch -M main
git remote add origin https://github.com/<user>/miame.git
git push -u origin main
```

קובץ `.gitignore` כבר מגדיר ש-node_modules ו-.next וקבצי .env לא יעלו.

---

## 9. אנליטיקס ופיקסל (אופציונלי, מומלץ לפני קמפיין)

- אירועי מוצר (PageViewed, ModelSelected, SimulatorChanged, LeadSubmitted, WhatsAppClicked, PartnerInterest) כבר נשמרים בטבלת events ב-Supabase.
- להוספת Meta Pixel או Google Analytics: הזריקו את הסקריפט ב-`app/layout.tsx` (בתוך ה-head) או דרך רכיב Script של next/script.

---

## 10. צ׳ק-ליסט יום ההשקה

- [ ] .env.local וגם משתני Vercel מלאים (Supabase + וואטסאפ).
- [ ] schema.sql רץ ב-Supabase, שלוש הטבלאות קיימות.
- [ ] הדומיין miame.co.il מחובר ומגיב ב-HTTPS.
- [ ] לחיצה על "שלחו לי הצעה בוואטסאפ" פותחת שיחה עם הפרטים הנכונים.
- [ ] ליד בדיקה הופיע בטבלת leads.
- [ ] תצוגת מובייל מושלמת (כפתורים, סליידרים, טופס).
- [ ] תמונות רכב אמיתיות הוחלפו (או שהוחלט לצאת עם האיור הזמני).
