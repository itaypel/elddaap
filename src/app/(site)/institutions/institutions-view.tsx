"use client";

import { useState, useTransition } from "react";
import { CircleCheckBig, FileText, Layers, Receipt } from "lucide-react";
import { categories, todayIso } from "@/lib/data";
import { submitLead } from "@/app/actions";
import { useStore } from "@/lib/store";
import { Button, Card, Field, Input, Select, Textarea, cx } from "@/components/ui";

const orgTypes = ["בית ספר", "גן ילדים", "קייטנה", "מתנ״ס או תנועת נוער", "רשות מקומית", "ועד עובדים או חברה"];

export function InstitutionsView() {
  const toast = useStore((s) => s.toast);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const [tried, setTried] = useState(false);
  const [f, setF] = useState({ orgType: "בית ספר", org: "", contact: "", phone: "", email: "", date: "", kids: "", ages: "", cats: [] as string[], budget: "", notes: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const errors: Record<string, string> = {};
  if (!f.org.trim()) errors.org = "הוסיפו את שם המוסד";
  if (!f.contact.trim()) errors.contact = "הוסיפו איש קשר";
  if (!/^0\d{1,2}-?\d{7}$/.test(f.phone.replace(/\s/g, ""))) errors.phone = "מספר טלפון בפורמט 050-0000000";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = "כתובת אימייל לא תקינה";
  const err = (k: string) => (tried && errors[k] ? <p id={`i-${k}-err`} className="text-[13px] font-semibold text-danger">{errors[k]}</p> : null);
  const inv = (k: string) => (tried && errors[k] ? { "aria-invalid": true, "aria-describedby": `i-${k}-err` } : {});

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_520px]">
        <div>
          <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent-ink">לבתי ספר, קייטנות, מתנ״סים ורשויות</p>
          <h1 className="mt-4 text-[34px] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-[44px]">בקשה אחת. הצעות מכמה מפעילים.</h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
            ממלאים את פרטי האירוע פעם אחת, ומפעילים מתאימים ופנויים שולחים הצעות מחיר. משווים, בוחרים ומקבלים חשבונית מס מסודרת לפי תנאי המוסד.
          </p>
          <ul className="mt-8 flex flex-col gap-5">
            {[
              { icon: Layers, t: "כמה הפעלות לאותו אירוע", d: "יום כיף עם שלוש תחנות? מזמינים כמה מפעילים בבקשה אחת ומתאמים לוח זמנים." },
              { icon: FileText, t: "הצעות מחיר להשוואה", d: "כל הצעה מפרטת מה כלול, יחס מדריכים, ביטוח ומדיניות ביטול." },
              { icon: Receipt, t: "חשבונית ותנאי תשלום מוסדיים", d: "חשבונית מס על שם המוסד, תשלום בהעברה בנקאית או שוטף + 30 ליתר המוסדות." },
            ].map((x) => (
              <li key={x.t} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                  <x.icon aria-hidden className="size-5" />
                </span>
                <span>
                  <span className="block text-[17px] font-bold">{x.t}</span>
                  <span className="mt-0.5 block text-[15px] leading-relaxed text-muted">{x.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="p-5 shadow-card sm:p-6">
          {sent ? (
            <div className="py-10 text-center">
              <CircleCheckBig aria-hidden className="mx-auto size-12 text-success" strokeWidth={1.6} />
              <h2 className="mt-3 text-2xl font-extrabold">הבקשה התקבלה</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                נחזור אליכם תוך יום עסקים עם מפעילים מתאימים. אישור נשלח ל־{f.email}.
              </p>
              <Button variant="secondary" className="mt-6" onClick={() => { setSent(false); setTried(false); }}>
                בקשה נוספת
              </Button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setTried(true);
                if (Object.keys(errors).length) {
                  document.getElementById(`i-${Object.keys(errors)[0]}`)?.focus();
                  return;
                }
                start(async () => {
                  const res = await submitLead(f);
                  if (!res.ok) return toast(res.error, "danger");
                  setSent(true);
                  toast("הבקשה נשלחה");
                });
              }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-xl font-bold">השארת פרטים</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="סוג המוסד" htmlFor="i-orgType">
                  <Select id="i-orgType" value={f.orgType} onChange={set("orgType")}>
                    {orgTypes.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="שם המוסד" htmlFor="i-org">
                  <Input id="i-org" autoComplete="organization" value={f.org} onChange={set("org")} {...inv("org")} />
                  {err("org")}
                </Field>
                <Field label="איש קשר" htmlFor="i-contact">
                  <Input id="i-contact" autoComplete="name" value={f.contact} onChange={set("contact")} {...inv("contact")} />
                  {err("contact")}
                </Field>
                <Field label="טלפון" htmlFor="i-phone">
                  <Input id="i-phone" type="tel" dir="ltr" className="text-end" autoComplete="tel" value={f.phone} onChange={set("phone")} {...inv("phone")} />
                  {err("phone")}
                </Field>
                <Field label="אימייל" htmlFor="i-email" className="sm:col-span-2">
                  <Input id="i-email" type="email" dir="ltr" className="text-end" autoComplete="email" value={f.email} onChange={set("email")} {...inv("email")} />
                  {err("email")}
                </Field>
                <Field label="תאריך משוער" htmlFor="i-date">
                  <Input id="i-date" type="date" min={todayIso()} value={f.date} onChange={set("date")} />
                </Field>
                <Field label="מספר משתתפים" htmlFor="i-kids">
                  <Input id="i-kids" inputMode="numeric" value={f.kids} onChange={(e) => setF({ ...f, kids: e.target.value.replace(/\D/g, "") })} />
                </Field>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">אילו הפעלות מעניינות אתכם?</legend>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const on = f.cats.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setF({ ...f, cats: on ? f.cats.filter((x) => x !== c.id) : [...f.cats, c.id] })}
                        className={cx("min-h-10 rounded-full border px-3.5 text-sm font-medium transition-colors", on ? "border-accent bg-accent-soft font-semibold text-accent-ink" : "border-line-strong hover:bg-sunken")}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <Field label="תקציב משוער" htmlFor="i-budget">
                <Select id="i-budget" value={f.budget} onChange={set("budget")}>
                  <option value="">עוד לא יודעים</option>
                  <option>עד 3,000 ₪</option>
                  <option>3,000–8,000 ₪</option>
                  <option>8,000–20,000 ₪</option>
                  <option>מעל 20,000 ₪</option>
                </Select>
              </Field>
              <Field label="עוד משהו שכדאי לדעת" htmlFor="i-notes">
                <Textarea id="i-notes" value={f.notes} onChange={set("notes")} placeholder="שכבות גיל, מיקום, נגישות, דרישות רכש" />
              </Field>
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? "שולחים…" : "שליחת בקשה להצעות מחיר"}
              </Button>
              <p className="text-center text-[13px] text-muted">בלי התחייבות. משלמים רק אחרי שבוחרים הצעה.</p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
