import type { Booking } from "./data";

/** Hours an operator has left to answer a pending request. */
export function hoursLeft(b: Booking, windowHours = 24) {
  const left = windowHours - (Date.now() - new Date(b.createdAt).getTime()) / 36e5;
  return Math.max(0, Math.round(left));
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const body = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const monthNames = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
export const monthLabel = (ym: string) => `${monthNames[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

export type IncomeRow = { month: string; label: string; completed: number; gross: number; commission: number; net: number; transfer: "done" | "scheduled" };

/** Completed bookings grouped by event month, newest last. Payouts go out on payoutDay of the following month. */
export function incomeByMonth(bookings: Booking[], commission: number, payoutDay: number): IncomeRow[] {
  const by = new Map<string, Booking[]>();
  for (const b of bookings.filter((x) => x.status === "completed")) {
    const k = b.date.slice(0, 7);
    by.set(k, [...(by.get(k) ?? []), b]);
  }
  const now = new Date();
  return [...by.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, list]) => {
      const gross = list.reduce((s, b) => s + b.total, 0);
      const [y, m] = month.split("-").map(Number);
      const payout = new Date(y, m, payoutDay);
      return {
        month,
        label: monthLabel(month),
        completed: list.length,
        gross,
        commission: Math.round(gross * commission),
        net: gross - Math.round(gross * commission),
        transfer: payout <= now ? "done" : "scheduled",
      };
    });
}

export const nextPayout = (rows: IncomeRow[], payoutDay: number) => {
  const pending = rows.filter((r) => r.transfer === "scheduled");
  if (!pending.length) return null;
  const [y, m] = pending[0].month.split("-").map(Number);
  return { amount: pending.reduce((s, r) => s + r.net, 0), date: `${payoutDay}.${(m % 12) + 1}`, year: m === 12 ? y + 1 : y };
};

/** Insurance "MM/YYYY" that ends within 30 days or already ended ("—" means none on file). */
export const insuranceSoon = (until: string) => {
  const m = /^(\d{2})\/(\d{4})$/.exec(until);
  if (!m) return until === "—";
  const end = new Date(Number(m[2]), Number(m[1]), 0);
  return end.getTime() - Date.now() < 30 * 864e5;
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  if (h < 21) return "ערב טוב";
  return "לילה טוב";
};
