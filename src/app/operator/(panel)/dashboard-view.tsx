"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowLeft, Navigation } from "lucide-react";
import { type Booking, type Operator, type Settings, money, shortDate, todayIso, weekday } from "@/lib/data";
import { downloadCsv, greeting, hoursLeft, incomeByMonth, monthLabel, nextPayout } from "@/lib/ops";
import { completeBooking, replyReview } from "@/app/actions";
import { useAction } from "@/components/use-action";
import { BookingsTable, RequestLink } from "@/components/bookings-table";
import { IncomeTable } from "@/components/income-table";
import { ReplySheet } from "@/components/reply-sheet";
import { Badge, Button, ButtonLink, Card, CardHeader, Stat } from "@/components/ui";

const noopSubscribe = () => () => {};

export function DashboardView({ op, bookings, settings }: { op: Operator; bookings: Booking[]; settings: Settings }) {
  const hello = useSyncExternalStore(noopSubscribe, greeting, () => "שלום");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [run, pending] = useAction();

  const today = todayIso();
  const month = today.slice(0, 7);
  const open = bookings.filter((b) => b.status === "pending");
  const thisMonth = bookings.filter((b) => b.date.startsWith(month));
  const monthBooked = thisMonth.filter((b) => b.status === "confirmed" || b.status === "awaiting_payment" || b.status === "completed");
  const monthAwaiting = thisMonth.filter((b) => b.status === "awaiting_payment").length;
  const monthNet = Math.round(monthBooked.reduce((s, b) => s + b.total, 0) * (1 - settings.commission));
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 3);
  const pastConfirmed = bookings.filter((b) => b.status === "confirmed" && b.date < today);
  const soonest = open.length ? Math.min(...open.map((b) => hoursLeft(b, settings.replyHours))) : null;
  const income = incomeByMonth(bookings, settings.commission, settings.payoutDay);
  const payout = nextPayout(income, settings.payoutDay);
  const opScore = (op.sub.punctuality + op.sub.communication + op.sub.asPromised) / 3;
  const actScore = (op.sub.kidsFun + op.sub.ageFit + op.sub.value) / 3;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">
            {hello}, {op.name}
          </h1>
          <p className="mt-1 text-[15px] text-muted sm:text-base">{open.length ? `${open.length} בקשות מחכות לתשובה שלכם` : "אין בקשות שמחכות לכם כרגע."}</p>
        </div>
        {open.length > 0 && (
          <ButtonLink href="/operator/requests">
            לבקשות
            <ArrowLeft aria-hidden className="size-4" />
          </ButtonLink>
        )}
      </div>

      {pastConfirmed.length > 0 && (
        <Card className="mt-5 flex flex-wrap items-center justify-between gap-3 border-accent-line bg-accent-soft p-4">
          <p className="text-[15px] text-accent-ink">
            <strong>{pastConfirmed.length === 1 ? "אירוע אחד" : `${pastConfirmed.length} אירועים`} כבר התקיימו.</strong> סמנו שהושלמו כדי שהלקוחות יוכלו לדרג ושהתשלום ייכנס להעברה.
          </p>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/operator/requests" className="rounded-2xl focus-visible:outline-offset-4">
          <Stat highlight label="בקשות חדשות" value={open.length} sub={soonest !== null ? `הקרובה פגה בעוד ${soonest} שעות` : "אין בקשות פתוחות"} />
        </Link>
        <Stat label={`הזמנות ב${monthLabel(month).split(" ")[0]}`} value={monthBooked.length} sub={monthAwaiting ? `עוד ${monthAwaiting} ממתינות לתשלום` : "כולן שולמו"} />
        <Stat label={`הכנסה נטו ב${monthLabel(month).split(" ")[0]}`} value={money(monthNet)} sub={`אחרי עמלה של ${Math.round(settings.commission * 100)}%`} />
        <Stat label="דירוג ממוצע" value={op.rating ? op.rating.toFixed(1) : "—"} sub={`${op.reviewsCount} ביקורות מאומתות`} />
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
                    {b.city} · {b.pkg.name} · {b.kids} ילדים
                  </p>
                </div>
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(b.address || b.city)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-10 items-center gap-1.5 rounded-xl border border-line-strong px-3 text-sm font-semibold hover:bg-sunken"
                >
                  <Navigation aria-hidden className="size-4" />
                  ניווט
                </a>
              </li>
            ))}
            {upcoming.length === 0 && <li className="py-6 text-center text-muted">אין אירועים מאושרים בקרוב</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <CardHeader
            title="דירוגים"
            action={
              <Link href="/operator/reviews" className="flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:underline">
                הכול
              </Link>
            }
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-sunken p-3">
              <p className="text-[13px] text-muted">המפעיל</p>
              <p className="text-2xl font-extrabold tabular">{opScore ? opScore.toFixed(1) : "—"}</p>
            </div>
            <div className="rounded-xl bg-sunken p-3">
              <p className="text-[13px] text-muted">ההפעלה</p>
              <p className="text-2xl font-extrabold tabular">{actScore ? actScore.toFixed(1) : "—"}</p>
            </div>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {op.reviews.slice(0, 2).map((r) => (
              <li key={r.id} className="py-3">
                <p className="text-sm font-bold">
                  {r.author} · <span className="tabular">{r.score} / 5</span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{r.text}</p>
                {r.reply ? (
                  <p className="mt-1.5 text-[13px] font-semibold text-success">הגבתם</p>
                ) : (
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => setReplyTo(r.id)}>
                    תגובה לביקורת
                  </Button>
                )}
              </li>
            ))}
            {op.reviews.length === 0 && <li className="py-4 text-sm text-muted">ביקורות מאומתות יופיעו כאן אחרי האירועים הראשונים.</li>}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <CardHeader
          title="הכנסות והעברות"
          action={
            <div className="flex flex-wrap items-center gap-2">
              {payout && (
                <Badge tone="success">
                  ההעברה הבאה: {money(payout.amount)} ב־{payout.date}
                </Badge>
              )}
              <Button
                variant="secondary"
                size="sm"
                disabled={!income.length}
                onClick={() => downloadCsv("hafilu-income.csv", [["חודש", "הזמנות שהושלמו", "ברוטו", "עמלה", "נטו"], ...income.map((m) => [m.label, m.completed, m.gross, m.commission, m.net])])}
              >
                הורדת דוח
              </Button>
            </div>
          }
        />
        <IncomeTable rows={income} payoutDay={settings.payoutDay} />
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader title="כל ההזמנות" />
        <div className="mt-3">
          <BookingsTable
            caption="כל ההזמנות של המפעיל"
            bookings={bookings}
            commission={settings.commission}
            cols={["id", "customer", "when", "package", "amount", "status", "action"]}
            rowAction={(b) =>
              b.status === "pending" ? (
                <RequestLink b={b} />
              ) : b.status === "confirmed" && b.date <= today ? (
                <Button variant="link" size="sm" disabled={pending} onClick={() => run(() => completeBooking(b.id), { success: `#${b.id} סומנה כהושלמה. הלקוח יתבקש לדרג.` })}>
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
        onSend={(text) => {
          const id = replyTo;
          setReplyTo(null);
          if (id) run(() => replyReview(id, text), { success: "התגובה פורסמה" });
        }}
      />
    </>
  );
}
