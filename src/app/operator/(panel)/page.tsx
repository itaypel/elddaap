"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowLeft, Navigation } from "lucide-react";
import { CURRENT_OPERATOR, bookingTotal, money, packageOf, shortDate, weekday } from "@/lib/data";
import { useOperator, useStore } from "@/lib/store";
import { downloadCsv, greeting, monthlyIncome } from "@/lib/ops";
import { IncomeTable } from "@/components/income-table";
import { BookingsTable, RequestLink } from "@/components/bookings-table";
import { ReplySheet } from "@/components/reply-sheet";
import { Badge, Button, ButtonLink, Card, CardHeader, Stat } from "@/components/ui";

const noopSubscribe = () => () => {};

export default function OperatorDashboard() {
  const op = useOperator(CURRENT_OPERATOR)!;
  const all = useStore((s) => s.bookings).filter((b) => b.operatorSlug === CURRENT_OPERATOR);
  const complete = useStore((s) => s.complete);
  const toast = useStore((s) => s.toast);
  const hello = useSyncExternalStore(noopSubscribe, greeting, () => "שלום");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replied, setReplied] = useState<string[]>(["r1"]);

  const pending = all.filter((b) => b.status === "pending");
  const dec = all.filter((b) => b.date.startsWith("2026-12"));
  const decConfirmed = dec.filter((b) => b.status === "confirmed" || b.status === "awaiting_payment");
  const decAwaiting = dec.filter((b) => b.status === "awaiting_payment").length;
  // 9 December events were booked before the demo seed; they count toward the month.
  const decNet = Math.round(decConfirmed.reduce((s, b) => s + bookingTotal(b), 0) * 0.9 + 9 * 1650 * 0.9);
  const upcoming = all.filter((b) => b.status === "confirmed").sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 3);
  const nearestDeadline = pending.length ? "הקרובה פגה בעוד 6 שעות" : "אין בקשות פתוחות";
  const sorted = [...all].sort((a, b) => b.id - a.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">
            {hello}, {op.name}
          </h1>
          <p className="mt-1 text-[15px] text-muted sm:text-base">{pending.length ? `${pending.length} בקשות מחכות לתשובה שלכם` : "אין בקשות שמחכות לכם. יום טוב!"}</p>
        </div>
        {pending.length > 0 && (
          <ButtonLink href="/operator/requests">
            לבקשות
            <ArrowLeft aria-hidden className="size-4" />
          </ButtonLink>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/operator/requests" className="rounded-2xl focus-visible:outline-offset-4">
          <Stat highlight label="בקשות חדשות" value={pending.length} sub={nearestDeadline} />
        </Link>
        <Stat label="הזמנות מאושרות בדצמבר" value={decConfirmed.length + 9} sub={decAwaiting ? `עוד ${decAwaiting} ממתינות לתשלום` : "כולן שולמו"} />
        <Stat label="הכנסה נטו בדצמבר" value={money(decNet)} sub="אחרי עמלה של 10%" />
        <Stat label="דירוג ממוצע" value={op.rating.toFixed(1)} sub={`${op.reviewsCount} ביקורות מאומתות`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <CardHeader
            title="האירועים הקרובים"
            action={
              <Link href="/operator/calendar" className="flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:underline">
                ליומן
              </Link>
            }
          />
          <ul className="mt-2 divide-y divide-line">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-4 py-3">
                <div className="grid w-14 shrink-0 place-items-center rounded-xl bg-sunken py-2 text-center">
                  <span className="text-[12px] text-muted">{weekday(b.date)}</span>
                  <span className="text-lg leading-tight font-extrabold tabular">{shortDate(b.date)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {b.time} · {b.eventType} · {b.customerName}
                  </p>
                  <p className="text-sm text-muted">
                    {b.city} · {packageOf(b)?.name} · {b.kids} ילדים
                  </p>
                </div>
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(b.address || b.city)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-10 items-center gap-1.5 rounded-xl border border-line-strong px-3 text-sm font-semibold hover:bg-sunken"
                >
                  <Navigation aria-hidden className="size-4" />
                  פרטים וניווט
                </a>
              </li>
            ))}
            {upcoming.length === 0 && <li className="py-6 text-center text-muted">אין אירועים מאושרים בקרוב</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <CardHeader title="דירוגים" action={<Link href="/operator/reviews" className="flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:underline">הכול</Link>} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-sunken p-3">
              <p className="text-[13px] text-muted">המפעיל</p>
              <p className="text-2xl font-extrabold tabular">{((op.sub.punctuality + op.sub.communication + op.sub.asPromised) / 3).toFixed(1)}</p>
            </div>
            <div className="rounded-xl bg-sunken p-3">
              <p className="text-[13px] text-muted">ההפעלה</p>
              <p className="text-2xl font-extrabold tabular">{((op.sub.kidsFun + op.sub.ageFit + op.sub.value) / 3).toFixed(1)}</p>
            </div>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {op.reviews.slice(0, 2).map((r) => (
              <li key={r.id} className="py-3">
                <p className="text-sm font-bold">
                  {r.author} · <span className="tabular">{r.score} / 5</span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{r.text}</p>
                {r.reply || replied.includes(r.id) ? (
                  <p className="mt-1.5 text-[13px] font-semibold text-success">הגבתם</p>
                ) : (
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => setReplyTo(r.id)}>
                    תגובה לביקורת
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <CardHeader
          title="הכנסות והעברות"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success">ההעברה הבאה: {money(8910)} ב־10.12</Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  downloadCsv("hafilu-income.csv", [
                    ["חודש", "הזמנות שהושלמו", "ברוטו", "עמלה", "נטו"],
                    ...monthlyIncome.map((m) => [m.month, m.completed, m.gross, m.gross * 0.1, m.gross * 0.9]),
                  ])
                }
              >
                הורדת דוח
              </Button>
            </div>
          }
        />
        <IncomeTable />
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader title="כל ההזמנות" />
        <div className="mt-3">
          <BookingsTable
            caption="כל ההזמנות של המפעיל"
            bookings={sorted}
            cols={["id", "customer", "when", "package", "amount", "status", "action"]}
            rowAction={(b) =>
              b.status === "pending" ? (
                <RequestLink b={b} />
              ) : b.status === "confirmed" ? (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    complete(b.id);
                    toast(`#${b.id} סומנה כהושלמה. הלקוח יתבקש לדרג.`);
                  }}
                >
                  סימון כהושלמה
                </Button>
              ) : null
            }
          />
        </div>
      </Card>

      <ReplySheet
        open={!!replyTo}
        onClose={() => setReplyTo(null)}
        onSend={() => {
          if (replyTo) setReplied((r) => [...r, replyTo]);
          setReplyTo(null);
          toast("התגובה פורסמה");
        }}
      />
    </>
  );
}
