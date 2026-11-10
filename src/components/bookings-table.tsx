"use client";

import { type Booking, money, shortDate, statusMeta } from "@/lib/data";
import { Badge, cx } from "./ui";

type Col = "id" | "customer" | "operator" | "when" | "package" | "amount" | "commission" | "payment" | "status" | "action";

const paymentLabel = (b: Booking) =>
  b.status === "pending" ? "לא חויב" : b.status === "awaiting_payment" ? "ממתין למקדמה" : b.status === "confirmed" ? "מקדמה שולמה" : b.status === "completed" ? "שולם במלואו" : b.paid ? "הוחזר" : "—";

export function BookingsTable({
  bookings,
  cols,
  commission = 0.1,
  caption,
  rowAction,
}: {
  bookings: Booking[];
  cols: Col[];
  commission?: number;
  caption: string;
  rowAction?: (b: Booking) => React.ReactNode;
}) {
  const head: Record<Col, string> = {
    id: "הזמנה",
    customer: "לקוח",
    operator: "מפעיל",
    when: "מועד",
    package: "חבילה",
    amount: "סכום",
    commission: "עמלה",
    payment: "תשלום",
    status: "סטטוס",
    action: "",
  };
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] border-collapse text-[15px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-start text-[13px] text-muted">
            {cols.map((c) => (
              <th key={c} scope="col" className="px-3 py-2.5 text-start font-medium first:ps-0">
                {head[c] || <span className="sr-only">פעולות</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const meta = statusMeta[b.status];
            const total = b.total;
            const cell: Record<Col, React.ReactNode> = {
              id: <span className="text-muted tabular">#{b.id}</span>,
              customer: <span className="font-bold">{b.customerName}</span>,
              operator: b.operator.name,
              when: (
                <span className="tabular">
                  {b.time} · {shortDate(b.date)}
                </span>
              ),
              package: b.pkg.name,
              amount: <span className="tabular">{money(total)}</span>,
              commission: <span className="text-muted tabular">{money(b.status === "cancelled" || b.status === "declined" ? 0 : Math.round(total * commission))}</span>,
              payment: <span className="text-muted">{paymentLabel(b)}</span>,
              status: <Badge tone={meta.tone}>{meta.label}</Badge>,
              action: rowAction?.(b),
            };
            return (
              <tr key={b.id} className="border-b border-line last:border-0">
                {cols.map((c) => (
                  <td key={c} className={cx("px-3 py-3 whitespace-nowrap first:ps-0", c === "action" && "text-end")}>
                    {cell[c]}
                  </td>
                ))}
              </tr>
            );
          })}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="py-8 text-center text-muted">
                אין הזמנות שמתאימות לחיפוש
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
