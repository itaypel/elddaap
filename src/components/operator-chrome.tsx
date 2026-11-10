"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Inbox, CalendarDays, UserRound, Wallet, Star, Settings2 } from "lucide-react";
import type { CategoryId } from "@/lib/data";
import { Logo, OperatorMedia } from "./brand";
import { cx } from "./ui";

export type OperatorChromeProps = { name: string; category: CategoryId; plan: "basic" | "pro"; status: string; verified: boolean; pending: number };

const items = [
  { href: "/operator", label: "לוח בקרה", short: "בקרה", icon: LayoutGrid, tab: true },
  { href: "/operator/requests", label: "בקשות", short: "בקשות", icon: Inbox, tab: true },
  { href: "/operator/calendar", label: "יומן זמינות", short: "יומן", icon: CalendarDays, tab: true },
  { href: "/operator/profile", label: "פרופיל וחבילות", short: "פרופיל", icon: UserRound, tab: true },
  { href: "/operator/income", label: "הכנסות", short: "הכנסות", icon: Wallet, tab: true },
  { href: "/operator/reviews", label: "דירוגים", short: "דירוגים", icon: Star, tab: false },
  { href: "/operator/settings", label: "הגדרות", short: "הגדרות", icon: Settings2, tab: false },
];

const isActive = (pathname: string, href: string) => (href === "/operator" ? pathname === href : pathname.startsWith(href));

const statusLine = (p: OperatorChromeProps) =>
  `מסלול ${p.plan === "pro" ? "מתקדם" : "בסיסי"} · ${p.status === "active" ? (p.verified ? "מאומת" : "פעיל") : p.status === "pending" ? "בבדיקה" : p.status === "suspended" ? "מושהה" : "לא אושר"}`;

export function OperatorSidebar(p: OperatorChromeProps) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-e border-line bg-card p-4 lg:flex">
      <Logo badge="למפעילים" href="/operator" />
      <div className="flex items-center gap-3 rounded-2xl bg-sunken p-3">
        <OperatorMedia category={p.category} className="size-10 shrink-0 rounded-xl" iconClassName="size-5" />
        <div className="min-w-0">
          <p className="truncate font-bold">{p.name}</p>
          <p className="text-[13px] text-muted">{statusLine(p)}</p>
        </div>
      </div>
      <nav aria-label="ניווט מפעילים">
        <ul className="flex flex-col gap-0.5">
          {items.map((it) => {
            const active = isActive(pathname, it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cx("flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors", active ? "bg-accent-soft font-bold text-accent-ink" : "text-ink hover:bg-sunken")}
                >
                  <it.icon aria-hidden className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1">{it.label}</span>
                  {it.href === "/operator/requests" && p.pending > 0 && (
                    <span className="grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs leading-6 font-bold text-white" aria-label={`${p.pending} בקשות חדשות`}>
                      {p.pending}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {p.plan === "basic" && (
        <div className="mt-auto rounded-2xl bg-[#16161a] p-4 text-white dark:border dark:border-line">
          <p className="font-bold">מסלול מתקדם</p>
          <p className="mt-1 text-[13px] leading-relaxed text-white/75">נתונים עסקיים, חשיפה מוגברת וניהול לקוחות</p>
          <Link href="/operator/settings#plan" className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-white px-3 text-sm font-bold text-[#16161a]">
            לפרטים
          </Link>
        </div>
      )}
      <Link href="/" className={cx("text-center text-[13px] text-muted hover:text-ink", p.plan !== "basic" && "mt-auto")}>
        לאתר הלקוחות
      </Link>
    </aside>
  );
}

export function OperatorTopBar() {
  const pathname = usePathname();
  return (
    <header className="glass sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <Logo badge="למפעילים" href="/operator" />
        <nav aria-label="עוד" className="flex items-center">
          {items
            .filter((i) => !i.tab)
            .map((it) => {
              const active = isActive(pathname, it.href);
              return (
                <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={cx("flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold", active ? "text-accent-ink" : "text-muted")}>
                  <it.icon aria-hidden className="size-4" />
                  {it.short}
                </Link>
              );
            })}
        </nav>
      </div>
    </header>
  );
}

export function OperatorTabBar({ pending }: { pending: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="ניווט מפעילים" className="glass pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/90 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items
          .filter((i) => i.tab)
          .map((it) => {
            const active = isActive(pathname, it.href);
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cx("relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-accent-ink" : "text-muted")}
                >
                  <it.icon aria-hidden className="size-6" strokeWidth={active ? 2.3 : 1.8} />
                  {it.short}
                  {it.href === "/operator/requests" && pending > 0 && (
                    <span className="absolute top-1.5 start-[calc(50%+6px)] grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] leading-4.5 font-bold text-white">{pending}</span>
                  )}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
