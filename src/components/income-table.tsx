"use client";

import { money } from "@/lib/data";
import { monthlyIncome } from "@/lib/ops";
import { Badge } from "./ui";

export function IncomeTable() {
  return (
    <div className="-mx-5 mt-3 overflow-x-auto px-5">
      <table className="w-full min-w-[560px] border-collapse text-[15px]">
        <caption className="sr-only">הכנסות לפי חודש</caption>
        <thead>
          <tr className="border-b border-line text-[13px] text-muted">
            {["חודש", "הזמנות שהושלמו", "ברוטו", "עמלת הפלטפורמה", "נטו אליכם", "העברה"].map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 text-start font-medium first:ps-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthlyIncome.map((m) => (
            <tr key={m.month} className="border-b border-line last:border-0">
              <th scope="row" className="py-3 text-start font-bold">
                {m.month}
              </th>
              <td className="px-3 tabular">{m.completed}</td>
              <td className="px-3 tabular">{money(m.gross)}</td>
              <td className="px-3 text-muted tabular">{money(m.gross * 0.1)}</td>
              <td className="px-3 font-bold tabular">{money(m.gross * 0.9)}</td>
              <td className="px-3">{m.transfer === "done" ? <Badge tone="success">הועבר</Badge> : <Badge tone="warning">יועבר ב־10.12</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
