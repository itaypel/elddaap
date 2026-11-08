"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, CalendarCheck, Building2, Lock, ArrowRight, RotateCcw } from "lucide-react";
import { Logo } from "./brand";
import { buttonClass, cx } from "./ui";
import { useStore } from "@/lib/store";

const nav = [
  { href: "/search", label: "חיפוש הפעלות" },
  { href: "/institutions", label: "למוסדות" },
  { href: "/#how", label: "איך זה עובד" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const unread = useStore((s) => s.notices.filter((n) => n.audience === "customer" && !n.read).length);
  return (
    <header className="glass sticky top-0 z-40 border-b border-line bg-card/85 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="ראשי" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {nav.map((n) => {
                const active = pathname === n.href || (n.href !== "/#how" && pathname.startsWith(n.href));
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex min-h-10 items-center rounded-lg px-3 text-[15px] transition-colors",
                        active ? "bg-accent-soft font-semibold text-accent-ink" : "text-muted hover:text-ink",
                      )}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/operator/join" className="hidden min-h-10 items-center rounded-lg px-2 text-[15px] font-semibold text-accent-ink hover:underline sm:flex">
            הצטרפות כמפעיל
          </Link>
          <Link href="/bookings" className={buttonClass("contrast", "sm", "relative hidden md:inline-flex")}>
            ההזמנות שלי
            {unread > 0 && (
              <span className="absolute -top-1.5 -start-1.5 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold leading-5 text-white" aria-label={`${unread} התראות חדשות`}>
                {unread}
              </span>
            )}
          </Link>
          <Link href="/operator/join" className="flex min-h-11 items-center rounded-lg px-2 text-[15px] font-semibold text-accent-ink sm:hidden">
            למפעילים
          </Link>
        </div>
      </div>
    </header>
  );
}

const tabs = [
  { href: "/", label: "בית", icon: Home, match: (p: string) => p === "/" },
  { href: "/search", label: "חיפוש", icon: Search, match: (p: string) => p.startsWith("/search") || p.startsWith("/operators") },
  { href: "/bookings", label: "הזמנות", icon: CalendarCheck, match: (p: string) => p.startsWith("/bookings") },
  { href: "/institutions", label: "מוסדות", icon: Building2, match: (p: string) => p.startsWith("/institutions") },
];

/** Bottom tab bar on compact widths: top-level sections stay one thumb away. */
export function CustomerTabBar() {
  const pathname = usePathname();
  const unread = useStore((s) => s.notices.filter((n) => n.audience === "customer" && !n.read).length);
  return (
    <nav aria-label="ניווט ראשי" className="glass pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/90 backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cx("relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-accent-ink" : "text-muted")}
              >
                <Icon aria-hidden className="size-6" strokeWidth={active ? 2.3 : 1.8} />
                {t.label}
                {t.href === "/bookings" && unread > 0 && (
                  <span className="absolute top-1.5 start-[calc(50%+6px)] grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4.5 text-white">
                    {unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Minimal header for focused flows (booking, payment, rating): one way back, nothing else. */
export function FlowHeader({ backHref, backLabel, secure }: { backHref?: string; backLabel?: string; secure?: boolean }) {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        {secure ? (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Lock aria-hidden className="size-4" />
            תשלום מאובטח
          </span>
        ) : backHref ? (
          <Link href={backHref} className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-accent-ink hover:underline">
            <ArrowRight aria-hidden className="size-4" />
            {backLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function SiteFooter() {
  const reset = useStore((s) => s.reset);
  const toast = useStore((s) => s.toast);
  const cols = [
    { title: "לקוחות", links: [["/search", "חיפוש הפעלות"], ["/bookings", "ההזמנות שלי"], ["/#how", "איך זה עובד"], ["/institutions", "למוסדות"]] },
    { title: "מפעילים", links: [["/operator/join", "הצטרפות"], ["/operator", "כניסה למפעילים"], ["/operator/join#plans", "מסלולים ומחירים"]] },
    { title: "מידע", links: [["/info/terms", "תנאי שימוש"], ["/info/cancellation", "מדיניות ביטולים והחזרים"], ["/info/privacy", "מדיניות פרטיות"], ["/info/accessibility", "הצהרת נגישות"], ["/info/contact", "צור קשר"]] },
  ];
  return (
    <footer className="mt-20 border-t border-line bg-card pb-20 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 text-[15px] text-muted">כל ההפעלות לילדים, במקום אחד.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-[15px] font-bold">{c.title}</h2>
            <ul className="mt-3 flex flex-col">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="flex min-h-9 items-center text-[15px] text-muted hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-sm text-muted sm:px-6">
          <p>© 2026 הפעילו · כל המחירים כוללים מע״מ</p>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            <span className="me-1">גרסת הדגמה:</span>
            <Link className="rounded-lg px-2 py-1.5 font-semibold text-accent-ink hover:bg-accent-soft" href="/bookings">לקוח</Link>
            <Link className="rounded-lg px-2 py-1.5 font-semibold text-accent-ink hover:bg-accent-soft" href="/operator">מפעיל</Link>
            <Link className="rounded-lg px-2 py-1.5 font-semibold text-accent-ink hover:bg-accent-soft" href="/admin">ניהול</Link>
            <button
              type="button"
              onClick={() => {
                reset();
                toast("נתוני ההדגמה אופסו");
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-muted hover:bg-sunken hover:text-ink"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              איפוס
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
