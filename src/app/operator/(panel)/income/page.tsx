"use client";

import { Landmark } from "lucide-react";
import { money } from "@/lib/data";
import { downloadCsv, monthlyIncome } from "@/lib/ops";
import { IncomeTable } from "@/components/income-table";
import { Badge, Button, Card, CardHeader, PageTitle, Stat } from "@/components/ui";

export default function IncomePage() {
  const gross = monthlyIncome.reduce((s, m) => s + m.gross, 0);
  return (
    <>
      <PageTitle
        title="הכנסות"
        sub="ההעברות מגיעות לחשבון הבנק פעם בחודש, ב־10 לחודש, על הזמנות שהושלמו."
        action={
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv("hafilu-income.csv", [
                ["חודש", "הזמנות שהושלמו", "ברוטו", "עמלה", "נטו"],
                ...monthlyIncome.map((m) => [m.month, m.completed, m.gross, m.gross * 0.1, m.gross * 0.9]),
              ])
            }
          >
            הורדת דוח לרואה החשבון
          </Button>
        }
      />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="ברוטו ב־3 חודשים" value={money(gross)} />
        <Stat label="עמלת הפלטפורמה" value={money(gross * 0.1)} sub="10% מהזמנות שהושלמו" />
        <Stat label="נטו אליכם" value={money(gross * 0.9)} />
        <Stat highlight label="ההעברה הבאה" value={money(8910)} sub="ב־10.12" />
      </div>
      <Card className="mt-4 p-5">
        <CardHeader title="לפי חודש" />
        <IncomeTable />
      </Card>
      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-sunken">
            <Landmark aria-hidden className="size-5" />
          </span>
          <div>
            <p className="font-bold">חשבון להעברות</p>
            <p className="text-sm text-muted">בנק הפועלים · סניף 612 · חשבון ‎••••4821</p>
          </div>
        </div>
        <Badge tone="success">מאומת</Badge>
      </Card>
    </>
  );
}
