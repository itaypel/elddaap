"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, PageTitle, cx } from "@/components/ui";

const days = [
  ["א׳–ה׳", "15:00", "20:00"],
  ["שישי", "09:00", "16:00"],
  ["שבת", "10:00", "18:00"],
];

export default function SettingsPage() {
  const toast = useStore((s) => s.toast);
  const [notif, setNotif] = useState({ whatsapp: true, sms: true, email: false, digest: true });
  const [plan, setPlan] = useState<"basic" | "pro">("basic");

  return (
    <>
      <PageTitle title="הגדרות" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="התראות על בקשות" sub="בקשה חדשה מחכה לתשובה 24 שעות. כדאי לקבל אותה מהר." />
          <div className="mt-2">
            <Checkbox label="וואטסאפ" checked={notif.whatsapp} onChange={() => setNotif({ ...notif, whatsapp: !notif.whatsapp })} />
            <Checkbox label="SMS" checked={notif.sms} onChange={() => setNotif({ ...notif, sms: !notif.sms })} />
            <Checkbox label="אימייל" checked={notif.email} onChange={() => setNotif({ ...notif, email: !notif.email })} />
            <Checkbox label="סיכום יומי בשעה 08:00" checked={notif.digest} onChange={() => setNotif({ ...notif, digest: !notif.digest })} />
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="שעות פעילות קבועות" />
          <div className="mt-3 flex flex-col gap-3">
            {days.map(([d, from, to]) => (
              <div key={d} className="grid grid-cols-[72px_1fr_1fr] items-end gap-2">
                <span className="pb-3 font-semibold">{d}</span>
                <Field label="מ־" htmlFor={`h-${d}-from`}>
                  <Input id={`h-${d}-from`} type="time" defaultValue={from} />
                </Field>
                <Field label="עד" htmlFor={`h-${d}-to`}>
                  <Input id={`h-${d}-to`} type="time" defaultValue={to} />
                </Field>
              </div>
            ))}
          </div>
          <Button className="mt-4" variant="secondary" onClick={() => toast("שעות הפעילות עודכנו")}>
            שמירת שעות
          </Button>
        </Card>

        <Card className="p-5">
          <CardHeader title="פרטי העסק" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="סוג העסק" htmlFor="s-type">
              <Input id="s-type" readOnly value="עוסק מורשה" className="bg-sunken" />
            </Field>
            <Field label="מספר עוסק" htmlFor="s-id">
              <Input id="s-id" readOnly value="•••••4821" className="bg-sunken" dir="ltr" />
            </Field>
            <Field label="טלפון לבקשות הזמנה" htmlFor="s-phone">
              <Input id="s-phone" type="tel" dir="ltr" className="text-end" defaultValue="052-7000000" />
            </Field>
            <Field label="ביטוח צד ג׳" htmlFor="s-ins">
              <Input id="s-ins" readOnly value="בתוקף עד 03/2027" className="bg-sunken" />
            </Field>
          </div>
          <p className="mt-3 text-[13px] text-muted">שינוי בפרטי העסק עובר אימות מחדש. פנו אלינו כדי לעדכן.</p>
        </Card>

        <Card id="plan" className="scroll-mt-20 p-5">
          <CardHeader title="מסלול" />
          <div role="radiogroup" aria-label="מסלול" className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["basic", "בסיסי", "חינם", "עמלה של 10% רק על הזמנה שהושלמה", ["פרופיל עסקי וחבילות", "בקשות הזמנה ואישור", "יומן זמינות", "תשלומים והעברות"]],
                ["pro", "מתקדם", "99 ₪ לחודש", "כל מה שבבסיסי, ועוד", ["נתונים עסקיים ודוחות", "חשיפה מוגברת בקטגוריה", "ניהול לקוחות ותזכורות", "תגובות מהירות מוכנות"]],
              ] as const
            ).map(([k, name, price, sub, list]) => {
              const on = plan === k;
              return (
                <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setPlan(k)} className={cx("rounded-xl border p-4 text-start", on ? "border-accent ring-1 ring-accent" : "border-line-strong hover:bg-sunken")}>
                  <span className="flex items-center justify-between">
                    <span className="font-bold">{name}</span>
                    {k === "basic" && <Badge tone="accent">המסלול שלכם</Badge>}
                  </span>
                  <span className="mt-1 block text-xl font-extrabold">{price}</span>
                  <span className="text-[13px] text-muted">{sub}</span>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {list.map((l) => (
                      <li key={l} className="flex items-center gap-1.5">
                        <Check aria-hidden className="size-3.5 text-success" strokeWidth={2.5} />
                        {l}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          {plan === "pro" && (
            <Button className="mt-4" onClick={() => toast("נשלחה בקשת שדרוג. נחזור אליכם לאישור.")}>
              שדרוג למסלול מתקדם
            </Button>
          )}
        </Card>
      </div>
    </>
  );
}
