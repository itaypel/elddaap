"use client";

import { useState } from "react";
import { CircleCheckBig, ImagePlus, ShieldCheck, X } from "lucide-react";
import { fullDate, operatorBySlug, packageOf, weekday } from "@/lib/data";
import { useHydrated, useStore } from "@/lib/store";
import { OperatorMedia } from "@/components/brand";
import { FlowHeader } from "@/components/site-chrome";
import { Sheet } from "@/components/sheet";
import { Badge, Button, ButtonLink, Card, ChoiceTile, Field, StarInput, Textarea } from "@/components/ui";

const groups = [
  {
    title: "המפעיל",
    sub: "איך היה לעבוד מולו: זמנים, יחס ותקשורת",
    items: [
      ["punctuality", "דייקנות"],
      ["communication", "יחס ותקשורת"],
      ["asPromised", "עמידה במה שהובטח"],
    ],
  },
  {
    title: "ההפעלה",
    sub: "איך הילדים חוו את ההפעלה עצמה",
    items: [
      ["kidsFun", "הנאת הילדים"],
      ["ageFit", "התאמה לגיל"],
      ["value", "תמורה למחיר"],
    ],
  },
] as const;

type Key = (typeof groups)[number]["items"][number][0];

export function RateView({ id }: { id: number }) {
  const b = useStore((s) => s.bookings.find((x) => x.id === id));
  const profile = useStore((s) => s.profile);
  const rate = useStore((s) => s.rate);
  const toast = useStore((s) => s.toast);
  const hydrated = useHydrated();
  const [scores, setScores] = useState<Record<Key, number>>({ punctuality: 0, communication: 0, asPromised: 0, kidsFun: 0, ageFit: 0, value: 0 });
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([]);
  const [recommend, setRecommend] = useState<"yes" | "no" | "">("");
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaint, setComplaint] = useState("");

  if (!hydrated) {
    return (
      <>
        <FlowHeader backHref="/bookings" backLabel="חזרה להזמנות שלי" />
        <main id="main" className="mx-auto max-w-2xl px-4 py-20 text-center text-muted">טוען…</main>
      </>
    );
  }

  if (!b || b.status !== "completed") {
    return (
      <>
        <FlowHeader backHref="/bookings" backLabel="חזרה להזמנות שלי" />
        <main id="main" className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold">אפשר לדרג רק אחרי שהאירוע התקיים</h1>
          <p className="mt-2 text-muted">נשלח לכם תזכורת לדרג יום אחרי האירוע.</p>
          <ButtonLink href="/bookings" className="mt-6">
            להזמנות שלי
          </ButtonLink>
        </main>
      </>
    );
  }

  const op = operatorBySlug(b.operatorSlug)!;
  const pkg = packageOf(b);
  const missing = Object.values(scores).filter((v) => v === 0).length;

  if (done || b.rated) {
    return (
      <>
        <FlowHeader backHref="/bookings" backLabel="חזרה להזמנות שלי" />
        <main id="main" className="mx-auto max-w-lg px-4 py-16 text-center">
          <CircleCheckBig aria-hidden className="mx-auto size-14 text-success" strokeWidth={1.6} />
          <h1 className="mt-4 text-[28px] font-extrabold tracking-tight">תודה על הדירוג</h1>
          <p className="mt-2 text-[17px] text-muted">הביקורת שלכם עוזרת להורים אחרים לבחור, ו{op.name} יקבלו עליה הודעה.</p>
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <ButtonLink href={`/operators/${op.slug}#reviews`} variant="secondary">
              לביקורת בכרטיס המפעיל
            </ButtonLink>
            <ButtonLink href="/bookings">להזמנות שלי</ButtonLink>
          </div>
        </main>
      </>
    );
  }

  const publish = () => {
    setTried(true);
    if (missing > 0) {
      document.getElementById("rating-error")?.focus();
      return;
    }
    const vals = Object.values(scores);
    const avg = Math.round(vals.reduce((a, c) => a + c, 0) / vals.length);
    const [first, last] = profile.name.split(" ");
    rate(b.id, {
      author: `${first} ${last ? last[0] + "." : ""}`.trim(),
      context: b.eventType,
      when: "נובמבר 2026",
      score: avg,
      text: text.trim() || "ההפעלה הייתה מוצלחת.",
    });
    setDone(true);
  };

  return (
    <>
      <FlowHeader backHref="/bookings" backLabel="חזרה להזמנות שלי" />
      <main id="main" className="mx-auto max-w-2xl px-4 pt-8 sm:px-6">
        <div className="flex items-center gap-4">
          <OperatorMedia category={op.category} className="size-16 shrink-0 rounded-2xl" iconClassName="size-7" />
          <div>
            <h1 className="text-[26px] leading-tight font-extrabold tracking-tight sm:text-[30px]">איך היה עם {op.name}?</h1>
            <p className="mt-1 text-sm text-muted">
              {pkg?.name} · {weekday(b.date)} {fullDate(b.date)} · הזמנה #{b.id}
            </p>
          </div>
        </div>
        <Badge tone="success" className="mt-4">
          <ShieldCheck aria-hidden className="size-4" />
          הביקורת תסומן כמאומתת, כי הזמנתם דרכנו
        </Badge>

        <div className="mt-5 flex flex-col gap-4">
          {groups.map((g) => (
            <Card key={g.title} className="p-5">
              <h2 className="text-lg font-bold">{g.title}</h2>
              <p className="text-sm text-muted">{g.sub}</p>
              <ul className="mt-2 divide-y divide-line">
                {g.items.map(([k, label]) => (
                  <li key={k} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="text-[15px] font-medium">{label}</span>
                    <StarInput label={label} value={scores[k]} onChange={(v) => setScores((s) => ({ ...s, [k]: v }))} />
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          <Card className="p-5">
            <h2 className="text-lg font-bold">ספרו להורים אחרים</h2>
            <Field label={<span className="font-normal text-muted">מה היה הכי טוב? יש משהו שכדאי לדעת מראש?</span>} htmlFor="review-text" className="mt-1">
              <Textarea id="review-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="הילדים היו מרותקים מההתחלה ועד הסוף…" />
            </Field>
            <label className="mt-4 flex cursor-pointer flex-col items-center gap-1 rounded-xl border-[1.5px] border-dashed border-line-strong px-4 py-6 text-center hover:bg-sunken has-focus-visible:ring-3 has-focus-visible:ring-accent/40">
              <ImagePlus aria-hidden className="size-6 text-accent-ink" />
              <span className="font-bold text-accent-ink">הוספת תמונות מההפעלה</span>
              <span className="max-w-sm text-[13px] text-muted">תמונות שבהן רואים ילדים עוברות בדיקה לפני פרסום, ומתפרסמות רק אם סימנתם שיש לכם הסכמה של ההורים.</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []).slice(0, 6);
                  setPhotos((p) => [...p, ...files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))].slice(0, 6));
                }}
              />
            </label>
            {photos.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {photos.map((p, i) => (
                  <li key={p.url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.name} className="aspect-square w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                      className="absolute -top-2 -end-2 grid size-7 place-items-center rounded-full bg-contrast text-on-contrast"
                      aria-label={`הסרת ${p.name}`}
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <fieldset className="mt-4">
              <legend className="mb-2 font-bold">הייתם ממליצים לחברים?</legend>
              <div className="flex gap-2">
                <ChoiceTile name="rec" value="yes" checked={recommend === "yes"} onSelect={() => setRecommend("yes")} className="min-w-16 justify-center">
                  כן
                </ChoiceTile>
                <ChoiceTile name="rec" value="no" checked={recommend === "no"} onSelect={() => setRecommend("no")} className="min-w-16 justify-center">
                  לא
                </ChoiceTile>
              </div>
            </fieldset>
          </Card>
        </div>

        {tried && missing > 0 && (
          <p id="rating-error" tabIndex={-1} role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[15px] font-semibold text-danger">
            חסר דירוג ב־{missing} {missing === 1 ? "שורה" : "שורות"}. לוחצים על הכוכבים כדי לדרג.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button size="lg" onClick={publish}>
            פרסום הדירוג
          </Button>
          <Button variant="link" className="text-danger!" onClick={() => setComplaintOpen(true)}>
            משהו לא היה בסדר? פנייה לצוות
          </Button>
        </div>
        <p className="mt-3 text-[13px] text-muted">הדירוג מתפרסם בשם הפרטי ובאות הראשונה של שם המשפחה. המפעיל יכול להגיב פעם אחת.</p>

        <Sheet
          open={complaintOpen}
          onClose={() => setComplaintOpen(false)}
          title="פנייה לצוות הפעילו"
          footer={
            <Button
              className="w-full"
              disabled={!complaint.trim()}
              onClick={() => {
                setComplaintOpen(false);
                setComplaint("");
                toast("הפנייה התקבלה. נחזור אליכם תוך יום עסקים.");
              }}
            >
              שליחת הפנייה
            </Button>
          }
        >
          <p className="mb-3 text-[15px] text-muted">הפנייה נשלחת לצוות שלנו בלבד, לא למפעיל ולא לביקורות. נבדוק ונחזור אליכם.</p>
          <Field label="מה קרה?" htmlFor="complaint">
            <Textarea id="complaint" rows={5} value={complaint} onChange={(e) => setComplaint(e.target.value)} />
          </Field>
        </Sheet>
      </main>
    </>
  );
}
