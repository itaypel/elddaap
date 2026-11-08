"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BadgeCheck, Check, ChevronLeft, Clock, Heart, Play, Share2, ShieldCheck, Star } from "lucide-react";
import {
  type Operator,
  cancellationPolicies,
  categoryById,
  durationText,
  locationTypes,
  money,
  shortDate,
  takenSlots,
} from "@/lib/data";
import { useOperator, useStore } from "@/lib/store";
import { OperatorMedia } from "@/components/brand";
import { Sheet } from "@/components/sheet";
import { Badge, Button, Card, Checkbox, DefinitionRow, Field, Input, Rating, ScoreBar, Select, Textarea, cx } from "@/components/ui";

const sections = [
  { id: "packages", label: "חבילות ומחירים" },
  { id: "about", label: "על ההפעלה" },
  { id: "prepare", label: "מה צריך להכין" },
  { id: "reviews", label: "ביקורות" },
  { id: "policy", label: "מדיניות ביטול" },
];

export function OperatorView({ slug }: { slug: string }) {
  const op = useOperator(slug)!;
  const params = useSearchParams();
  const router = useRouter();
  const bookings = useStore((s) => s.bookings);
  const saved = useStore((s) => s.saved.includes(slug));
  const toggleSaved = useStore((s) => s.toggleSaved);
  const toast = useStore((s) => s.toast);

  const activePackages = op.packages.filter((p) => p.active);
  const [pkgId, setPkgId] = useState((activePackages.find((p) => p.popular) ?? activePackages[0]).id);
  const [date, setDate] = useState(params.get("date") || "2026-12-11");
  const [time, setTime] = useState("");
  const [kids, setKids] = useState(22);
  const [extras, setExtras] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(false);

  const pkg = activePackages.find((p) => p.id === pkgId) ?? activePackages[0];
  const taken = useMemo(() => takenSlots(op, date, bookings), [op, date, bookings]);
  const extraKids = pkg.maxKids && kids > pkg.maxKids ? kids - pkg.maxKids : 0;
  const extraKidsCost = extraKids * (pkg.extraKidPrice ?? 0);
  const extrasCost = extras.reduce((s, id) => s + (op.extras.find((e) => e.id === id)?.price ?? 0), 0);
  const total = pkg.price + extraKidsCost + extrasCost;
  const cat = categoryById[op.category];
  const minPrice = Math.min(...activePackages.map((p) => p.price));

  const proceed = () => {
    if (!time) {
      toast("בחרו שעה כדי להמשיך", "danger");
      return;
    }
    const q = new URLSearchParams({ pkg: pkg.id, date, time, kids: String(kids), extras: extras.join(",") });
    router.push(`/book/${op.slug}?${q.toString()}`);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: op.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("הקישור הועתק");
      }
    } catch {
      /* dismissed */
    }
  };

  const widget = (id: string) => (
    <div className="flex flex-col gap-4">
      <p className="flex items-baseline gap-1.5">
        <span className="text-sm text-muted">החל מ־</span>
        <span className="text-[28px] font-extrabold tabular">{money(minPrice)}</span>
      </p>
      <Field label="תאריך" htmlFor={`${id}-date`}>
        <Input id={`${id}-date`} type="date" min="2026-11-08" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">שעות פנויות ב־{shortDate(date)}</legend>
        <div className="grid grid-cols-3 gap-2">
          {op.slots.map((s) => {
            const disabled = taken.has(s);
            const selected = time === s;
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => setTime(s)}
                className={cx(
                  "min-h-11 rounded-xl border text-[15px] font-semibold tabular transition-colors",
                  selected ? "border-accent bg-accent-soft text-accent-ink" : "border-line-strong hover:bg-sunken",
                  disabled && "border-line bg-sunken text-subtle line-through decoration-1",
                )}
              >
                {s}
                {disabled && <span className="sr-only"> (תפוס)</span>}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field label="חבילה" htmlFor={`${id}-pkg`}>
        <Select id={`${id}-pkg`} value={pkg.id} onChange={(e) => setPkgId(e.target.value)}>
          {activePackages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {money(p.price)}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="מספר ילדים"
        htmlFor={`${id}-kids`}
        hint={extraKids > 0 ? (pkg.extraKidPrice ? `${extraKids} ילדים מעל החבילה · ${money(pkg.extraKidPrice)} לילד` : "מעל המקסימום של החבילה. כדאי לבחור חבילה גדולה יותר.") : undefined}
      >
        <Input id={`${id}-kids`} type="number" inputMode="numeric" min={1} max={200} value={kids} onChange={(e) => setKids(Math.max(1, Number(e.target.value) || 1))} />
      </Field>
      <dl className="border-t border-line pt-3">
        <DefinitionRow term={`${pkg.name}${pkg.maxKids ? `, עד ${pkg.maxKids} ילדים` : ""}`}>{money(pkg.price)}</DefinitionRow>
        {extraKidsCost > 0 && <DefinitionRow term={`${extraKids} ילדים נוספים`}>{money(extraKidsCost)}</DefinitionRow>}
        {extras.map((id) => {
          const e = op.extras.find((x) => x.id === id)!;
          return (
            <DefinitionRow key={id} term={e.name}>
              {money(e.price)}
            </DefinitionRow>
          );
        })}
        <DefinitionRow term="נסיעה (בתוך אזור השירות)">{money(0)}</DefinitionRow>
        <DefinitionRow term="סה״כ" strong>
          {money(total)}
        </DefinitionRow>
      </dl>
      <Button size="lg" onClick={proceed}>
        המשך להזמנה
      </Button>
      <p className="text-center text-[13px] leading-relaxed text-muted">לא תחויבו עכשיו. המפעיל מאשר תוך 24 שעות, ורק אז משלמים מקדמה.</p>
      <Button variant="link" className="self-center" onClick={() => setAskOpen(true)}>
        שאלה למפעיל
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-32 sm:px-6 lg:pb-10">
      {/* Breadcrumbs */}
      <nav aria-label="פירורי לחם" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/search" className="hover:text-ink hover:underline">
              חיפוש הפעלות
            </Link>
          </li>
          <ChevronLeft aria-hidden className="size-3.5" />
          <li>
            <Link href={`/search?cat=${op.category}`} className="hover:text-ink hover:underline">
              {cat.name}
            </Link>
          </li>
          <ChevronLeft aria-hidden className="size-3.5" />
          <li aria-current="page" className="font-semibold text-ink">
            {op.name}
          </li>
        </ol>
      </nav>

      {/* Title block */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            {op.verified && (
              <Badge tone="success">
                <BadgeCheck aria-hidden className="size-4" />
                מפעיל מאומת
              </Badge>
            )}
            {op.insured && (
              <Badge>
                <ShieldCheck aria-hidden className="size-4" />
                ביטוח צד ג׳ בתוקף
              </Badge>
            )}
            <Badge>
              <Clock aria-hidden className="size-4" />
              עונה בדרך כלל תוך {op.responseHours} שעות
            </Badge>
          </div>
          <h1 className="mt-3 text-[30px] leading-tight font-extrabold tracking-tight sm:text-[40px]">
            {op.name} <span className="text-muted">· {cat.name}</span>
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted">
            <Rating value={op.rating} count={op.reviewsCount} />
            <span>גילאי {op.ageMin}–{op.ageMax}</span>
            <span>{op.regionLabel}</span>
            <span>{op.locations.map((l) => locationTypes.find((x) => x.id === l)!.short).join(", ")}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => toggleSaved(op.slug)} aria-pressed={saved}>
            <Heart aria-hidden className={cx("size-4", saved && "fill-danger text-danger")} />
            {saved ? "נשמר" : "שמירה"}
          </Button>
          <Button variant="secondary" size="sm" onClick={share}>
            <Share2 aria-hidden className="size-4" />
            שיתוף
          </Button>
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-5 grid h-56 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-80 lg:h-[380px]">
        <button type="button" onClick={() => setGalleryOpen(true)} className="col-span-4 row-span-2 sm:col-span-2" aria-label="פתיחת הגלריה">
          <OperatorMedia category={op.category} className="size-full" iconClassName="size-14" label={`תמונה ראשית של ${op.name}`} />
        </button>
        <button type="button" onClick={() => setGalleryOpen(true)} className="hidden sm:block" aria-label="תמונה 2">
          <OperatorMedia category={op.category} className="size-full opacity-90" iconClassName="size-8" />
        </button>
        <button type="button" onClick={() => setGalleryOpen(true)} className="hidden sm:block" aria-label="תמונה 3">
          <OperatorMedia category={op.category} className="size-full opacity-80" iconClassName="size-8" />
        </button>
        <button type="button" onClick={() => setGalleryOpen(true)} className="hidden items-center justify-center gap-2 bg-[#16161a] text-sm font-semibold text-white sm:flex">
          <Play aria-hidden className="size-4 fill-white" />
          סרטון 0:45
        </button>
        <button type="button" onClick={() => setGalleryOpen(true)} className="hidden sm:block">
          <OperatorMedia category={op.category} className="size-full opacity-70" iconClassName="hidden">
            <span className="absolute inset-0 grid place-items-center text-sm font-bold text-ink">כל 24 התמונות</span>
          </OperatorMedia>
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {/* Section nav */}
          <nav aria-label="תוכן הדף" className="glass no-scrollbar sticky top-16 z-20 -mx-4 overflow-x-auto border-b border-line bg-bg/90 px-4 backdrop-blur-xl sm:mx-0 sm:px-0">
            <ul className="flex gap-1">
              {sections.map((s) => (
                <li key={s.id} className="shrink-0">
                  <a href={`#${s.id}`} className="flex min-h-11 items-center px-3 text-[15px] font-semibold text-muted hover:text-ink">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section id="packages" aria-labelledby="packages-title" className="scroll-mt-32 pt-6">
            <h2 id="packages-title" className="text-xl font-extrabold">
              חבילות ומחירים
            </h2>
            <div role="radiogroup" aria-label="בחירת חבילה" className="mt-4 grid gap-3 md:grid-cols-3">
              {activePackages.map((p) => {
                const sel = p.id === pkg.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => setPkgId(p.id)}
                    className={cx(
                      "flex flex-col gap-2 rounded-2xl border bg-card p-4 text-start transition-colors",
                      sel ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[17px] font-bold">{p.name}</span>
                      {p.popular && <Badge tone="accent">הכי מוזמנת</Badge>}
                    </span>
                    <span className="text-[13px] text-muted">
                      {durationText(p.durationMin)} · {p.maxKids ? `עד ${p.maxKids} ילדים` : "ללא הגבלה"} · גילאי {p.ageMin}–{p.ageMax}
                    </span>
                    <span className="text-sm leading-relaxed">{p.includes}</span>
                    <span className="mt-auto pt-2 text-xl font-extrabold tabular">{money(p.price)}</span>
                  </button>
                );
              })}
            </div>
            {op.extras.length > 0 && (
              <Card className="mt-3 p-4">
                <h3 className="font-bold">תוספות</h3>
                <ul className="mt-1">
                  {op.extras.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3">
                      <Checkbox label={e.name} checked={extras.includes(e.id)} onChange={() => setExtras((x) => (x.includes(e.id) ? x.filter((i) => i !== e.id) : [...x, e.id]))} />
                      <span className="text-[15px] font-semibold tabular">+{money(e.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[13px] text-muted">מחוץ לאזורי השירות ייתכנו דמי נסיעה לפי מרחק. המחיר המלא מוצג לפני השליחה.</p>
              </Card>
            )}
          </section>

          <section id="about" aria-labelledby="about-title" className="scroll-mt-32 pt-8">
            <Card className="p-5">
              <h2 id="about-title" className="text-xl font-extrabold">
                על ההפעלה
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed">{op.about}</p>
              {op.facts.length > 0 && (
                <dl className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {op.facts.map((f) => (
                    <div key={f.label} className="rounded-xl bg-sunken p-3">
                      <dt className="text-[13px] text-muted">{f.label}</dt>
                      <dd className="mt-0.5 text-[15px] font-bold">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Card>
          </section>

          {op.prepare.length > 0 && (
            <section id="prepare" aria-labelledby="prepare-title" className="scroll-mt-32 pt-4">
              <Card className="p-5">
                <h2 id="prepare-title" className="text-xl font-extrabold">
                  מה צריך להכין
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {op.prepare.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[15px]">
                      <Check aria-hidden className="size-4 shrink-0 text-success" strokeWidth={2.5} />
                      {p}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-32 pt-4">
            <Card className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="reviews-title" className="text-xl font-extrabold">
                  ביקורות
                </h2>
                <p className="text-[13px] text-muted">רק לקוחות שהזמינו דרכנו יכולים לדרג</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-xl bg-sunken p-4">
                  <h3 className="font-bold">המפעיל</h3>
                  <ScoreBar label="דייקנות" value={op.sub.punctuality} />
                  <ScoreBar label="יחס ותקשורת" value={op.sub.communication} />
                  <ScoreBar label="עמידה במה שהובטח" value={op.sub.asPromised} />
                </div>
                <div className="flex flex-col gap-3 rounded-xl bg-sunken p-4">
                  <h3 className="font-bold">ההפעלה</h3>
                  <ScoreBar label="הנאת הילדים" value={op.sub.kidsFun} />
                  <ScoreBar label="התאמה לגיל" value={op.sub.ageFit} />
                  <ScoreBar label="תמורה למחיר" value={op.sub.value} />
                </div>
              </div>
              {op.reviews.length === 0 ? (
                <p className="mt-5 text-[15px] text-muted">עדיין אין ביקורות. הזמינו ותהיו הראשונים לדרג.</p>
              ) : (
                <ul className="mt-2 divide-y divide-line">
                  {(allReviews ? op.reviews : op.reviews.slice(0, 3)).map((r) => (
                    <li key={r.id} className="py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink">
                            {r.author[0]}
                          </span>
                          <span className="font-bold">{r.author}</span>
                          <span className="text-[13px] text-muted">
                            {r.context} · {r.when}
                          </span>
                          {r.verified && <Badge tone="success">הזמנה מאומתת</Badge>}
                        </div>
                        <span className="flex items-center gap-1 text-sm font-bold tabular">
                          <Star aria-hidden className="size-4 fill-star text-star" />
                          {r.score} / 5
                        </span>
                      </div>
                      <p className="mt-2 text-[15px] leading-relaxed">{r.text}</p>
                      {r.reply && (
                        <p className="mt-2 rounded-xl bg-sunken px-3 py-2 text-sm">
                          <span className="font-bold">תגובת המפעיל: </span>
                          {r.reply}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {op.reviews.length > 3 && !allReviews && (
                <Button variant="link" onClick={() => setAllReviews(true)}>
                  לכל {op.reviewsCount} הביקורות
                </Button>
              )}
            </Card>
          </section>

          <section id="policy" aria-labelledby="policy-title" className="scroll-mt-32 pt-4">
            <Card className="p-5">
              <h2 id="policy-title" className="text-xl font-extrabold">
                מדיניות ביטול: {cancellationPolicies[op.cancellation].name}
              </h2>
              <ul className="mt-3 list-disc ps-5 text-[15px] leading-relaxed marker:text-subtle">
                {cancellationPolicies[op.cancellation].rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Card>
          </section>
        </div>

        {/* Booking widget — regular width */}
        <aside aria-label="הזמנה" className="hidden lg:block">
          <Card className="sticky top-20 p-5 shadow-card">{widget("side")}</Card>
        </aside>
      </div>

      {/* Compact: price + CTA pinned above the tab bar */}
      <div className="glass fixed inset-x-0 bottom-14 z-30 border-t border-line bg-card/95 px-4 py-3 backdrop-blur-xl md:bottom-0 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p>
            <span className="text-[13px] text-muted">החל מ־</span>
            <span className="text-xl font-extrabold tabular"> {money(minPrice)}</span>
          </p>
          <Button onClick={() => setBookOpen(true)}>בחירת מועד</Button>
        </div>
      </div>

      <Sheet open={bookOpen} onClose={() => setBookOpen(false)} title={`הזמנת ${op.name}`}>
        {widget("sheet")}
      </Sheet>

      <Sheet open={galleryOpen} onClose={() => setGalleryOpen(false)} title="תמונות וסרטונים" wide>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <OperatorMedia key={i} category={op.category} className="aspect-square rounded-xl" iconClassName="size-8" label={`תמונה ${i + 1}`} />
          ))}
        </div>
        <p className="mt-3 text-[13px] text-muted">תמונות שבהן מזוהים ילדים עוברות בדיקה ומתפרסמות רק עם הסכמה של ההורים.</p>
      </Sheet>

      <AskSheet op={op} open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}

function AskSheet({ op, open, onClose }: { op: Operator; open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const toast = useStore((s) => s.toast);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`שאלה ל${op.name}`}
      footer={
        <Button
          className="w-full"
          disabled={!text.trim()}
          onClick={() => {
            onClose();
            setText("");
            toast(`השאלה נשלחה. ${op.name} עונים בדרך כלל תוך ${op.responseHours} שעות.`);
          }}
        >
          שליחת השאלה
        </Button>
      }
    >
      <Field label="מה תרצו לדעת?" htmlFor="ask">
        <Textarea id="ask" value={text} onChange={(e) => setText(e.target.value)} placeholder="למשל: אפשר להגיע לחצר בלי ברז מים?" rows={5} />
      </Field>
      <p className="mt-3 text-[13px] text-muted">התשובה תגיע אליכם בוואטסאפ ובאזור ההזמנות שלי.</p>
    </Sheet>
  );
}

