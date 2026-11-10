"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Sheet } from "@/components/sheet";
import { Badge, Button, Card, CardHeader, Field, Input, PageTitle, SampleBadge } from "@/components/ui";

// Promotion slots and coupons have no tables yet; these rows illustrate the workflow.
export function PromosView() {
  const toast = useStore((s) => s.toast);
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupons, setCoupons] = useState([
    { code: "HANUKA50", desc: "50 ₪ הנחה על הזמנה ראשונה", used: "נוצלו 38 מתוך 200 · עד 12.12" },
    { code: "SCHOOL10", desc: "10% למוסדות חינוך", used: "נוצלו 4 · ללא תאריך סיום" },
  ]);
  const [draft, setDraft] = useState({ code: "", desc: "" });

  return (
    <>
      <PageTitle title="מבצעים וקידום" />

      <Card className="mt-6 p-5">
        <CardHeader
          title={
            <>
              קידום ממומן
              <SampleBadge />
            </>
          }
          sub="כל תוצאה ממומנת מסומנת ״ממומן״ ולא משפיעה על הדירוג או על סדר הביקורות."
          action={
            <Button variant="secondary" size="sm" onClick={() => toast("המשבצת נוצרה כטיוטה", "neutral")}>
              משבצת חדשה
            </Button>
          }
        />
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
                <th scope="row" className="py-3 text-start font-bold">
                  ראש התוצאות · מתנפחים · מרכז
                </th>
                <td className="px-3">קפיצות ענק</td>
                <td className="px-3 tabular">1.12–14.12</td>
                <td className="px-3 tabular">180 ₪ לשבוע</td>
                <td className="px-3 tabular">1,940 ← 6</td>
                <td className="px-3">
                  <Badge tone="success">פעיל</Badge>
                </td>
              </tr>
              <tr>
                <th scope="row" className="py-3 text-start font-bold">
                  דף הבית · מפעילים מובילים
                </th>
                <td className="px-3 text-muted">פנוי</td>
                <td className="px-3 tabular">מ־15.12</td>
                <td className="px-3 tabular">350 ₪ לשבוע</td>
                <td className="px-3">—</td>
                <td className="px-3">
                  <Badge>פנוי</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader
          title={
            <>
              קופונים
              <SampleBadge />
            </>
          }
          action={
            <Button variant="secondary" size="sm" onClick={() => setCouponOpen(true)}>
              קופון חדש
            </Button>
          }
        />
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
