"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { categoryById, money } from "@/lib/data";
import type { AdminData } from "@/lib/db";
import { downloadCsv, insuranceSoon } from "@/lib/ops";
import { Badge, Button, Card, Input, PageTitle, Segmented, cx } from "@/components/ui";

type View = "operators" | "customers" | "leads";

const th = "px-3 py-2.5 text-start font-medium first:ps-0";
const statusLabel: Record<string, string> = { active: "פעיל", pending: "ממתין לאישור", rejected: "נדחה", suspended: "מושהה" };

export function PeopleView({ operators, bookings, leads }: Pick<AdminData, "operators" | "bookings" | "leads">) {
  const params = useSearchParams();
  const initial = params.get("view");
  const [view, setView] = useState<View>(initial === "customers" || initial === "leads" ? initial : "operators");
  const [q, setQ] = useState("");

  // Customers as seen through their bookings (name, kind, city, totals).
  const customerMap = new Map<string, { name: string; kind: string; city: string; orders: number; total: number; since: string }>();
  for (const b of bookings) {
    const key = b.customerId ?? b.customerName;
    const c = customerMap.get(key) ?? { name: b.customerName, kind: b.customerKind === "institution" ? "מוסד" : "הורה", city: b.city, orders: 0, total: 0, since: b.createdAt };
    c.orders += 1;
    if (b.status !== "cancelled" && b.status !== "declined") c.total += b.total;
    if (b.createdAt < c.since) c.since = b.createdAt;
    customerMap.set(key, c);
  }
  const customers = [...customerMap.values()].sort((a, b) => b.total - a.total);

  const needle = q.trim();
  const ops = operators.filter((o) => !needle || o.name.includes(needle) || categoryById[o.category]?.name.includes(needle));
  const custs = customers.filter((c) => !needle || c.name.includes(needle) || c.city.includes(needle));
  const lds = leads.filter((l) => !needle || String(l.org ?? "").includes(needle) || String(l.contact ?? "").includes(needle));
  const shown = view === "operators" ? ops.length : view === "customers" ? custs.length : lds.length;

  const exportCsv = () => {
    if (view === "operators")
      downloadCsv("hafilu-operators.csv", [
        ["מפעיל", "קטגוריה", "דירוג", "ביקורות", "הזמנות", "ביטוח עד", "מסלול", "סטטוס"],
        ...ops.map((o) => [o.name, categoryById[o.category]?.name ?? o.category, o.rating, o.reviewsCount, o.bookingsCount, o.insuranceUntil, o.plan === "pro" ? "מתקדם" : "בסיסי", statusLabel[o.status] ?? o.status]),
      ]);
    else if (view === "customers") downloadCsv("hafilu-customers.csv", [["לקוח", "סוג", "עיר", "הזמנות", "סה״כ"], ...custs.map((c) => [c.name, c.kind, c.city, c.orders, c.total])]);
    else
      downloadCsv("hafilu-leads.csv", [
        ["מוסד", "סוג", "איש קשר", "טלפון", "תאריך", "משתתפים", "תקציב"],
        ...lds.map((l) => [l.org, l.org_type, l.contact, l.phone, l.event_date ?? "", l.participants ?? "", l.budget ?? ""].map((v) => (v ?? "") as string | number)),
      ]);
  };

  const placeholder = view === "operators" ? "שם מפעיל או קטגוריה" : view === "customers" ? "שם לקוח או עיר" : "שם מוסד או איש קשר";

  return (
    <>
      <PageTitle title="לקוחות ומפעילים" />

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="סוג רשימה"
            value={view}
            onChange={(v) => {
              setView(v);
              setQ("");
            }}
            options={[
              { value: "operators", label: `מפעילים (${operators.length})` },
              { value: "customers", label: `לקוחות (${customers.length})` },
              { value: "leads", label: `פניות (${leads.length})` },
            ]}
          />
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <div className="relative min-w-48 flex-1 sm:max-w-64">
              <Search aria-hidden className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" />
              <Input type="search" aria-label="חיפוש ברשימה" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
            </div>
            <Button variant="secondary" disabled={!shown} onClick={exportCsv}>
              ייצוא CSV
            </Button>
          </div>
        </div>

        <div className="-mx-5 mt-4 overflow-x-auto px-5">
          {view === "operators" && (
            <table className="w-full min-w-[760px] border-collapse text-[15px]">
              <caption className="sr-only">מפעילים</caption>
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  {["מפעיל", "קטגוריה", "דירוג", "הזמנות", "ביטוח בתוקף עד", "מסלול", "סטטוס", ""].map((h, i) => (
                    <th key={i} scope="col" className={th}>
                      {h || <span className="sr-only">פעולה</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ops.map((o) => {
                  const expiring = o.status === "active" && insuranceSoon(o.insuranceUntil);
                  return (
                    <tr key={o.slug} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 text-start font-bold">
                        {o.name}
                      </th>
                      <td className="px-3">{categoryById[o.category]?.name}</td>
                      <td className="px-3 tabular">{o.rating ? o.rating.toFixed(1) : "—"}</td>
                      <td className="px-3 tabular">{o.bookingsCount}</td>
                      <td className={cx("px-3 tabular", expiring && "font-bold text-danger")}>{o.insuranceUntil}</td>
                      <td className="px-3">{o.plan === "pro" ? "מתקדם" : "בסיסי"}</td>
                      <td className="px-3">
                        <Badge tone={o.status === "active" ? "success" : o.status === "pending" ? "warning" : "danger"}>{statusLabel[o.status] ?? o.status}</Badge>
                      </td>
                      <td className="px-3 text-end">
                        <Link href={o.status === "pending" ? "/admin/approvals" : `/operators/${o.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink hover:underline">
                          {o.status === "pending" ? "לבדיקה" : "לכרטיס"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {ops.length === 0 && <EmptyRow cols={8} />}
              </tbody>
            </table>
          )}

          {view === "customers" && (
            <table className="w-full min-w-[600px] border-collapse text-[15px]">
              <caption className="sr-only">לקוחות</caption>
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  {["לקוח", "סוג", "עיר", "הזמנות", "סה״כ", "לקוח מאז"].map((h) => (
                    <th key={h} scope="col" className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {custs.map((c) => (
                  <tr key={c.name} className="border-b border-line last:border-0">
                    <th scope="row" className="py-3 text-start font-bold">
                      {c.name}
                    </th>
                    <td className="px-3">{c.kind}</td>
                    <td className="px-3">{c.city}</td>
                    <td className="px-3 tabular">{c.orders}</td>
                    <td className="px-3 tabular">{money(c.total)}</td>
                    <td className="px-3 text-muted tabular">{new Date(c.since).toLocaleDateString("he-IL", { month: "2-digit", year: "numeric" })}</td>
                  </tr>
                ))}
                {custs.length === 0 && <EmptyRow cols={6} />}
              </tbody>
            </table>
          )}

          {view === "leads" && (
            <table className="w-full min-w-[640px] border-collapse text-[15px]">
              <caption className="sr-only">פניות ממוסדות</caption>
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  {["מוסד", "סוג", "איש קשר", "טלפון", "תאריך", "משתתפים", "תקציב"].map((h) => (
                    <th key={h} scope="col" className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lds.map((l) => (
                  <tr key={String(l.id)} className="border-b border-line last:border-0">
                    <th scope="row" className="py-3 text-start font-bold">
                      {l.org}
                    </th>
                    <td className="px-3">{l.org_type}</td>
                    <td className="px-3">{l.contact}</td>
                    <td className="px-3 tabular" dir="ltr" style={{ textAlign: "right" }}>
                      {l.phone}
                    </td>
                    <td className="px-3 tabular">{l.event_date ?? "—"}</td>
                    <td className="px-3 tabular">{l.participants ?? "—"}</td>
                    <td className="px-3">{l.budget ?? "—"}</td>
                  </tr>
                ))}
                {lds.length === 0 && <EmptyRow cols={7} text={leads.length ? undefined : "עוד אין פניות. בקשות להצעת מחיר מעמוד המוסדות יופיעו כאן."} />}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </>
  );
}

function EmptyRow({ cols, text = "אין תוצאות שמתאימות לחיפוש" }: { cols: number; text?: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-8 text-center text-muted">
        {text}
      </td>
    </tr>
  );
}
