"use client";

import Link from "next/link";
import { useState } from "react";
import { GripVertical, Search } from "lucide-react";
import { categories, categoryById, operators } from "@/lib/data";
import { useStore } from "@/lib/store";
import { downloadCsv } from "@/lib/ops";
import { Sheet } from "@/components/sheet";
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, Segmented, cx } from "@/components/ui";

const customers = [
  { name: "דנה לוי", kind: "הורה", city: "רעננה", orders: 3, total: 2900, since: "08/2026" },
  { name: "בית ספר הדר", kind: "מוסד", city: "רעננה", orders: 2, total: 5250, since: "09/2026" },
  { name: "מתנ״ס רמת השרון", kind: "מוסד", city: "רמת השרון", orders: 1, total: 2400, since: "11/2026" },
  { name: "משפחת כהן", kind: "הורה", city: "הרצליה", orders: 1, total: 1650, since: "10/2026" },
  { name: "חברת הייטק", kind: "ועד עובדים", city: "הרצליה", orders: 1, total: 2400, since: "11/2026" },
];

const opCount: Record<string, number> = { water: 9, sport: 12, magic: 11, science: 8, art: 10, inflatables: 7, animals: 4, mobile: 6, characters: 3, equipment: 4 };

export default function CatalogPage() {
  const admin = useStore((s) => s.admin);
  const setAdmin = useStore((s) => s.setAdmin);
  const toast = useStore((s) => s.toast);
  const [who, setWho] = useState<"operators" | "customers">("operators");
  const [q, setQ] = useState("");
  const [rules, setRules] = useState({ commission: String(Math.round(admin.commission * 100)), deposit: "30", reply: "24", pay: "48", payout: "10", pro: "99", autoClose: true });
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupons, setCoupons] = useState([
    { code: "HANUKA50", desc: "50 ₪ הנחה על הזמנה ראשונה", used: "נוצלו 38 מתוך 200 · עד 12.12" },
    { code: "SCHOOL10", desc: "10% למוסדות חינוך", used: "נוצלו 4 · ללא תאריך סיום" },
  ]);
  const [draft, setDraft] = useState({ code: "", desc: "" });

  const ops = operators.filter((o) => !q || o.name.includes(q) || categoryById[o.category].name.includes(q));
  const custs = customers.filter((c) => !q || c.name.includes(q) || c.city.includes(q));

  return (
    <>
      <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">לקוחות, מפעילים וקטלוג</h1>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="סוג משתמשים"
            value={who}
            onChange={setWho}
            options={[
              { value: "operators", label: `מפעילים (74)` },
              { value: "customers", label: `לקוחות (1,208)` },
            ]}
          />
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <div className="relative min-w-48 flex-1 sm:max-w-64">
              <Search aria-hidden className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
              <Input type="search" aria-label="חיפוש" placeholder="שם, טלפון או אימייל" value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                who === "operators"
                  ? downloadCsv("operators.csv", [["מפעיל", "קטגוריה", "דירוג", "הזמנות", "ביטוח עד", "מסלול", "סטטוס"], ...ops.map((o) => [o.name, categoryById[o.category].name, o.rating, o.bookingsCount, o.insuranceUntil, o.plan, o.status])])
                  : downloadCsv("customers.csv", [["לקוח", "סוג", "עיר", "הזמנות", "סה״כ"], ...custs.map((c) => [c.name, c.kind, c.city, c.orders, c.total])])
              }
            >
              ייצוא
            </Button>
          </div>
        </div>
        <div className="-mx-5 mt-4 overflow-x-auto px-5">
          {who === "operators" ? (
            <table className="w-full min-w-[760px] border-collapse text-[15px]">
              <caption className="sr-only">מפעילים</caption>
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  {["מפעיל", "קטגוריה", "דירוג", "הזמנות", "ביטוח בתוקף עד", "מסלול", "סטטוס", ""].map((h, i) => (
                    <th key={i} scope="col" className="px-3 py-2.5 text-start font-medium first:ps-0">
                      {h || <span className="sr-only">פעולה</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ops.map((o) => {
                  const expiring = ["12/2026", "10/2026", "—"].includes(o.insuranceUntil);
                  return (
                    <tr key={o.slug} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 text-start font-bold">
                        {o.name}
                      </th>
                      <td className="px-3">{categoryById[o.category].name}</td>
                      <td className="px-3 tabular">{o.rating ? o.rating.toFixed(1) : "—"}</td>
                      <td className="px-3 tabular">{o.bookingsCount}</td>
                      <td className={cx("px-3 tabular", expiring && "font-bold text-danger")}>{o.insuranceUntil}</td>
                      <td className="px-3">{o.plan === "pro" ? "מתקדם" : "בסיסי"}</td>
                      <td className="px-3">
                        <Badge tone={o.status === "active" ? "success" : o.status === "pending" ? "warning" : "danger"}>{o.status === "active" ? "פעיל" : o.status === "pending" ? "ממתין לאישור" : "מושהה"}</Badge>
                      </td>
                      <td className="px-3 text-end">
                        <Link href={o.status === "pending" ? "/admin/approvals" : `/operators/${o.slug}`} className="text-sm font-semibold text-accent-ink hover:underline">
                          פתיחה
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[600px] border-collapse text-[15px]">
              <caption className="sr-only">לקוחות</caption>
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  {["לקוח", "סוג", "עיר", "הזמנות", "סה״כ", "לקוח מאז"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2.5 text-start font-medium first:ps-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {custs.map((c) => (
                  <tr key={c.name} className="border-b border-line last:border-0">
                    <th scope="row" className="py-3 text-start font-bold">
                      {c.name}
                    </th>
                    <td className="px-3">{c.kind}</td>
                    <td className="px-3">{c.city}</td>
                    <td className="px-3 tabular">{c.orders}</td>
                    <td className="px-3 tabular">{c.total.toLocaleString("he-IL")} ₪</td>
                    <td className="px-3 text-muted tabular">{c.since}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card id="categories" className="scroll-mt-6 p-5">
          <CardHeader title="קטגוריות" action={<Button variant="secondary" size="sm" onClick={() => toast("בגרסה הבאה: הוספת קטגוריה עם אייקון וצבע", "neutral")}>הוספת קטגוריה</Button>} />
          <ul className="mt-3 divide-y divide-line">
            {categories.map((c) => {
              const on = admin.categoryActive[c.id] ?? true;
              return (
                <li key={c.id} className="flex items-center gap-3 py-1">
                  <GripVertical aria-hidden className="size-4 text-subtle" />
                  <span className="flex-1 font-bold">{c.name}</span>
                  <span className="text-sm text-muted tabular">{opCount[c.id]} מפעילים</span>
                  <Checkbox
                    label="פעילה"
                    checked={on}
                    onChange={() => setAdmin((a) => ({ ...a, categoryActive: { ...a.categoryActive, [c.id]: !on } }))}
                    aria-label={`${c.name}: ${on ? "פעילה" : "לא פעילה"}`}
                  />
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[13px] text-muted">משיקים עם הקטגוריות המובילות ופותחים עוד לפי הביקוש. קטגוריה לא פעילה לא מופיעה בחיפוש.</p>
        </Card>

        <Card id="rules" className="scroll-mt-6 p-5">
          <CardHeader title="עמלות וכללי הזמנה" />
          <ul className="mt-3 divide-y divide-line">
            {(
              [
                ["commission", "עמלה ברירת מחדל", "על כל הזמנה שהושלמה", "%"],
                ["deposit", "מקדמה", "מהמחיר, נגבית אחרי אישור המפעיל", "%"],
                ["reply", "זמן לתשובת מפעיל", "אחר כך הלקוח מקבל הצעות אחרות", "שעות"],
                ["pay", "זמן לתשלום מקדמה", "אחר כך התאריך משתחרר", "שעות"],
                ["payout", "העברה למפעילים", "פעם בחודש, על הזמנות שהושלמו", "ב־ לחודש"],
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
          <Checkbox className="mt-1" label={<><span className="font-bold">חסימת הזמנות חופפות</span><span className="block text-[13px] text-muted">כשמפעיל מאשר, בקשות חופפות מקבלות הצעה למועד אחר</span></>} checked={rules.autoClose} onChange={() => setRules({ ...rules, autoClose: !rules.autoClose })} />
          <Button
            className="mt-3"
            onClick={() => {
              setAdmin((a) => ({ ...a, commission: Math.min(50, Number(rules.commission) || 0) / 100 }));
              toast("הכללים נשמרו");
            }}
          >
            שמירת כללים
          </Button>
        </Card>
      </div>

      <Card id="promos" className="mt-4 scroll-mt-6 p-5">
        <CardHeader title="קידום ממומן" action={<Button variant="secondary" size="sm" onClick={() => toast("המשבצת נוצרה כטיוטה", "neutral")}>משבצת חדשה</Button>} />
        <div className="-mx-5 mt-3 overflow-x-auto px-5">
          <table className="w-full min-w-[640px] border-collapse text-[15px]">
            <caption className="sr-only">משבצות קידום</caption>
            <thead>
              <tr className="border-b border-line text-[13px] text-muted">
                {["משבצת", "מפעיל", "תאריכים", "מחיר", "צפיות ← הזמנות", "סטטוס"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2.5 text-start font-medium first:ps-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <th scope="row" className="py-3 text-start font-bold">ראש התוצאות · מתנפחים · מרכז</th>
                <td className="px-3">קפיצות ענק</td>
                <td className="px-3 tabular">1.12–14.12</td>
                <td className="px-3 tabular">180 ₪ לשבוע</td>
                <td className="px-3 tabular">1,940 ← 6</td>
                <td className="px-3"><Badge tone="success">פעיל</Badge></td>
              </tr>
              <tr>
                <th scope="row" className="py-3 text-start font-bold">דף הבית · מפעילים מובילים</th>
                <td className="px-3 text-muted">פנוי</td>
                <td className="px-3 tabular">מ־15.12</td>
                <td className="px-3 tabular">350 ₪ לשבוע</td>
                <td className="px-3">—</td>
                <td className="px-3"><Badge>פנוי</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-muted">כל תוצאה ממומנת מסומנת ״ממומן״ ולא משפיעה על הדירוג או על סדר הביקורות.</p>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <h3 className="text-lg font-bold">קופונים ומבצעים</h3>
          <Button variant="secondary" size="sm" onClick={() => setCouponOpen(true)}>
            קופון חדש
          </Button>
        </div>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {coupons.map((c) => (
            <li key={c.code} className="rounded-xl border border-line p-4">
              <p className="font-extrabold tracking-wide" dir="ltr" style={{ textAlign: "right" }}>
                {c.code}
              </p>
              <p className="mt-1 text-[15px]">{c.desc}</p>
              <p className="text-[13px] text-muted">{c.used}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Sheet
        open={couponOpen}
        onClose={() => setCouponOpen(false)}
        title="קופון חדש"
        footer={
          <Button
            className="w-full"
            disabled={!draft.code.trim() || !draft.desc.trim()}
            onClick={() => {
              setCoupons([...coupons, { code: draft.code.toUpperCase(), desc: draft.desc, used: "נוצלו 0" }]);
              setDraft({ code: "", desc: "" });
              setCouponOpen(false);
              toast("הקופון נוצר");
            }}
          >
            יצירת קופון
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="קוד" htmlFor="c-code">
            <Input id="c-code" dir="ltr" className="text-end uppercase" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.replace(/\s/g, "") })} placeholder="SUMMER20" />
          </Field>
          <Field label="מה הקופון נותן" htmlFor="c-desc">
            <Input id="c-desc" value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} placeholder="20% הנחה על הזמנה ראשונה" />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
