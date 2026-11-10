"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { type Booking, type BookingStatus, type Settings, statusMeta } from "@/lib/data";
import { downloadCsv, incomeByMonth } from "@/lib/ops";
import { BookingsTable } from "./bookings-table";
import { IncomeTable } from "./income-table";
import { Button, Card, CardHeader, Input, Select } from "./ui";

/** Every booking on the platform, searchable, with the one bookings export (also the accountant's file). */
export function AdminBookings({ bookings, commission }: { bookings: Booking[]; commission: number }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | BookingStatus>("");

  const filtered = bookings
    .filter((b) => !status || b.status === status)
    .filter((b) => {
      if (!q.trim()) return true;
      const hay = `${b.id} ${b.customerName} ${b.operator.name} ${b.city}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase().replace("#", ""));
    })
    .sort((a, b) => b.id - a.id);

  return (
    <Card className="p-5">
      <CardHeader
        title="כל ההזמנות"
        sub={filtered.length === bookings.length ? `${bookings.length} הזמנות` : `${filtered.length} מתוך ${bookings.length} הזמנות`}
        action={
          <Button
            variant="secondary"
            size="sm"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv("hafilu-bookings.csv", [
                ["הזמנה", "לקוח", "מפעיל", "תאריך", "שעה", "סכום", "שולם", "עמלה", "סטטוס"],
                ...filtered.map((b) => [b.id, b.customerName, b.operator.name, b.date, b.time, b.total, b.paid, Math.round(b.total * commission), statusMeta[b.status].label]),
              ])
            }
          >
            ייצוא CSV
          </Button>
        }
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search aria-hidden className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
          <Input aria-label="חיפוש הזמנה" type="search" placeholder="מספר הזמנה, לקוח או מפעיל" value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
        </div>
        <Select aria-label="סינון לפי סטטוס" value={status} onChange={(e) => setStatus(e.target.value as BookingStatus | "")} className="min-w-40">
          <option value="">כל הסטטוסים</option>
          {(Object.keys(statusMeta) as BookingStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusMeta[s].label}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-3">
        <BookingsTable caption="כל ההזמנות" bookings={filtered} commission={commission} cols={["id", "customer", "operator", "when", "amount", "commission", "payment", "status"]} />
      </div>
    </Card>
  );
}

/** Platform commission and operator payouts by month. */
export function AdminCommissions({ bookings, settings }: { bookings: Booking[]; settings: Settings }) {
  const rows = incomeByMonth(bookings, settings.commission, settings.payoutDay);
  return (
    <Card className="p-5">
      <CardHeader
        title="עמלות והעברות לפי חודש"
        sub={`עמלה של ${Math.round(settings.commission * 100)}% על הזמנות שהושלמו. ההעברה למפעילים ב־${settings.payoutDay} לחודש שאחרי.`}
        action={
          <Button
            variant="secondary"
            size="sm"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv("hafilu-commissions.csv", [
                ["חודש", "הזמנות שהושלמו", "ברוטו", "עמלה", "נטו למפעילים", "העברה"],
                ...rows.map((m) => [m.label, m.completed, m.gross, m.commission, m.net, m.transfer === "done" ? "הועבר" : "מתוכנן"]),
              ])
            }
          >
            ייצוא CSV
          </Button>
        }
      />
      <IncomeTable rows={rows} payoutDay={settings.payoutDay} audience="admin" />
    </Card>
  );
}
