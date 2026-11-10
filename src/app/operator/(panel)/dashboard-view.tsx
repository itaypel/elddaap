"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Navigation } from "lucide-react";
import { type Booking, type Operator, type Settings, money, shortDate, todayIso, weekday } from "@/lib/data";
import { greeting, hoursLeft, monthLabel } from "@/lib/ops";
import { completeBooking } from "@/app/actions";
import { useAction } from "@/components/use-action";
import { Button, Card, CardHeader, PageTitle, Stat, buttonClass } from "@/components/ui";

const noopSubscribe = () => () => {};

/**
 * A summary, not a second copy of the other pages: each figure links to the
 * page that owns it, and only what needs a decision today is listed in full.
 */
export function DashboardView({ op, bookings, settings }: { op: Operator; bookings: Booking[]; settings: Settings }) {
  const hello = useSyncExternalStore(noopSubscribe, greeting, () => "שלום");
  const [run, pending] = useAction();

  const today = todayIso();
  const month = today.slice(0, 7);
  const monthName = monthLabel(month).split(" ")[0];
  const open = bookings.filter((b) => b.status === "pending");
  const thisMonth = bookings.filter((b) => b.date.startsWith(month));
  const monthBooked = thisMonth.filter((b) => b.status === "confirmed" || b.status === "awaiting_payment" || b.status === "completed");
  const monthAwaiting = thisMonth.filter((b) => b.status === "awaiting_payment").length;
  const monthNet = Math.round(monthBooked.reduce((s, b) => s + b.total, 0) * (1 - settings.commission));
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 4);
  const toComplete = bookings.filter((b) => b.status === "confirmed" && b.date < today).sort((a, b) => a.date.localeCompare(b.date));
  const unanswered = op.reviews.filter((r) => !r.reply).length;
  const left = open.map((b) => hoursLeft(b, settings.replyHours));
  const late = left.filter((h) => h === 0).length;
  const soonest = left.filter((h) => h > 0).length ? Math.min(...left.filter((h) => h > 0)) : null;
  const requestsSub = late ? `${late === 1 ? "אחת" : late} באיחור, כדאי לענות עכשיו` : soonest !== null ? `הקרובה פגה בעוד ${soonest} שעות` : "אין בקשות שמחכות לכם";

  return (
    <>
      <PageTitle title={`${hello}, ${op.name}`} />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat highlight href="/operator/requests" label="בקשות חדשות" value={open.length} sub={requestsSub} />
        <Stat label={`הזמנות ב${monthName}`} value={monthBooked.length} sub={monthAwaiting ? `עוד ${monthAwaiting} ממתינות לתשלום` : "כולן שולמו"} />
        <Stat href="/operator/income" label={`הכנסה נטו ב${monthName}`} value={money(monthNet)} sub={`אחרי עמלה של ${Math.round(settings.commission * 100)}%`} />
        <Stat href="/operator/reviews" label="דירוג ממוצע" value={op.rating ? op.rating.toFixed(1) : "—"} sub={`${op.reviewsCount} ביקורות מאומתות`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
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
                  className="flex min-h-11 items-center gap-1.5 rounded-xl border border-line-strong px-3 text-sm font-semibold hover:bg-sunken"
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
          <CardHeader title="דורש טיפול" />
          {toComplete.length === 0 && unanswered === 0 ? (
            <p className="mt-3 text-[15px] text-muted">הכול מטופל. אין משהו שמחכה לכם כרגע.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {toComplete.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{b.customerName}</p>
                    <p className="text-[13px] text-muted">
                      {b.eventType} · {weekday(b.date)} {shortDate(b.date)} · התקיים
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" className="shrink-0" disabled={pending} onClick={() => run(() => completeBooking(b.id), { success: `#${b.id} סומנה כהושלמה. הלקוח יתבקש לדרג.` })}>
                    סימון כהושלמה
                  </Button>
                </li>
              ))}
              {unanswered > 0 && (
                <li className="flex items-center justify-between gap-3 py-3">
                  <p className="text-[15px]">{unanswered === 1 ? "ביקורת אחת מחכה לתגובה שלכם" : `${unanswered} ביקורות מחכות לתגובה שלכם`}</p>
                  <Link href="/operator/reviews" className={buttonClass("secondary", "sm", "shrink-0")}>
                    לדירוגים
                  </Link>
                </li>
              )}
            </ul>
          )}
          {toComplete.length > 0 && <p className="mt-2 text-[13px] leading-relaxed text-muted">סימון כהושלמה מאפשר ללקוח לדרג ומכניס את התשלום להעברה הקרובה.</p>}
        </Card>
      </div>
    </>
  );
}
