"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { type BookingStatus, bookingTotal, operatorBySlug, statusMeta } from "@/lib/data";
import { useStore } from "@/lib/store";
import { downloadCsv } from "@/lib/ops";
import { BookingsTable } from "./bookings-table";
import { Button, Card, CardHeader, Input, Select } from "./ui";

export function AdminBookings({ limit }: { limit?: number }) {
  const bookings = useStore((s) => s.bookings);
  const commission = useStore((s) => s.admin.commission);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | BookingStatus>("");

  const filtered = bookings
    .filter((b) => !status || b.status === status)
    .filter((b) => {
      if (!q.trim()) return true;
      const hay = `${b.id} ${b.customerName} ${operatorBySlug(b.operatorSlug)?.name} ${b.city}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase().replace("#", ""));
    })
    .sort((a, b) => b.id - a.id);
  const shown = limit ? filtered.slice(0, limit) : filtered;

  return (
    <Card className="p-5">
      <CardHeader
        title="הזמנות ותשלומים"
        action={
          !limit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCsv("hafilu-bookings.csv", [
                  ["הזמנה", "לקוח", "מפעיל", "תאריך", "שעה", "סכום", "עמלה", "סטטוס"],
                  ...filtered.map((b) => [b.id, b.customerName, operatorBySlug(b.operatorSlug)?.name ?? "", b.date, b.time, bookingTotal(b), Math.round(bookingTotal(b) * commission), statusMeta[b.status].label]),
                ])
              }
            >
              ייצוא CSV
            </Button>
          )
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
        <BookingsTable caption="הזמנות ותשלומים" bookings={shown} commission={commission} cols={["id", "customer", "operator", "when", "amount", "commission", "payment", "status"]} />
      </div>
      {limit && filtered.length > limit && <p className="mt-3 text-sm text-muted">מוצגות {limit} מתוך {filtered.length}. כל ההזמנות בעמוד הזמנות ותשלומים.</p>}
    </Card>
  );
}
