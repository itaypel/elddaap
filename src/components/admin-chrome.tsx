"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Logo } from "./brand";
import { cx } from "./ui";

/** One entry per page. No anchors or query links, so every item can show where you are. */
const items = [
  { href: "/admin", label: "סקירה" },
  { href: "/admin/bookings", label: "הזמנות ותשלומים" },
  { href: "/admin/approvals", label: "אישורים ובקרה", badge: true },
  { href: "/admin/people", label: "לקוחות ומפעילים" },
  { href: "/admin/promos", label: "מבצעים וקידום" },
  { href: "/admin/settings", label: "עמלות והגדרות" },
  { href: "/admin/account", label: "החשבון שלי" },
];

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

export function AdminNav({ approvals }: { approvals: number }) {
  const pathname = usePathname();
  const railActive = useRef<HTMLAnchorElement>(null);

  // Keep the current section visible in the compact, horizontally scrolling rail.
  useEffect(() => {
    railActive.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <>
      {/* Regular width: dark sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto bg-[#121216] p-4 text-white lg:flex">
        <Logo badge="ניהול" href="/admin" inverted />
        <nav aria-label="ניהול">
          <ul className="flex flex-col gap-0.5">
            {items.map((it) => {
              const active = isActive(pathname, it.href);
              const count = it.badge ? approvals : 0;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    className={cx("flex min-h-11 items-center justify-between rounded-xl px-3 text-[15px] transition-colors", active ? "bg-white/12 font-bold text-white" : "text-white/75 hover:bg-white/6 hover:text-white")}
                  >
                    {it.label}
                    {count > 0 && (
                      <span className="grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs leading-6 font-bold text-white" aria-label={`${count} ממתינים לאישור`}>
                        {count}
                      </span>
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

      {/* Compact width: dark top bar with the same sections in a scrollable rail */}
      <header className="sticky top-0 z-40 bg-[#121216] text-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo badge="ניהול" href="/admin" inverted />
          <Link href="/" className="flex min-h-11 items-center text-[13px] text-white/60 hover:text-white">
            לאתר הלקוחות
          </Link>
        </div>
        <nav aria-label="ניהול" className="no-scrollbar overflow-x-auto px-2 pb-2">
          <ul className="flex gap-1">
            {items.map((it) => {
              const active = isActive(pathname, it.href);
              const count = it.badge ? approvals : 0;
              return (
                <li key={it.href} className="shrink-0">
                  <Link
                    ref={active ? railActive : undefined}
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    className={cx("flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm", active ? "bg-white/12 font-bold" : "text-white/75")}
                  >
                    {it.label}
                    {count > 0 && (
                      <span className="rounded-full bg-accent px-1.5 text-[11px] leading-5 font-bold" aria-label={`${count} ממתינים לאישור`}>
                        {count}
                      </span>
                    )}
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
