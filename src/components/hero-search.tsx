"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { ageRanges, eventTypes, plusDays, regions, todayIso } from "@/lib/data";
import { Field, Input, Select, buttonClass } from "./ui";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState({ type: "יום הולדת", date: plusDays(todayIso(), 14), age: "6-8", region: "מרכז", budget: "2000" });
  const set = (k: keyof typeof q) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setQ({ ...q, [k]: e.target.value });

  return (
    <form
      role="search"
      aria-label="חיפוש הפעלות"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?${new URLSearchParams(q).toString()}`);
      }}
      className="grid gap-3 rounded-2xl border border-line bg-card p-4 shadow-float sm:grid-cols-2 sm:p-5 lg:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <Field label="סוג האירוע" htmlFor="q-type">
        <Select id="q-type" value={q.type} onChange={set("type")}>
          {eventTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <Field label="תאריך" htmlFor="q-date">
        <Input id="q-date" type="date" value={q.date} min={todayIso()} onChange={set("date")} />
      </Field>
      <Field label="גיל הילדים" htmlFor="q-age">
        <Select id="q-age" value={q.age} onChange={set("age")}>
          {ageRanges.map((a) => (
            <option key={a.id} value={a.id}>
              גילאי {a.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="אזור" htmlFor="q-region">
        <Select id="q-region" value={q.region} onChange={set("region")}>
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </Field>
      <Field label="תקציב" htmlFor="q-budget">
        <Select id="q-budget" value={q.budget} onChange={set("budget")}>
          <option value="1000">עד 1,000 ₪</option>
          <option value="1500">עד 1,500 ₪</option>
          <option value="2000">עד 2,000 ₪</option>
          <option value="3000">עד 3,000 ₪</option>
          <option value="">ללא הגבלה</option>
        </Select>
      </Field>
      <button type="submit" className={buttonClass("primary", "lg", "sm:col-span-2 lg:col-span-1 lg:min-w-32")}>
        <Search aria-hidden className="size-[18px]" />
        חיפוש
      </button>
    </form>
  );
}
