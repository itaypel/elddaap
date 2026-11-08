"use client";

import Link from "next/link";
import { useState } from "react";
import { type Booking, type Settings, money, todayIso } from "@/lib/data";
import type { AdminOperator } from "@/lib/db";
import { downloadCsv, hoursLeft, incomeByMonth, monthLabel } from "@/lib/ops";
import { AdminBookings } from "@/components/admin-bookings";
import { Button, Card, CardHeader, Select, Stat, buttonClass, cx } from "@/components/ui";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const prevMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};

/** Insurance "MM/YYYY" that ends within 30 days or already ended. */
const insuranceSoon = (until: string) => {
  const m = /^(\d{2})\/(\d{4})$/.exec(until);
  if (!m) return until === "—";
  const end = new Date(Number(m[2]), Number(m[1]), 0);
  return end.getTime() - Date.now() < 30 * 864e5;
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
  const newOps = operators.filter((o) => o.createdAt.startsWith(period)).length;

  const pendingOps = operators.filter((o) => o.status === "pending");
  const overdue = bookings.filter((b) => b.status === "pending" && hoursLeft(b, settings.replyHours) === 0);
  const insurance = active.filter((o) => insuranceSoon(o.insuranceUntil));
  const attention = [
    pendingOps.length > 0 && { dot: "bg-accent", text: `${pendingOps.length} פרופילים של מפעילים חדשים מחכים לאישור`, href: "/admin/approvals", cta: "לאישורים" },
    overdue.length > 0 && { dot: "bg-danger", text: `${overdue.length === 1 ? `בקשה #${overdue[0].id}` : `${overdue.length} בקשות`} לא נענו ${settings.replyHours} שעות`, href: "/admin/bookings", cta: "להזמנות" },
    insurance.length > 0 && { dot: "bg-[#e8a20c]", text: `${insurance.length === 1 ? `ל${insurance[0].name}` : `ל־${insurance.length} מפעילים`} פג תוקף הביטוח או שיפוג בעוד פחות מ־30 יום`, href: "/admin/catalog", cta: "לפרופילים" },
    leadsCount > 0 && { dot: "bg-[#e8a20c]", text: `${leadsCount} פניות ממוסדות מחכות להצעות מחיר`, href: "/admin/catalog#leads", cta: "לפניות" },
  ].filter(Boolean) as { dot: string; text: string; href: string; cta: string }[];

  const income = incomeByMonth(bookings, settings.commission, settings.payoutDay);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">סקירה</h1>
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
      </div>

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

      <div className="mt-4">
        <AdminBookings bookings={bookings} commission={settings.commission} limit={7} />
      </div>

      <section id="reports" aria-labelledby="reports-title" className="mt-8 scroll-mt-6">
        <h2 id="reports-title" className="text-xl font-extrabold">
          דוחות
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { t: "עמלות לפי חודש", d: "כמה נגבה, מה הועבר ומה עדיין פתוח", rows: [["חודש", "הזמנות", "ברוטו", "עמלה", "העברה"], ...income.map((m) => [m.label, m.completed, m.gross, m.commission, m.transfer === "done" ? "הועבר" : "מתוכנן"])] },
            {
              t: "ביצועי מפעילים",
              d: "דירוג, הזמנות וסטטוס לכל מפעיל",
              rows: [["מפעיל", "סטטוס", "דירוג", "ביקורות", "הזמנות"], ...operators.map((o) => [o.name, o.status, o.rating, o.reviewsCount, bookings.filter((b) => b.operatorId === o.id).length])],
            },
            {
              t: "ייצוא לרואה חשבון",
              d: "כל ההזמנות, הסכומים והתשלומים בקובץ אחד",
              rows: [["הזמנה", "תאריך", "מפעיל", "לקוח", "סכום", "שולם", "סטטוס"], ...bookings.map((b) => [b.id, b.date, b.operator.name, b.customerName, b.total, b.paid, b.status])],
            },
          ].map((r, i) => (
            <Card key={r.t} className="flex flex-col p-5">
              <h3 className="font-bold">{r.t}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{r.d}</p>
              <Button variant="secondary" size="sm" className="mt-4 self-start" onClick={() => downloadCsv(`hafilu-report-${i + 1}.csv`, r.rows as (string | number)[][])}>
                ייצוא CSV
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
