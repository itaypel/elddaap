# הפעילו — פלטפורמת ההפעלות לילדים

מרקטפלייס שמחבר בין הורים, בתי ספר ומוסדות לבין מפעילי הפעלות לילדים: חיפוש לפי תאריך, גיל, אזור ותקציב, בקשת הזמנה שהמפעיל מאשר, תשלום מקדמה ודירוג אחרי האירוע.

הנתונים נשמרים ב־Supabase (Postgres), והכניסה היא עם חשבון Google. כל שינוי סטטוס בהזמנה עובר דרך פונקציה במסד הנתונים שבודקת מי מבצע אותו, כולל חסימה של שתי הזמנות חופפות לאותו מפעיל.

## שלושה צדדים, מסד נתונים אחד

| צד | נתיבים |
| --- | --- |
| לקוחות | `/` · `/search` · `/operators/[slug]` · `/book/[slug]` · `/bookings` · `/pay/[id]` · `/rate/[id]` · `/institutions` |
| מפעילים | `/operator/join` · `/operator` · `/operator/requests` · `/operator/calendar` · `/operator/profile` · `/operator/income` · `/operator/reviews` · `/operator/settings` |
| ניהול | `/admin` · `/admin/bookings` · `/admin/approvals` · `/admin/catalog` |

התהליך המלא להדגמה:

1. לקוח שולח בקשה ל־Water Battle מתוך `/operators/water-battle`.
2. ב־`/operator/requests` המפעיל מאשר (או מציע מועד אחר / דוחה). שתי בקשות חופפות לא יכולות להיות מאושרות יחד.
3. ב־`/bookings` הלקוח רואה "ממתינה לתשלום" ומשלם מקדמה ב־`/pay/[id]`.
4. בלוח הבקרה של המפעיל מסמנים "הושלמה", והלקוח מדרג ב־`/rate/[id]`. הביקורת מופיעה בכרטיס המפעיל.

## טכנולוגיה

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 4 עם טוקנים סמנטיים לבהיר/כהה (`src/app/globals.css`)
- Supabase: Postgres עם Row Level Security, התחברות עם Google, פונקציות SQL לכל שלב בהזמנה
- Zustand למצב ממשק בלבד (הודעות, השוואה, מצב התחברות)
- עברית RTL, גופן Heebo, אייקונים של Lucide

## פיתוח

```bash
npm install
vercel env pull .env.local   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev                  # http://localhost:3000
```

מסד הנתונים:

```bash
supabase link --project-ref <ref>
supabase db push             # supabase/migrations: סכמה, הרשאות, פונקציות ונתוני הדגמה
node scripts/gen-seed.ts     # יוצר מחדש את קובץ ה־seed מ־supabase/seed-data.ts
```

יש מנהל מערכת אחד בלבד (אינדקס ייחודי במסד הנתונים חוסם מנהל שני). הוא מוגדר ידנית: `update profiles set is_admin = true where email = '...'`. כדי להחליף מנהל, קודם מבטלים את הקודם.

## מבנה

```
supabase/migrations/   סכמה, RLS, פונקציות ההזמנה ונתוני הדגמה
src/lib/data.ts        טיפוסים, קטגוריות, סטטוסים ועיצוב תאריכים
src/lib/db.ts          קריאות מהשרת (קטלוג ציבורי, ההזמנות שלי, מפעיל, ניהול)
src/app/actions.ts     כל הפעולות שמשנות נתונים (Server Actions)
src/proxy.ts           רענון ההתחברות והפניה לכניסה בעמודים אישיים
src/components/        רכיבי UI, ה־StatusTrack, גיליונות (dialog), ניווט לכל צד
src/app/(site)         האתר ללקוחות
src/app/(flow)         תהליכים ממוקדים: הזמנה, תשלום, דירוג
src/app/operator       הצטרפות ואזור המפעילים
src/app/admin          מערכת הניהול
```

## מה נדרש לפני השקה

- ספק סליקה שתומך במודל מרקטפלייס ופיצול תשלומים
- התראות וואטסאפ / SMS / אימייל
- העלאת קבצים אמיתית למסמכים ולתמונות (Supabase Storage), עם בדיקה ידנית
- טבלאות לתלונות ולביקורות שדווחו (כרגע נתוני דוגמה במסך הניהול)
- הודעות בין לקוח למפעיל
- נוסח משפטי לתנאי שימוש, מדיניות ביטולים ופרטיות
