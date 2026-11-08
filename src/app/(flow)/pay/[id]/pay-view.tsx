"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CircleCheckBig, Loader2, ShieldCheck } from "lucide-react";
import { bookingTotal, cancellationPolicies, depositOf, durationText, money, operatorBySlug, packageOf, parseDate, shortDate, weekday } from "@/lib/data";
import { useHydrated, useStore } from "@/lib/store";
import { downloadIcs } from "@/lib/ics";
import { OperatorMedia } from "@/components/brand";
import { FlowHeader } from "@/components/site-chrome";
import { Badge, Button, ButtonLink, Card, ChoiceTile, DefinitionRow, Field, Input, Radio, Select, cx } from "@/components/ui";

const plusDays = (iso: string, n: number) => {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmtCard = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const fmtExp = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function PayView({ id }: { id: number }) {
  const b = useStore((s) => s.bookings.find((x) => x.id === id));
  const pay = useStore((s) => s.pay);
  const profile = useStore((s) => s.profile);
  const [amount, setAmount] = useState<"deposit" | "full">("deposit");
  const [method, setMethod] = useState<"card" | "bit" | "apple" | "google">("card");
  const [card, setCard] = useState({ number: "", exp: "", cvv: "", holderId: "", installments: "1" });
  const [invoice, setInvoice] = useState<"personal" | "company">("personal");
  const [company, setCompany] = useState({ name: "", id: "" });
  const [tried, setTried] = useState(false);
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <>
        <FlowHeader secure />
        <main id="main" className="mx-auto max-w-6xl px-4 py-20 text-center text-muted">טוען את ההזמנה…</main>
      </>
    );
  }

  if (!b) {
    return (
      <>
        <FlowHeader backHref="/bookings" backLabel="להזמנות שלי" />
        <main id="main" className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold">ההזמנה לא נמצאה</h1>
          <p className="mt-2 text-muted">ייתכן שהקישור ישן. כל ההזמנות שלכם מחכות באזור האישי.</p>
          <ButtonLink href="/bookings" className="mt-6">
            להזמנות שלי
          </ButtonLink>
        </main>
      </>
    );
  }

  const op = operatorBySlug(b.operatorSlug)!;
  const pkg = packageOf(b);
  const total = bookingTotal(b);
  const deposit = depositOf(b);
  const due = amount === "deposit" ? deposit : total;
  const holdUntil = plusDays(b.date, -5);
  const freeUntil = plusDays(b.date, -14);

  const errors: Record<string, string> = {};
  if (method === "card") {
    if (card.number.replace(/\s/g, "").length < 15) errors.number = "מספר כרטיס לא מלא";
    const [mm, yy] = card.exp.split("/").map(Number);
    if (!mm || mm > 12 || !yy || 2000 + yy < 2026 || (2000 + yy === 2026 && mm < 11)) errors.exp = "תוקף לא תקין";
    if (!/^\d{3,4}$/.test(card.cvv)) errors.cvv = "3 או 4 ספרות";
    if (!/^\d{9}$/.test(card.holderId)) errors.holderId = "9 ספרות, כולל ספרת ביקורת";
  }
  if (invoice === "company" && !company.name.trim()) errors.company = "הוסיפו שם לחשבונית";

  const submit = () => {
    setTried(true);
    if (Object.keys(errors).length) {
      document.getElementById(`pay-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    setState("processing");
    setTimeout(() => {
      pay(b.id, due);
      setState("done");
    }, 1300);
  };

  if (state === "done" || (b.status === "confirmed" && state === "idle")) {
    return (
      <>
        <FlowHeader backHref="/bookings" backLabel="להזמנות שלי" />
        <main id="main" className="mx-auto max-w-lg px-4 py-16 text-center">
          <CircleCheckBig aria-hidden className="mx-auto size-14 text-success" strokeWidth={1.6} />
          <h1 className="mt-4 text-[28px] font-extrabold tracking-tight">{state === "done" ? "התשלום התקבל" : "ההזמנה כבר שולמה"}</h1>
          <p className="mt-2 text-[17px] leading-relaxed text-muted">
            {op.name} שמורים לכם ל{weekday(b.date)} {shortDate(b.date)} ב־{b.time}. אישור וקבלה נשלחו ל־{profile.email}.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => downloadIcs(b)}>
              הוספה ליומן
            </Button>
            <ButtonLink href="/bookings">להזמנות שלי</ButtonLink>
          </div>
        </main>
      </>
    );
  }

  if (b.status !== "awaiting_payment") {
    return (
      <>
        <FlowHeader backHref="/bookings" backLabel="להזמנות שלי" />
        <main id="main" className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold">{b.status === "pending" ? "המפעיל עוד לא אישר" : "אין מה לשלם כרגע"}</h1>
          <p className="mt-2 text-muted">{b.status === "pending" ? "נשלח לכם הודעה ברגע שהמפעיל יאשר, ואז אפשר לשלם מקדמה." : "סטטוס ההזמנה מעודכן באזור האישי."}</p>
          <ButtonLink href="/bookings" className="mt-6">
            להזמנות שלי
          </ButtonLink>
        </main>
      </>
    );
  }

  const err = (k: string) => (tried && errors[k] ? <p id={`pay-${k}-err`} className="text-[13px] font-semibold text-danger">{errors[k]}</p> : null);
  const inv = (k: string) => (tried && errors[k] ? { "aria-invalid": true, "aria-describedby": `pay-${k}-err` } : {});

  return (
    <>
      <FlowHeader secure />
      <main id="main" className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <Badge tone="success" className="text-sm">
          <Check aria-hidden className="size-4" strokeWidth={2.5} />
          {op.name} אישר את ההזמנה
        </Badge>
        <h1 className="mt-3 text-[28px] font-extrabold tracking-tight sm:text-[34px]">תשלום ושמירת התאריך</h1>
        <p className="mt-1.5 text-[15px] text-muted sm:text-base">
          התאריך שמור לכם עד {shortDate(holdUntil)} בשעה 23:59. אחרי התשלום ההזמנה מאושרת סופית.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="flex flex-col gap-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold">כמה לשלם עכשיו</h2>
              <div role="radiogroup" aria-label="סכום לתשלום" className="mt-4 flex flex-col gap-2">
                {(
                  [
                    ["deposit", `מקדמה עכשיו: ${money(deposit)}`, `היתרה, ${money(total - deposit)}, תחויב באותו כרטיס יום אחרי האירוע`, true],
                    ["full", `תשלום מלא: ${money(total)}`, "אפשר לחלק עד 3 תשלומים בלי ריבית", false],
                  ] as const
                ).map(([v, title, sub, rec]) => (
                  <label
                    key={v}
                    className={cx(
                      "flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-4 has-focus-visible:ring-3 has-focus-visible:ring-accent/40",
                      amount === v ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line-strong hover:bg-sunken",
                    )}
                  >
                    <input type="radio" name="amount" className="sr-only" checked={amount === v} onChange={() => setAmount(v)} />
                    <span>
                      <span className="block font-bold tabular">{title}</span>
                      <span className="mt-0.5 block text-sm text-muted">{sub}</span>
                    </span>
                    {rec && <span className="text-sm font-bold text-accent-ink">מומלץ</span>}
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold">אמצעי תשלום</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ["card", "כרטיס אשראי"],
                    ["bit", "Bit"],
                    ["apple", "Apple Pay"],
                    ["google", "Google Pay"],
                  ] as const
                ).map(([v, l]) => (
                  <ChoiceTile key={v} name="method" value={v} checked={method === v} onSelect={() => setMethod(v)} className="justify-center">
                    {l}
                  </ChoiceTile>
                ))}
              </div>
              {method === "card" ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-4">
                  <Field label="מספר כרטיס" htmlFor="pay-number" className="sm:col-span-4">
                    <Input
                      id="pay-number"
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      className="text-end tabular"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                      {...inv("number")}
                    />
                    {err("number")}
                  </Field>
                  <Field label="תוקף" htmlFor="pay-exp">
                    <Input id="pay-exp" dir="ltr" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className="text-end tabular" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} {...inv("exp")} />
                    {err("exp")}
                  </Field>
                  <Field label="3 ספרות בגב הכרטיס" htmlFor="pay-cvv">
                    <Input id="pay-cvv" dir="ltr" inputMode="numeric" autoComplete="cc-csc" placeholder="000" className="text-end tabular" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} {...inv("cvv")} />
                    {err("cvv")}
                  </Field>
                  <Field label="ת.ז. בעל הכרטיס" htmlFor="pay-holderId">
                    <Input id="pay-holderId" dir="ltr" inputMode="numeric" className="text-end tabular" value={card.holderId} onChange={(e) => setCard({ ...card, holderId: e.target.value.replace(/\D/g, "").slice(0, 9) })} {...inv("holderId")} />
                    {err("holderId")}
                  </Field>
                  <Field label="מספר תשלומים" htmlFor="pay-inst">
                    <Select id="pay-inst" value={card.installments} disabled={amount === "deposit"} onChange={(e) => setCard({ ...card, installments: e.target.value })}>
                      <option value="1">תשלום אחד</option>
                      <option value="2">2 תשלומים</option>
                      <option value="3">3 תשלומים</option>
                    </Select>
                  </Field>
                </div>
              ) : (
                <p className="mt-5 rounded-xl bg-sunken p-4 text-[15px]">
                  אחרי הלחיצה על תשלום תועברו לאישור ב־{method === "bit" ? "Bit" : method === "apple" ? "Apple Pay" : "Google Pay"}, ותחזרו לכאן אוטומטית.
                </p>
              )}
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-sunken p-3 text-sm text-muted">
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                התשלום עובר דרך ספק סליקה מאובטח שמחלק אותו בין המפעיל לפלטפורמה. פרטי הכרטיס לא נשמרים אצלנו.
              </p>
              <p className="mt-2 text-[13px] text-muted">גרסת הדגמה: אפשר להזין 4242 4242 4242 4242, תוקף 12/28, 123 ות.ז. של 9 ספרות. לא מתבצע חיוב.</p>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold">חשבונית</h2>
              <div className="mt-2">
                <Radio name="invoice" checked={invoice === "personal"} onChange={() => setInvoice("personal")} label={`על שם ${profile.name}, נשלחת ל־${profile.email}`} />
                <Radio name="invoice" checked={invoice === "company"} onChange={() => setInvoice("company")} label="על שם מוסד או חברה" />
              </div>
              {invoice === "company" && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="שם המוסד או החברה" htmlFor="pay-company">
                    <Input id="pay-company" autoComplete="organization" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} {...inv("company")} />
                    {err("company")}
                  </Field>
                  <Field label="ח.פ. או ע.מ." htmlFor="pay-companyId">
                    <Input id="pay-companyId" inputMode="numeric" value={company.id} onChange={(e) => setCompany({ ...company, id: e.target.value.replace(/\D/g, "") })} />
                  </Field>
                </div>
              )}
            </Card>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-3">
                <OperatorMedia category={op.category} className="size-14 shrink-0 rounded-xl" iconClassName="size-6" />
                <div>
                  <p className="font-bold">{op.name}</p>
                  <p className="text-[13px] text-muted">
                    {pkg?.name} · {pkg && durationText(pkg.durationMin)} · הזמנה #{b.id}
                  </p>
                </div>
              </div>
              <dl className="mt-4 border-t border-line pt-3">
                <DefinitionRow term="מתי">
                  {weekday(b.date)} {shortDate(b.date)} · {b.time}
                </DefinitionRow>
                <DefinitionRow term="איפה">{b.city}</DefinitionRow>
                <DefinitionRow term="ילדים">
                  {b.kids} · גילאי {b.ageRange}
                </DefinitionRow>
              </dl>
              <dl className="mt-3 border-t border-line pt-3">
                <DefinitionRow term="מחיר ההזמנה (כולל מע״מ)">{money(total)}</DefinitionRow>
                <DefinitionRow term="דמי שירות">{money(0)}</DefinitionRow>
                <DefinitionRow term="לתשלום עכשיו" strong>
                  {money(due)}
                </DefinitionRow>
              </dl>
              <Button size="lg" className="mt-4 w-full" onClick={submit} disabled={state === "processing"}>
                {state === "processing" ? (
                  <>
                    <Loader2 aria-hidden className="size-5 animate-spin" />
                    מעבד תשלום…
                  </>
                ) : (
                  <>תשלום {money(due)}</>
                )}
              </Button>
              <p className="mt-2 text-center text-[13px] leading-relaxed text-muted">
                {op.cancellation === "regular"
                  ? `ביטול חינם עד ${shortDate(freeUntil)}. אחרי זה מוחזרת 50% מהמקדמה עד ${shortDate(plusDays(b.date, -7))}.`
                  : cancellationPolicies[op.cancellation].short}
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">אחרי התשלום</h2>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 ps-5 text-sm text-muted marker:text-subtle">
                <li>אישור הזמנה וקבלה במייל ובוואטסאפ</li>
                <li>פרטי הקשר של המפעיל נפתחים לכם</li>
                <li>תזכורת יום לפני האירוע</li>
                <li>
                  אחרי האירוע: בקשה לדרג ·{" "}
                  <Link href="/info/cancellation" className="font-semibold text-accent-ink hover:underline">
                    מדיניות ביטולים
                  </Link>
                </li>
              </ul>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
}
