"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import type { AdminData } from "@/lib/db";
import { saveSettings, setCategoryActive } from "@/app/actions";
import { useAction } from "@/components/use-action";
import { Button, Card, CardHeader, Checkbox, Input, PageTitle } from "@/components/ui";

export function SettingsView({ operators, categories, settings }: Pick<AdminData, "operators" | "categories" | "settings">) {
  const [run, pending] = useAction();
  const [catActive, setCatActive] = useState<Record<string, boolean>>(Object.fromEntries(categories.map((c) => [c.id, c.active])));
  const [rules, setRules] = useState({
    commission: String(Math.round(settings.commission * 100)),
    deposit: String(Math.round(settings.deposit * 100)),
    reply: String(settings.replyHours),
    pay: String(settings.payHours),
    payout: String(settings.payoutDay),
    pro: String(settings.proPrice),
    autoClose: settings.blockOverlaps,
  });
  const opCount = (id: string) => operators.filter((o) => o.category === id && o.status === "active").length;

  return (
    <>
      <PageTitle title="עמלות והגדרות" />

      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="p-5">
          <CardHeader title="עמלות וכללי הזמנה" />
          <ul className="mt-3 divide-y divide-line">
            {(
              [
                ["commission", "עמלה ברירת מחדל", "על כל הזמנה שהושלמה", "%"],
                ["deposit", "מקדמה", "מהמחיר, נגבית אחרי אישור המפעיל", "%"],
                ["reply", "זמן לתשובת מפעיל", "אחר כך הלקוח מקבל הצעות אחרות", "שעות"],
                ["pay", "זמן לתשלום מקדמה", "אחר כך התאריך משתחרר", "שעות"],
                ["payout", "יום ההעברה למפעילים", "פעם בחודש, על הזמנות שהושלמו", "לחודש"],
                ["pro", "מחיר מסלול מתקדם", "לחודש, כולל מע״מ", "₪"],
              ] as const
            ).map(([k, t, d, unit]) => (
              <li key={k} className="flex items-center justify-between gap-4 py-3">
                <label htmlFor={`rule-${k}`}>
                  <span className="block font-bold">{t}</span>
                  <span className="block text-[13px] text-muted">{d}</span>
                </label>
                <span className="flex items-center gap-2">
                  <Input id={`rule-${k}`} inputMode="numeric" value={rules[k]} onChange={(e) => setRules({ ...rules, [k]: e.target.value.replace(/\D/g, "") })} className="w-20 text-center tabular" />
                  <span className="w-14 text-sm text-muted">{unit}</span>
                </span>
              </li>
            ))}
          </ul>
          <Checkbox
            className="mt-1"
            label={
              <>
                <span className="font-bold">חסימת הזמנות חופפות</span>
                <span className="block text-[13px] text-muted">כשמפעיל מאשר, בקשות חופפות מקבלות הצעה למועד אחר</span>
              </>
            }
            checked={rules.autoClose}
            onChange={() => setRules({ ...rules, autoClose: !rules.autoClose })}
          />
          <Button
            className="mt-3"
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  saveSettings({
                    commission: Math.min(50, Number(rules.commission) || 0) / 100,
                    deposit: Math.min(100, Number(rules.deposit) || 0) / 100,
                    replyHours: Number(rules.reply) || 24,
                    payHours: Number(rules.pay) || 48,
                    payoutDay: Math.min(28, Math.max(1, Number(rules.payout) || 10)),
                    proPrice: Number(rules.pro) || 0,
                    blockOverlaps: rules.autoClose,
                  }),
                { success: "הכללים נשמרו" },
              )
            }
          >
            שמירת כללים
          </Button>
        </Card>

        <Card className="p-5">
          <CardHeader title="קטגוריות" sub="קטגוריה לא פעילה לא מופיעה בחיפוש. משיקים עם המובילות ופותחים עוד לפי הביקוש." />
          <ul className="mt-3 divide-y divide-line">
            {categories.map((c) => {
              const on = catActive[c.id] ?? true;
              return (
                <li key={c.id} className="flex items-center gap-3 py-1">
                  <GripVertical aria-hidden className="size-4 text-subtle" />
                  <span className="flex-1 font-bold">{c.name}</span>
                  <span className="text-sm text-muted tabular">{opCount(c.id) === 1 ? "מפעיל אחד" : `${opCount(c.id)} מפעילים`}</span>
                  <Checkbox
                    label="פעילה"
                    checked={on}
                    onChange={() => {
                      setCatActive((x) => ({ ...x, [c.id]: !on }));
                      run(() => setCategoryActive(c.id, !on), { success: on ? `${c.name} הוסתרה מהחיפוש` : `${c.name} פעילה בחיפוש`, tone: "neutral" });
                    }}
                    aria-label={`${c.name}: ${on ? "פעילה" : "לא פעילה"}`}
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
