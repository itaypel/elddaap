"use client";

import { Landmark } from "lucide-react";
import { type Booking, type Settings, money } from "@/lib/data";
import { downloadCsv, incomeByMonth, nextPayout } from "@/lib/ops";
import { IncomeTable } from "@/components/income-table";
import { Badge, Button, Card, CardHeader, PageTitle, Stat } from "@/components/ui";

export function IncomeView({ bookings, settings, bank }: { bookings: Booking[]; settings: Settings; bank: Record<string, string> }) {
  const rows = incomeByMonth(bookings, settings.commission, settings.payoutDay);
  const gross = rows.reduce((s, m) => s + m.gross, 0);
  const commission = rows.reduce((s, m) => s + m.commission, 0);
  const payout = nextPayout(rows, settings.payoutDay);
  return (
    <>
      <PageTitle
        title="הכנסות"
        sub={`ההעברות מגיעות לחשבון הבנק פעם בחודש, ב־${settings.payoutDay} לחודש, על הזמנות שהושלמו.`}
        action={
          <Button
            variant="secondary"
            disabled={!rows.length}
            onClick={() => downloadCsv("hafilu-income.csv", [["חודש", "הזמנות שהושלמו", "ברוטו", "עמלה", "נטו"], ...rows.map((m) => [m.label, m.completed, m.gross, m.commission, m.net])])}
          >
            הורדת דוח לרואה החשבון
          </Button>
        }
      />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="ברוטו מהזמנות שהושלמו" value={money(gross)} />
        <Stat label="עמלת הפלטפורמה" value={money(commission)} sub={`${Math.round(settings.commission * 100)}% מהזמנות שהושלמו`} />
        <Stat label="נטו אליכם" value={money(gross - commission)} />
        <Stat highlight label="ההעברה הבאה" value={payout ? money(payout.amount) : "—"} sub={payout ? `ב־${payout.date}` : "אין העברה מתוכננת"} />
      </div>
      <Card className="mt-4 p-5">
        <CardHeader title="לפי חודש" />
        <IncomeTable rows={rows} payoutDay={settings.payoutDay} />
      </Card>
      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-sunken">
            <Landmark aria-hidden className="size-5" />
          </span>
          <div>
            <p className="font-bold">חשבון להעברות</p>
            <p className="text-sm text-muted">{bank.account ? `${bank.bank} · סניף ${bank.branch} · חשבון ‎••••${bank.account.slice(-4)}` : "עוד לא הוגדר חשבון בנק. פנו אלינו כדי להוסיף."}</p>
          </div>
        </div>
        {bank.account ? <Badge tone="success">הוגדר</Badge> : <Badge tone="warning">חסר</Badge>}
      </Card>
    </>
  );
}
