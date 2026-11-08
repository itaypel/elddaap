import Link from "next/link";
import { CalendarCheck, Star, ListChecks, ShieldCheck, ArrowLeft, Check } from "lucide-react";
import { categories, publicOperators } from "@/lib/data";
import { CategoryIcon } from "@/components/brand";
import { HeroSearch } from "@/components/hero-search";
import { OperatorCard } from "@/components/operator-card";
import { ButtonLink } from "@/components/ui";

const audiences = [
  { label: "הורים ומשפחות", href: "/search?type=יום הולדת" },
  { label: "בתי ספר וגנים", href: "/institutions" },
  { label: "תנועות נוער ומתנ״סים", href: "/institutions" },
  { label: "רשויות ומוסדות", href: "/institutions" },
  { label: "ארגונים וועדי עובדים", href: "/search?type=יום משפחות" },
];

const steps = [
  { title: "מחפשים", text: "לפי תאריך, גיל, אזור ותקציב." },
  { title: "משווים", text: "מחיר, מה כלול, אזורי שירות ודירוגים מאומתים." },
  { title: "שולחים בקשה", text: "בלי חיוב. המפעיל מקבל את כל פרטי האירוע." },
  { title: "המפעיל מאשר", text: "אחרי האישור משלמים מקדמה בתשלום מאובטח." },
  { title: "מדרגים", text: "אחרי האירוע מדרגים את המפעיל ואת ההפעלה." },
];

const values = [
  { icon: CalendarCheck, title: "זמינות אמיתית", text: "רואים רק מפעילים שפנויים בתאריך שלכם. המפעיל מאשר כל בקשה." },
  { icon: Star, title: "דירוגים מאומתים", text: "רק מי שהזמין דרכנו יכול לדרג. ציון נפרד למפעיל ולהפעלה עצמה." },
  { icon: ListChecks, title: "השוואה שקופה", text: "מחיר, גילאים, אזורי שירות ומה כלול בחבילה, זה לצד זה." },
  { icon: ShieldCheck, title: "מפעילים שנבדקו", text: "אנחנו בודקים פרטי עסק, ביטוח ורישיונות לפני שפרופיל עולה לאתר." },
];

export default function HomePage() {
  const featured = publicOperators()
    .filter((o) => o.regions.includes("מרכז"))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14">
          <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent-ink">מפעילים בדוקים · זמינות אמיתית · אישור מהמפעיל</p>
          <h1 className="mt-4 text-[34px] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[56px]">כל ההפעלות לילדים, במקום אחד</h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted sm:text-lg">
            מוצאים מפעיל ליום הולדת, לבית הספר, לקייטנה או ליום משפחות. משווים מחירים, בודקים זמינות ושולחים בקשה בכמה דקות.
          </p>
          <div className="mt-8">
            <HeroSearch />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="me-1 text-sm text-muted">מזמינים בשביל:</span>
            {audiences.map((a) => (
              <Link key={a.label} href={a.href} className="flex min-h-10 items-center rounded-full border border-line-strong bg-card px-4 text-sm font-medium hover:border-accent hover:text-accent-ink">
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="cat-title" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="cat-title" className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
              קטגוריות
            </h2>
            <p className="mt-1 text-[15px] text-muted">בוחרים סוג הפעלה ומצמצמים לפי גיל ואזור</p>
          </div>
          <Link href="/search" className="flex min-h-11 items-center gap-1 text-[15px] font-semibold text-accent-ink hover:underline">
            לכל ההפעלות
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/search?cat=${c.id}`}
                className="flex h-full min-h-20 items-start gap-3 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-accent-line hover:bg-accent-soft/40"
              >
                <span className="tint grid size-11 shrink-0 place-items-center rounded-xl" style={{ "--tint": c.tint, "--hue": c.hue, color: c.hue } as React.CSSProperties}>
                  <CategoryIcon id={c.id} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{c.name}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{c.desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-14 sm:px-6 sm:pt-20">
        <h2 id="how-title" className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
          איך זה עובד
        </h2>
        <p className="mt-1 text-[15px] text-muted">לא משלמים כלום עד שהמפעיל מאשר את התאריך</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-card p-5">
              <span className="grid size-7 place-items-center rounded-full bg-contrast text-sm font-bold text-on-contrast tabular">{i + 1}</span>
              <h3 className="mt-3 text-[17px] font-bold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Featured */}
      <section aria-labelledby="feat-title" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="feat-title" className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
              מפעילים מובילים במרכז
            </h2>
            <p className="mt-1 text-[15px] text-muted">לפי דירוגים של לקוחות שהזמינו דרכנו</p>
          </div>
          <Link href="/search?region=מרכז" className="flex min-h-11 items-center gap-1 text-[15px] font-semibold text-accent-ink hover:underline">
            לכל המפעילים
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((op) => (
            <OperatorCard key={op.slug} op={op} />
          ))}
        </div>
      </section>

      {/* Values */}
      <section aria-label="למה הפעילו" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <li key={v.title} className="rounded-2xl border border-line bg-card p-5">
              <v.icon aria-hidden className="size-6 text-accent-ink" strokeWidth={1.8} />
              <h3 className="mt-3 text-[17px] font-bold">{v.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Two-sided CTA */}
      <section aria-label="למוסדות ולמפעילים" className="mx-auto grid max-w-6xl gap-4 px-4 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2">
        <div className="rounded-3xl bg-accent-soft p-7 sm:p-9">
          <span className="rounded-full bg-card px-3 py-1 text-[13px] font-semibold text-accent-ink">בקרוב</span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-[28px]">לבתי ספר, קייטנות, מתנ״סים ורשויות</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">שולחים בקשה אחת ומקבלים הצעות מחיר מכמה מפעילים, עם חשבונית מסודרת ותנאים ברורים.</p>
          <ul className="mt-4 flex flex-col gap-2 text-[15px]">
            {["הצעות מחיר מכמה מפעילים במקביל", "כמה הפעלות לאותו אירוע", "חשבונית מס ותשלום לפי תנאי המוסד"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check aria-hidden className="size-4 shrink-0 text-accent-ink" strokeWidth={2.5} />
                {t}
              </li>
            ))}
          </ul>
          <ButtonLink href="/institutions" className="mt-6">
            השארת פרטים
          </ButtonLink>
        </div>
        <div className="rounded-3xl bg-[#16161a] p-7 text-white sm:p-9 dark:border dark:border-line">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">מפעילים? מגיעים ללקוחות חדשים</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">הצטרפות חינם. יומן זמינות, ניהול הזמנות ותשלומים במקום אחד. משלמים עמלה רק על הזמנה שהושלמה.</p>
          <ul className="mt-4 flex flex-col gap-2 text-[15px] text-white/90">
            {["פרופיל עסקי עם חבילות ומחירון", "בקשות נכנסות עם אישור או דחייה בלחיצה", "הכנסות ודירוגים במסך אחד"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check aria-hidden className="size-4 shrink-0 text-[#a5a5f5]" strokeWidth={2.5} />
                {t}
              </li>
            ))}
          </ul>
          <Link href="/operator/join" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-[15px] font-semibold text-[#16161a] hover:bg-white/90">
            הצטרפות כמפעיל
          </Link>
        </div>
      </section>
    </>
  );
}
