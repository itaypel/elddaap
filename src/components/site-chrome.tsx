"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Home, Search, CalendarCheck, Building2, Lock, ArrowRight, LogOut, Store, Shield } from "lucide-react";
import { signOut } from "./session";
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
        <HeaderActions />
      </div>
    </header>
  );
}

function Avatar({ name, url, size = "size-9" }: { name?: string; url?: string | null; size?: string }) {
  if (url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" referrerPolicy="no-referrer" className={cx(size, "rounded-full object-cover")} />;
  return <span className={cx(size, "grid place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink")}>{(name ?? "?").trim()[0]}</span>;
}

function HeaderActions() {
  const session = useStore((s) => s.session);
  const router = useRouter();
  const pathname = usePathname();

  if (session.status === "loading") return <div className="h-10 w-28" aria-hidden />;

  if (session.status === "signedOut") {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/operator/join" className="hidden min-h-10 items-center rounded-lg px-2 text-[15px] font-semibold text-accent-ink hover:underline sm:flex">
          הצטרפות כמפעיל
        </Link>
        <Link href={`/login?next=${encodeURIComponent(pathname === "/" ? "/bookings" : pathname)}`} className={buttonClass("contrast", "sm")}>
          כניסה
        </Link>
      </div>
    );
  }

  const op = session.operator;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {op ? (
        <Link href="/operator" className="hidden min-h-10 items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-accent-ink hover:underline sm:flex">
          <Store aria-hidden className="size-4" />
          אזור המפעילים
        </Link>
      ) : (
        <Link href="/operator/join" className="hidden min-h-10 items-center rounded-lg px-2 text-[15px] font-semibold text-accent-ink hover:underline lg:flex">
          הצטרפות כמפעיל
        </Link>
      )}
      <div className="hidden md:block">
        <Link href="/bookings" className={buttonClass("contrast", "sm", "relative")}>
          ההזמנות שלי
          {session.unread > 0 && (
            <span className="absolute -top-1.5 -start-1.5 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold leading-5 text-white" aria-label={`${session.unread} התראות חדשות`}>
              {session.unread}
            </span>
          )}
        </Link>
      </div>
      <button type="button" popoverTarget="account-menu" className="grid size-11 place-items-center rounded-full" aria-label={`החשבון של ${session.name ?? ""}`}>
        <Avatar name={session.name} url={session.avatarUrl} />
      </button>
      <div
        id="account-menu"
        popover="auto"
        className="fixed inset-auto top-16 end-4 m-0 w-64 rounded-2xl border border-line bg-card p-2 text-ink shadow-float [&:popover-open]:animate-rise"
      >
        <div className="flex items-center gap-3 border-b border-line px-2 pt-1 pb-3">
          <Avatar name={session.name} url={session.avatarUrl} size="size-10" />
          <div className="min-w-0">
            <p className="truncate font-bold">{session.name}</p>
            <p className="truncate text-[13px] text-muted" dir="ltr" style={{ textAlign: "right" }}>
              {session.email}
            </p>
          </div>
        </div>
        <ul className="py-1 text-[15px]">
          <li>
            <Link href="/bookings" className="flex min-h-11 items-center gap-3 rounded-xl px-2 hover:bg-sunken">
              <CalendarCheck aria-hidden className="size-[18px] text-muted" />
              ההזמנות שלי
            </Link>
          </li>
          <li>
            <Link href={op ? "/operator" : "/operator/join"} className="flex min-h-11 items-center gap-3 rounded-xl px-2 hover:bg-sunken">
              <Store aria-hidden className="size-[18px] text-muted" />
              {op ? "אזור המפעילים" : "הצטרפות כמפעיל"}
            </Link>
          </li>
          {session.isAdmin && (
            <li>
              <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-xl px-2 hover:bg-sunken">
                <Shield aria-hidden className="size-[18px] text-muted" />
                ניהול
              </Link>
            </li>
          )}
          <li className="mt-1 border-t border-line pt-1">
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/");
                router.refresh();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-start hover:bg-sunken"
            >
              <LogOut aria-hidden className="size-[18px] text-muted rtl:-scale-x-100" />
              יציאה
            </button>
          </li>
        </ul>
      </div>
    </div>
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
  const unread = useStore((s) => s.session.unread);
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
          <Link href="/login?next=%2Fadmin" className="font-semibold text-muted hover:text-ink">
            כניסה לניהול
          </Link>
        </div>
      </div>
    </footer>
  );
}
