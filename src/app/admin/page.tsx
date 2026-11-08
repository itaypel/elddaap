"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/data";
import { useStore } from "@/lib/store";
import { downloadCsv, monthlyIncome } from "@/lib/ops";
import { AdminBookings } from "@/components/admin-bookings";
import { buttonClass, Button, Card, CardHeader, Select, Stat, cx } from "@/components/ui";

const periods: Record<string, { done: number; volume: number; growth: string; approval: string; active: number; newOps: number; cancel: string; cancelSub: string }> = {
  "2026-11": { done: 186, volume: 297600, growth: "12% יותר מאוקטובר", approval: "87%", active: 74, newOps: 9, cancel: "4%", cancelSub: "7 הזמנות, 5 עם החזר מלא" },
  "2026-10": { done: 166, volume: 261300, growth: "8% יותר מספטמבר", approval: "84%", active: 65, newOps: 7, cancel: "5%", cancelSub: "8 הזמנות, 6 עם החזר מלא" },
  "2026-09": { done: 154, volume: 238900, growth: "השקה", approval: "81%", active: 58, newOps: 58, cancel: "6%", cancelSub: "9 הזמנות, 6 עם החזר מלא" },
};

export default function AdminOverview() {
  const admin = useStore((s) => s.admin);
  const [period, setPeriod] = useState("2026-11");
  const p = periods[period];
  const pendingApprovals = ["pinat-hachai", "kfitzot-anak", "studio-tzeva"].filter((k) => !admin.approvals[k]).length;
  const openComplaints = Object.values(admin.complaints).filter((v) => v !== "closed").length;

  const attention = [
    pendingApprovals > 0 && { dot: "bg-accent", text: `${pendingApprovals} פרופילים של מפעילים חדשים מחכים לאישור`, href: "/admin/approvals", cta: "לאישורים" },
    openComplaints > 0 && { dot: "bg-danger", text: `${openComplaints} תלונות פתוחות, אחת מהן מעל 48 שעות`, href: "/admin/approvals?tab=complaints", cta: "לתלונות" },
    { dot: "bg-[#e8a20c]", text: "בקשה #10477 לא נענתה 24 שעות. הלקוח קיבל הצעות למפעילים אחרים", href: "/admin/bookings", cta: "להזמנה" },
    { dot: "bg-[#e8a20c]", text: "לשני מפעילים פג תוקף הביטוח בעוד פחות מ־30 יום", href: "/admin/catalog", cta: "לפרופילים" },
  ].filter(Boolean) as { dot: string; text: string; href: string; cta: string }[];

  const commission = Math.round(p.volume * admin.commission);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">סקירה</h1>
        <label className="flex items-center gap-2 text-sm text-muted">
          תקופה
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="min-w-40">
            <option value="2026-11">נובמבר 2026</option>
            <option value="2026-10">אוקטובר 2026</option>
            <option value="2026-09">ספטמבר 2026</option>
          </Select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="הזמנות שהושלמו" value={p.done} sub={p.growth} subTone="success" />
        <Stat label="היקף הזמנות" value={money(p.volume)} sub="כולל מע״מ" />
        <Stat label="עמלות לפלטפורמה" value={money(commission)} sub={`${Math.round(admin.commission * 100)}% מהזמנות שהושלמו`} />
        <Stat label="שיעור אישור מפעילים" value={p.approval} sub="זמן תגובה ממוצע 3.4 שעות" />
        <Stat label="מפעילים פעילים" value={p.active} sub={`${p.newOps} חדשים החודש`} subTone="success" />
        <Stat label="שיעור ביטולים" value={p.cancel} sub={p.cancelSub} />
      </div>

      <Card className="mt-4 p-5">
        <CardHeader title="דורש טיפול" />
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
      </Card>

      <div className="mt-4">
        <AdminBookings limit={7} />
      </div>

      <section id="reports" aria-labelledby="reports-title" className="mt-8 scroll-mt-6">
        <h2 id="reports-title" className="text-xl font-extrabold">
          דוחות
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { t: "עמלות לפי חודש", d: "כמה נגבה מכל מפעיל, מה הועבר ומה עדיין פתוח", rows: [["חודש", "ברוטו", "עמלה"], ...monthlyIncome.map((m) => [m.month, m.gross, m.gross * admin.commission])] },
            { t: "ביצועי מפעילים", d: "הכנסות, דירוג, זמן תגובה ושיעור אישור לכל מפעיל", rows: [["מפעיל", "דירוג", "זמן תגובה", "שיעור אישור"], ["Water Battle", 4.9, "2.1 ש׳", "92%"], ["הקוסם נועם", 4.7, "1.4 ש׳", "95%"], ["מדע בקופסה", 4.8, "3.8 ש׳", "88%"]] },
            { t: "גיוס לקוחות", d: "עלות גיוס לקוח ושיעור החיפושים שהפכו להזמנה שהושלמה", rows: [["ערוץ", "לקוחות", "עלות לגיוס"], ["חיפוש ממומן", 312, 48], ["אורגני", 540, 0], ["הפניות", 121, 15]] },
            { t: "ייצוא לרואה חשבון", d: "כל התשלומים, ההחזרים והחשבוניות בקובץ אחד", rows: [["הזמנה", "סכום", "סטטוס"], [10402, 2400, "שולם"], [10398, 0, "הוחזר"]] },
          ].map((r, i) => (
            <Card key={r.t} className="flex flex-col p-5">
              <h3 className="font-bold">{r.t}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{r.d}</p>
              <Button variant="secondary" size="sm" className="mt-4 self-start" onClick={() => downloadCsv(`hafilu-report-${i + 1}.csv`, r.rows as (string | number)[][])}>
                {i === 3 ? "ייצוא CSV" : "הורדת הדוח"}
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
