"use client";

import Link from "next/link";
import {
  Trophy,
  WandSparkles,
  FlaskConical,
  Palette,
  Castle,
  Droplets,
  PawPrint,
  Smile,
  Tent,
  Truck,
  CheckCircle2,
  X,
} from "lucide-react";
import { type CategoryId, categoryById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cx } from "./ui";

export function Logo({ badge, href = "/", inverted }: { badge?: string; href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-2.5 rounded-lg" aria-label={`הפעילו${badge ? ` · ${badge}` : ""} — לעמוד הבית`}>
      <span className="grid size-9 place-items-center rounded-[10px] bg-accent text-lg font-extrabold text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]" aria-hidden>
        ה
      </span>
      <span className={cx("text-xl font-extrabold tracking-tight", inverted ? "text-white" : "text-ink")}>הפעילו</span>
      {badge && (
        <span className={cx("rounded-md px-2 py-0.5 text-xs font-bold", inverted ? "bg-white text-[#16161a]" : "bg-contrast text-on-contrast")}>{badge}</span>
      )}
    </Link>
  );
}

const icons: Record<CategoryId, typeof Trophy> = {
  sport: Trophy,
  magic: WandSparkles,
  science: FlaskConical,
  art: Palette,
  inflatables: Castle,
  water: Droplets,
  animals: PawPrint,
  characters: Smile,
  equipment: Tent,
  mobile: Truck,
};

export function CategoryIcon({ id, className }: { id: CategoryId; className?: string }) {
  const Icon = icons[id];
  return <Icon aria-hidden className={className} strokeWidth={1.8} />;
}

/** A tinted media tile standing in for operator photos; color encodes category. */
export function OperatorMedia({
  category,
  className,
  label,
  iconClassName = "size-10",
  src,
  children,
}: {
  category: CategoryId;
  className?: string;
  label?: string;
  iconClassName?: string;
  /** A real photo; without one the category tint and icon stand in. */
  src?: string | null;
  children?: React.ReactNode;
}) {
  const c = categoryById[category];
  return (
    <div
      className={cx("tint relative grid place-items-center overflow-hidden", className)}
      style={{ "--tint": c.tint, "--hue": c.hue } as React.CSSProperties}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span style={{ color: c.hue }} className="opacity-80">
          <CategoryIcon id={category} className={iconClassName} />
        </span>
      )}
      {children}
    </div>
  );
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cx(
            "animate-rise pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold shadow-float",
            t.tone === "danger" ? "bg-danger text-white" : "bg-contrast text-on-contrast",
          )}
        >
          {t.tone !== "danger" && <CheckCircle2 aria-hidden className="size-5 shrink-0 text-[#5fd09a]" />}
          <span>{t.text}</span>
          <button type="button" onClick={() => dismiss(t.id)} className="-me-1 grid size-8 place-items-center rounded-lg opacity-70 hover:opacity-100" aria-label="סגירה">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
