"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Booking, type Operator, statusMeta, todayIso } from "@/lib/data";
import { setBlockedDates } from "@/app/actions";
import { useAction } from "@/components/use-action";
import { Sheet } from "@/components/sheet";
import { Badge, Button, ButtonLink, Card, CardHeader, Checkbox, Field, Input, PageTitle, Select, cx } from "@/components/ui";

const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const dayHeads = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function CalendarView({ op, bookings }: { op: Operator; bookings: Booking[] }) {
  const today = todayIso();
  const [blocked, setBlocked] = useState(op.blockedDates);
  const [run] = useAction();
  const [ym, setYm] = useState({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 });
  const [selected, setSelected] = useState(today);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [range, setRange] = useState({ from: today, to: today });
  const [maxPerDay, setMaxPerDay] = useState("3");
  const [travel, setTravel] = useState("60");
  const [sync, setSync] = useState(true);

  const first = new Date(ym.y, ym.m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const prevDays = new Date(ym.y, ym.m, 0).getDate();
  const cells: { date: string; day: number; inMonth: boolean }[] = [];
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(ym.y, ym.m - 1, prevDays - i);
    cells.push({ date: iso(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: iso(ym.y, ym.m, d), day: d, inMonth: true });
  while (cells.length % 7) {
    const n = cells.length - startPad - daysInMonth + 1;
    const d = new Date(ym.y, ym.m + 1, n);
    cells.push({ date: iso(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: false });
  }

  const dayBookings = (date: string) => bookings.filter((b) => b.date === date && (b.status === "pending" || b.status === "awaiting_payment" || b.status === "confirmed"));
  const isBlocked = (date: string) => blocked.includes(date);
  const saveBlocked = (next: string[], message: string) => {
    setBlocked(next); // optimistic
    run(() => setBlockedDates(op.id, op.slug, next), { success: message, tone: "neutral" });
  };
  const toggleBlock = (date: string) =>
    saveBlocked(isBlocked(date) ? blocked.filter((d) => d !== date) : [...blocked, date], isBlocked(date) ? "התאריך נפתח להזמנות" : "התאריך נחסם להזמנות חדשות");
  const shift = (n: number) => setYm(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));
  const sel = dayBookings(selected).sort((a, b) => a.time.localeCompare(b.time));
  const [, sm, sd] = selected.split("-").map(Number);

  return (
    <>
      <PageTitle
        title="יומן זמינות"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => shift(-1)} aria-label="חודש קודם" className="w-11 px-0!">
              <ChevronRight aria-hidden className="size-5" />
            </Button>
            <p className="min-w-32 text-center text-lg font-bold" aria-live="polite">
              {monthNames[ym.m]} {ym.y}
            </p>
            <Button variant="secondary" size="sm" onClick={() => shift(1)} aria-label="חודש הבא" className="w-11 px-0!">
              <ChevronLeft aria-hidden className="size-5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setRangeOpen(true)}>
              חסימת תאריכים
            </Button>
          </div>
        }
      />
      <ul className="mt-4 flex flex-wrap gap-4 text-sm text-muted" aria-label="מקרא">
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-accent" />הזמנה מאושרת</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#e8a20c]" />בקשה ממתינה</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-line-strong" />חסום</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-line-strong bg-card" />פנוי</li>
      </ul>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px] xl:items-start">
        <Card className="p-2 sm:p-4">
          <div role="group" aria-label={`${monthNames[ym.m]} ${ym.y}`}>
            <div aria-hidden className="grid grid-cols-7 gap-1 pb-2 sm:gap-2">
              {dayHeads.map((d) => (
                <span key={d} className="text-center text-sm font-semibold text-muted">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {cells.map((c) => {
                const list = dayBookings(c.date);
                const approved = list.filter((b) => b.status !== "pending").length;
                const pend = list.filter((b) => b.status === "pending").length;
                const blockedDay = isBlocked(c.date);
                const full = approved >= Number(maxPerDay);
                const isSel = c.date === selected;
                return (
                  <button
                    key={c.date}
                    type="button"
                    aria-pressed={isSel}
                    aria-label={`${c.day} ${monthNames[Number(c.date.slice(5, 7)) - 1]}${approved ? `, ${approved} מאושרות` : ""}${pend ? `, ${pend} ממתינות` : ""}${blockedDay ? ", חסום" : ""}`}
                    onClick={() => setSelected(c.date)}
                    className={cx(
                      "flex min-h-16 flex-col items-stretch gap-1 rounded-xl border p-1.5 text-start transition-colors sm:min-h-24 sm:p-2",
                      !c.inMonth && "opacity-45",
                      blockedDay ? "border-line bg-sunken" : "border-line bg-card hover:border-line-strong",
                      isSel && "border-accent ring-2 ring-accent",
                    )}
                  >
                    <span className="text-[15px] font-bold tabular">{c.day}</span>
                    <span className="hidden flex-col gap-1 sm:flex">
                      {blockedDay && <span className="truncate rounded-md bg-line px-1.5 py-0.5 text-[12px] font-semibold text-muted">חסום</span>}
                      {full && !blockedDay ? (
                        <span className="truncate rounded-md bg-accent px-1.5 py-0.5 text-[12px] font-semibold text-white">מלא · {approved} אירועים</span>
                      ) : (
                        approved > 0 && <span className="truncate rounded-md bg-accent-soft px-1.5 py-0.5 text-[12px] font-semibold text-accent-ink">{approved} מאושר{approved > 1 ? "ות" : ""}</span>
                      )}
                      {pend > 0 && <span className="truncate rounded-md bg-warning-soft px-1.5 py-0.5 text-[12px] font-semibold text-warning">{pend} ממתינ{pend > 1 ? "ות" : "ה"}</span>}
                    </span>
                    <span className="flex gap-1 sm:hidden" aria-hidden>
                      {approved > 0 && <span className="size-1.5 rounded-full bg-accent" />}
                      {pend > 0 && <span className="size-1.5 rounded-full bg-[#e8a20c]" />}
                      {blockedDay && <span className="size-1.5 rounded-full bg-line-strong" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <CardHeader title={`${sd} ב${monthNames[sm - 1]}`} level={2} />
            {isBlocked(selected) && <Badge className="mt-3">התאריך חסום להזמנות חדשות</Badge>}
            <ul className="mt-3 flex flex-col gap-2">
              {sel.map((b: Booking) => (
                <li key={b.id} className="rounded-xl bg-sunken p-3">
                  <p className="flex items-baseline gap-3">
                    <span className="font-extrabold tabular">{b.time}</span>
                    <span className="text-[15px]">
                      {b.customerName} · {b.eventType}, {b.city}
                    </span>
                  </p>
                  <Badge tone={b.status === "pending" ? "warning" : "accent"} className="mt-1.5">
                    {b.status === "pending" ? "ממתינה" : statusMeta[b.status].label}
                  </Badge>
                </li>
              ))}
              {sel.length === 0 && <li className="py-4 text-center text-[15px] text-muted">אין אירועים ביום הזה</li>}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {sel.some((b) => b.status === "pending") && <ButtonLink href="/operator/requests">לבקשות של היום</ButtonLink>}
              <Button variant="secondary" onClick={() => toggleBlock(selected)}>
                {isBlocked(selected) ? "פתיחת היום" : "חסימת היום"}
              </Button>
            </div>
            <p className="mt-2 text-[13px] text-muted">חסימה לא מבטלת הזמנות קיימות, רק מונעת בקשות חדשות.</p>
          </Card>

          <Card className="p-5">
            <CardHeader title="שעות פעילות קבועות" />
            <dl className="mt-2 divide-y divide-line text-[15px]">
              {[
                ["א׳–ה׳", "15:00–20:00"],
                ["שישי", "09:00–16:00"],
                ["שבת", "10:00–18:00"],
              ].map(([d, h]) => (
                <div key={d} className="flex justify-between py-2.5">
                  <dt>{d}</dt>
                  <dd className="font-bold tabular">{h}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
              <Field label="עד כמה אירועים ביום" htmlFor="max-day">
                <Select id="max-day" value={maxPerDay} onChange={(e) => setMaxPerDay(e.target.value)}>
                  {["1", "2", "3", "4", "5"].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </Select>
              </Field>
              <Field label="זמן נסיעה בין אירועים" htmlFor="travel">
                <Select id="travel" value={travel} onChange={(e) => setTravel(e.target.value)}>
                  <option value="30">חצי שעה</option>
                  <option value="60">שעה</option>
                  <option value="90">שעה וחצי</option>
                </Select>
              </Field>
            </div>
            <Checkbox className="mt-2" label="סנכרון עם היומן בטלפון" checked={sync} onChange={() => setSync(!sync)} />
            <p className="text-[13px] leading-relaxed text-muted">לקוחות רואים רק שעות פנויות. אחרי אישור הזמנה, השעה וזמן הנסיעה נחסמים אוטומטית.</p>
            <Link href="/operator/settings" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:underline">
              עריכת שעות הפעילות
            </Link>
          </Card>
        </div>
      </div>

      <Sheet
        open={rangeOpen}
        onClose={() => setRangeOpen(false)}
        title="חסימת תאריכים"
        footer={
          <Button
            className="w-full"
            onClick={() => {
              const out: string[] = [];
              const d = new Date(range.from);
              const end = new Date(range.to);
              while (d <= end && out.length < 60) {
                out.push(iso(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setDate(d.getDate() + 1);
              }
              saveBlocked(Array.from(new Set([...blocked, ...out])), `${out.length} ימים נחסמו`);
              setRangeOpen(false);
            }}
          >
            חסימה
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="מתאריך" htmlFor="r-from">
            <Input id="r-from" type="date" min={today} value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </Field>
          <Field label="עד תאריך" htmlFor="r-to">
            <Input id="r-to" type="date" min={range.from} value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
