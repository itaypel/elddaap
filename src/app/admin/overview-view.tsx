"use client";

import Link from "next/link";
import { useState } from "react";
import { type Booking, type Settings, money, todayIso } from "@/lib/data";
import type { AdminOperator } from "@/lib/db";
import { hoursLeft, insuranceSoon, monthLabel } from "@/lib/ops";
import { BookingsTable } from "@/components/bookings-table";
import { Card, CardHeader, PageTitle, Select, Stat, buttonClass, cx } from "@/components/ui";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const prevMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};

export function OverviewView({ bookings, operators, settings, leadsCount }: { bookings: Booking[]; operators: AdminOperator[]; settings: Settings; leadsCount: number }) {
  const thisMonth = todayIso().slice(0, 7);
  const months = [thisMonth, prevMonth(thisMonth), prevMonth(prevMonth(thisMonth))];
  const [period, setPeriod] = useState(thisMonth);

  const inMonth = (ym: string) => bookings.filter((b) => b.date.startsWith(ym));
  const stats = (ym: string) => {
    const list = inMonth(ym);
    const completed = list.filter((b) => b.status === "completed");
    const live = list.filter((b) => b.status !== "cancelled" && b.status !== "declined");
    const decided = list.filter((b) => b.status !== "pending" && b.status !== "cancelled");
    const approved = decided.filter((b) => b.status !== "declined");
    return {
      completed: completed.length,
      volume: live.reduce((s, b) => s + b.total, 0),
      commission: Math.round(completed.reduce((s, b) => s + b.total, 0) * settings.commission),
      approval: decided.length ? approved.length / decided.length : null,
      cancelled: list.filter((b) => b.status === "cancelled").length,
      total: list.length,
    };
  };
  const s = stats(period);
  const prev = stats(prevMonth(period));
  const growth = prev.completed ? Math.round(((s.completed - prev.completed) / prev.completed) * 100) : null;
  const active = operators.filter((o) => o.status === "active");
  const newOps = active.filter((o) => o.createdAt.startsWith(period)).length;

  const pendingOps = operators.filter((o) => o.status === "pending");
  const overdue = bookings.filter((b) => b.status === "pending" && hoursLeft(b, settings.replyHours) === 0);
  const insurance = active.filter((o) => insuranceSoon(o.insuranceUntil));
  const attention = [
    pendingOps.length > 0 && { dot: "bg-accent", text: pendingOps.length === 1 ? "פרופיל אחד של מפעיל חדש מחכה לאישור" : `${pendingOps.length} פרופילים של מפעילים חדשים מחכים לאישור`, href: "/admin/approvals", cta: "לאישורים" },
    overdue.length > 0 && { dot: "bg-danger", text: `${overdue.length === 1 ? `בקשה #${overdue[0].id} לא נענתה` : `${overdue.length} בקשות לא נענו`} ${settings.replyHours} שעות`, href: "/admin/bookings", cta: "להזמנות" },
    insurance.length > 0 && { dot: "bg-[#e8a20c]", text: `${insurance.length === 1 ? `ל${insurance[0].name}` : `ל־${insurance.length} מפעילים`} פג תוקף הביטוח או שיפוג בעוד פחות מ־30 יום`, href: "/admin/people", cta: "למפעילים" },
    leadsCount > 0 && { dot: "bg-[#e8a20c]", text: `${leadsCount} פניות ממוסדות מחכות להצעות מחיר`, href: "/admin/people?view=leads", cta: "לפניות" },
  ].filter(Boolean) as { dot: string; text: string; href: string; cta: string }[];

  const recent = [...bookings].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <>
      <PageTitle
        title="סקירה"
        action={
          <label className="flex items-center gap-2 text-sm text-muted">
            תקופה
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="min-w-40">
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </Select>
          </label>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="הזמנות שהושלמו" value={s.completed} sub={growth === null ? "אין נתונים לחודש הקודם" : `${growth >= 0 ? "+" : ""}${growth}% מהחודש הקודם`} subTone={growth !== null && growth >= 0 ? "success" : "muted"} />
        <Stat label="היקף הזמנות" value={money(s.volume)} sub="כולל מע״מ, בלי ביטולים" />
        <Stat label="עמלות לפלטפורמה" value={money(s.commission)} sub={`${pct(settings.commission)} מהזמנות שהושלמו`} />
        <Stat label="שיעור אישור מפעילים" value={s.approval === null ? "—" : pct(s.approval)} sub="מתוך בקשות שקיבלו תשובה" />
        <Stat label="מפעילים פעילים" value={active.length} sub={newOps ? `${newOps} חדשים בחודש הזה` : "אין חדשים בחודש הזה"} subTone={newOps ? "success" : "muted"} />
        <Stat label="שיעור ביטולים" value={s.total ? pct(s.cancelled / s.total) : "—"} sub={`${s.cancelled} מתוך ${s.total} הזמנות`} />
      </div>

      <Card className="mt-4 p-5">
        <CardHeader title="דורש טיפול" />
        {attention.length === 0 ? (
          <p className="mt-3 text-[15px] text-muted">הכול מטופל. אין משהו שמחכה לכם כרגע.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {attention.map((a) => (
              <li key={a.text} className="flex items-center justify-between gap-4 py-3">
                <p className="flex items-center gap-3 text-[15px]">
                  <span aria-hidden className={cx("size-2.5 shrink-0 rounded-full", a.dot)} />
                  {a.text}
                </p>
                <Link href={a.href} className={buttonClass("secondary", "sm", "shrink-0")}>
                  {a.cta}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader
          title="הזמנות אחרונות"
          action={
            <Link href="/admin/bookings" className="flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:underline">
              לכל ההזמנות
            </Link>
          }
        />
        <div className="mt-2">
          <BookingsTable caption="הזמנות אחרונות" bookings={recent} commission={settings.commission} cols={["id", "customer", "operator", "when", "amount", "status"]} />
        </div>
      </Card>
    </>
  );
}
