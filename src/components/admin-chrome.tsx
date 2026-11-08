"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { Logo } from "./brand";
import { cx } from "./ui";

const items = [
  { href: "/admin", label: "סקירה" },
  { href: "/admin/bookings", label: "הזמנות ותשלומים" },
  { href: "/admin/approvals", label: "אישורים", badge: "approvals" as const },
  { href: "/admin/approvals?tab=complaints", label: "תלונות וביקורות", badge: "complaints" as const },
  { href: "/admin/catalog", label: "לקוחות ומפעילים" },
  { href: "/admin/catalog#categories", label: "קטגוריות" },
  { href: "/admin/catalog#promos", label: "מבצעים וקידום" },
  { href: "/admin#reports", label: "דוחות" },
  { href: "/admin/catalog#rules", label: "עמלות והגדרות" },
];

function useBadges() {
  const admin = useStore((s) => s.admin);
  const approvals = ["pinat-hachai", "kfitzot-anak", "studio-tzeva"].filter((k) => !admin.approvals[k]).length;
  const complaints = Object.values(admin.complaints).filter((v) => v !== "closed").length;
  return { approvals, complaints };
}

export function AdminNav() {
  const pathname = usePathname();
  const badges = useBadges();
  const isActive = (href: string) => {
    const path = href.split(/[?#]/)[0];
    if (href.includes("#") || href.includes("?")) return false;
    return path === "/admin" ? pathname === "/admin" : pathname.startsWith(path);
  };
  return (
    <>
      {/* Regular width: dark sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 bg-[#121216] p-4 text-white lg:flex">
        <Logo badge="ניהול" href="/admin" inverted />
        <nav aria-label="ניהול">
          <ul className="flex flex-col gap-0.5">
            {items.map((it) => {
              const active = isActive(it.href);
              const count = it.badge ? badges[it.badge] : 0;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    className={cx("flex min-h-11 items-center justify-between rounded-xl px-3 text-[15px] transition-colors", active ? "bg-white/12 font-bold text-white" : "text-white/75 hover:bg-white/6 hover:text-white")}
                  >
                    {it.label}
                    {count > 0 && (
                      <span className={cx("grid min-w-6 place-items-center rounded-full px-1.5 text-xs leading-6 font-bold", it.badge === "complaints" ? "bg-[#f4b740] text-[#16161a]" : "bg-accent text-white")}>{count}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link href="/" className="mt-auto text-center text-[13px] text-white/60 hover:text-white">
          לאתר הלקוחות
        </Link>
      </aside>

      {/* Compact width: dark top bar with a scrollable section rail */}
      <header className="sticky top-0 z-40 bg-[#121216] text-white lg:hidden">
        <div className="flex h-14 items-center px-4">
          <Logo badge="ניהול" href="/admin" inverted />
        </div>
        <nav aria-label="ניהול" className="no-scrollbar overflow-x-auto px-2 pb-2">
          <ul className="flex gap-1">
            {items.slice(0, 5).map((it) => {
              const active = isActive(it.href);
              const count = it.badge ? badges[it.badge] : 0;
              return (
                <li key={it.href} className="shrink-0">
                  <Link href={it.href} aria-current={active ? "page" : undefined} className={cx("flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm", active ? "bg-white/12 font-bold" : "text-white/75")}>
                    {it.label}
                    {count > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] leading-5 font-bold">{count}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
    </>
  );
}
