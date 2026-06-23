# MiaMe.co.il

מכונת מכירה רזה לניידות חשמלית פרימיום, מבית Leasing.co.il.
דף נחיתה אחד: סימולטור תשלומים, לידים ישירות לוואטסאפ, וסקשן שותפים.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase · Vercel.

## Quick start

```bash
npm install
cp .env.example .env.local   # מלאו Supabase + מספר וואטסאפ
npm run dev                  # http://localhost:3000
```

## משתני סביבה

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=972501234567
```

## מבנה

```
app/         layout + page + globals.css
components/  Header, Hero, Configurator (ליבה), Partner, Footer, FloatingWa
lib/         models, finance, whatsapp, supabase, analytics
supabase/    schema.sql
docs/        RUNBOOK.md (הוראות העלאה מלאות)
```

הוראות מלאות להעלאה, חיבור Supabase, פריסה וחיבור דומיין: ראו `docs/RUNBOOK.md`.
