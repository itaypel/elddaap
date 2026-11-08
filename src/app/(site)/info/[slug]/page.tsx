import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cancellationPolicies } from "@/lib/data";

const pages: Record<string, { title: string; body: React.ReactNode }> = {
  terms: {
    title: "תנאי שימוש",
    body: (
      <>
        <p>הפעילו היא פלטפורמה שמחברת בין לקוחות לבין מפעילים עצמאיים של הפעלות לילדים. ההזמנה נעשית מול המפעיל, והפלטפורמה מנהלת את הבקשה, האישור והתשלום.</p>
        <h2>איך נוצרת הזמנה</h2>
        <p>שליחת בקשה אינה מחייבת. ההזמנה נסגרת רק אחרי שהמפעיל מאשר את המועד והלקוח משלם מקדמה של 30% מהמחיר. היתרה משולמת לפי התנאים שמופיעים בעמוד התשלום.</p>
        <h2>אחריות</h2>
        <p>המפעיל אחראי לביצוע ההפעלה, לבטיחות ולעמידה בדרישות הרישוי והביטוח. הפלטפורמה בודקת מסמכים לפני שפרופיל עולה לאתר ומטפלת בתלונות.</p>
        <p className="note">גרסת הדגמה. נוסח משפטי מלא ייכתב לפני השקה, כולל גילוי נאות לפי חוק הגנת הצרכן.</p>
      </>
    ),
  },
  cancellation: {
    title: "מדיניות ביטולים והחזרים",
    body: (
      <>
        <p>כל מפעיל בוחר אחת משלוש מדיניויות ביטול. המדיניות מופיעה בכרטיס המפעיל ובעמוד ההזמנה לפני השליחה.</p>
        {Object.values(cancellationPolicies).map((p) => (
          <section key={p.name}>
            <h2>מדיניות {p.name}</h2>
            <ul>
              {p.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        ))}
        <p>בקשה שעדיין לא אושרה אפשר לבטל בכל רגע בלי עלות. החזרים מבוצעים לאמצעי התשלום המקורי תוך 14 ימי עסקים.</p>
      </>
    ),
  },
  privacy: {
    title: "מדיניות פרטיות",
    body: (
      <>
        <p>אנחנו אוספים רק את המידע שנדרש כדי לנהל הזמנה: שם, טלפון, אימייל, כתובת האירוע ופרטים על הילדים (מספר וטווח גילאים). פרטי כרטיס האשראי מעובדים אצל ספק הסליקה ולא נשמרים אצלנו.</p>
        <h2>תמונות של ילדים</h2>
        <p>תמונות שבהן מזוהים ילדים לא מתפרסמות בלי הסכמה בכתב של ההורים או המוסד, ועוברות בדיקה ידנית לפני פרסום.</p>
        <p className="note">גרסת הדגמה. נוסח מלא ייכתב לפני השקה.</p>
      </>
    ),
  },
  accessibility: {
    title: "הצהרת נגישות",
    body: (
      <>
        <p>האתר נבנה לפי הנחיות WCAG 2.2 ברמה AA: ניגודיות של 4.5:1 לפחות לטקסט, ניווט מלא במקלדת עם פוקוס נראה, תוויות לכל שדה, תמיכה בהגדלת טקסט ובקוראי מסך, והתחשבות בהגדרת הפחתת תנועה.</p>
        <p>נתקלתם בבעיית נגישות? כתבו לנו ונטפל בה.</p>
      </>
    ),
  },
  contact: {
    title: "צור קשר",
    body: (
      <>
        <p>שאלה על הזמנה? הכי מהיר דרך כפתור ההודעה באזור <Link href="/bookings">ההזמנות שלי</Link>.</p>
        <p>מפעילים שרוצים להצטרף: <Link href="/operator/join">טופס ההצטרפות</Link>.</p>
        <p>מוסדות: <Link href="/institutions">בקשה להצעות מחיר</Link>.</p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: pages[slug]?.title ?? "מידע" };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
      <h1 className="text-[32px] font-extrabold tracking-tight">{page.title}</h1>
      <div className="mt-6 flex flex-col gap-4 text-[17px] leading-relaxed [&_.note]:rounded-xl [&_.note]:bg-sunken [&_.note]:p-4 [&_.note]:text-[15px] [&_.note]:text-muted [&_a]:font-semibold [&_a]:text-accent-ink [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:ps-6">
        {page.body}
      </div>
    </article>
  );
}
