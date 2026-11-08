import type { Booking } from "./data";

/** Seeded data is anchored to this moment so countdowns read sensibly in the demo. */
export const DEMO_NOW = new Date("2026-11-08T10:00:00");

export function hoursLeft(b: Booking, windowHours = 24) {
  const created = new Date(b.createdAt);
  const now = created < DEMO_NOW ? DEMO_NOW : new Date();
  const left = windowHours - (now.getTime() - created.getTime()) / 36e5;
  return Math.max(1, Math.round(left));
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

export const monthlyIncome = [
  { month: "ספטמבר 2026", completed: 14, gross: 23100, transfer: "done" as const },
  { month: "אוקטובר 2026", completed: 11, gross: 18150, transfer: "done" as const },
  { month: "נובמבר 2026", completed: 6, gross: 9900, transfer: "scheduled" as const },
];

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  if (h < 21) return "ערב טוב";
  return "לילה טוב";
};
