"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { Star, Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { statusSteps, type Tone } from "@/lib/data";

export const cx = clsx;

/* ------------------------------------------------------------------ Button */

type Variant = "primary" | "secondary" | "contrast" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors select-none disabled:opacity-45 disabled:pointer-events-none";
const buttonVariant: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover shadow-[0_1px_0_rgb(0_0_0/0.04)]",
  secondary: "bg-card text-ink border border-line-strong hover:bg-sunken",
  contrast: "bg-contrast text-on-contrast hover:opacity-90",
  ghost: "text-ink hover:bg-sunken",
  danger: "bg-card text-danger border border-line-strong hover:bg-danger-soft",
  link: "text-accent-ink hover:underline underline-offset-4 px-0! min-h-0!",
};
/* sm still meets a 36px desktop / 44px touch target thanks to padding + min-h on coarse pointers */
const buttonSize: Record<Size, string> = {
  sm: "text-sm px-3.5 min-h-9 pointer-coarse:min-h-11",
  md: "text-[15px] px-5 min-h-11",
  lg: "text-base px-6 min-h-12",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cx(buttonBase, buttonVariant[variant], buttonSize[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* -------------------------------------------------------------------- Card */

export function Card({ className, as: As = "section", ...props }: Omit<ComponentProps<"section">, "ref"> & { as?: "section" | "div" | "article" | "aside" }) {
  return <As className={cx("rounded-2xl border border-line bg-card", className)} {...props} />;
}

export function CardHeader({ title, sub, action, className, level = 2 }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <H className="text-lg font-bold leading-tight">{title}</H>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- Badge */

const toneClass: Record<Tone, string> = {
  neutral: "bg-sunken text-muted",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", className, children, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-semibold leading-6 whitespace-nowrap", toneClass[tone], className)} {...props}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Fields */

export const fieldClass =
  "w-full min-h-11 rounded-xl border border-line-strong bg-card px-3.5 text-[15px] text-ink transition-colors hover:border-subtle focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20";

export function Field({ label, hint, children, className, htmlFor }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(fieldClass, "min-h-24 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cx(fieldClass, "appearance-none ps-3.5 pe-9", className)} {...props}>
        {children}
      </select>
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-muted">
        <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cx("group flex min-h-11 cursor-pointer items-center gap-3 text-[15px]", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] border-line-strong bg-card text-white transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-3 peer-focus-visible:ring-accent/40 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      <span className="leading-snug">{label}</span>
    </label>
  );
}

export function Radio({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cx("flex min-h-11 cursor-pointer items-center gap-3 text-[15px]", className)}>
      <input type="radio" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-card transition-colors peer-checked:border-accent peer-checked:[&>span]:scale-100 peer-focus-visible:ring-3 peer-focus-visible:ring-accent/40"
      >
        <span className="size-2.5 scale-0 rounded-full bg-accent transition-transform" />
      </span>
      <span className="leading-snug">{label}</span>
    </label>
  );
}

/** Large selectable tile used for radio choices (location, payment method, plan). */
export function ChoiceTile({
  checked,
  onSelect,
  children,
  className,
  name,
  value,
}: {
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  name: string;
  value: string;
}) {
  return (
    <label
      className={cx(
        "relative flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-[15px] transition-colors has-focus-visible:ring-3 has-focus-visible:ring-accent/40",
        checked ? "border-accent bg-accent-soft font-semibold text-accent-ink" : "border-line-strong bg-card hover:bg-sunken",
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      {children}
    </label>
  );
}

/* --------------------------------------------------------------- Segmented */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("inline-flex rounded-xl border border-line-strong bg-card p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-10 rounded-[10px] px-3 text-sm font-semibold whitespace-nowrap transition-colors sm:px-4",
            value === o.value ? "bg-contrast text-on-contrast" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- Tabs */

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cx("no-scrollbar flex gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            "relative min-h-11 shrink-0 px-4 text-[15px] font-semibold transition-colors",
            value === t.value ? "text-ink after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent" : "text-muted hover:text-ink",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- Stars */

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  if (!value) return <span className={cx("text-sm text-muted", className)}>חדש בפלטפורמה</span>;
  return (
    <span className={cx("inline-flex items-center gap-1 text-sm", className)}>
      <Star aria-hidden className="size-4 fill-star text-star" />
      <span className="font-bold tabular">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({count} ביקורות מאומתות)</span>}
      <span className="sr-only">דירוג {value.toFixed(1)} מתוך 5</span>
    </span>
  );
}

export function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} כוכבים`}
          onClick={() => onChange(n)}
          className="grid size-11 place-items-center rounded-lg hover:bg-sunken"
        >
          <Star className={cx("size-6 transition-colors", n <= value ? "fill-star text-star" : "text-line-strong")} strokeWidth={1.6} />
        </button>
      ))}
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-bold tabular">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line" role="presentation">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Status track
   The signature element: every booking's five-step journey, the same on the
   customer, operator and admin sides. */

export function StatusTrack({ step, cancelled, className, compact }: { step: number; cancelled?: boolean; className?: string; compact?: boolean }) {
  const currentLabel = cancelled ? "בוטלה" : statusSteps[Math.min(step, 4)];
  return (
    <div className={className}>
      <ol className="grid grid-cols-5 gap-1.5" aria-label={`סטטוס ההזמנה: ${currentLabel}`}>
        {statusSteps.map((label, i) => {
          const done = !cancelled && (i < step || step >= 5);
          const current = !cancelled && i === step && step < 5;
          return (
            <li key={label} className="flex flex-col gap-2" aria-current={current ? "step" : undefined}>
              <span
                className={cx(
                  "h-1.5 rounded-full transition-colors",
                  cancelled ? "bg-line" : done ? "bg-accent" : current ? "bg-accent/45" : "bg-line",
                )}
              />
              {!compact && (
                <span className={cx("text-[12px] leading-tight sm:text-[13px]", current ? "font-bold text-ink" : done ? "text-ink" : "text-subtle")}>{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* --------------------------------------------------------------- Misc */

/** A single figure. With `href` the whole tile is the link to where that figure is managed. */
export function Stat({ label, value, sub, highlight, subTone, href }: { label: string; value: ReactNode; sub?: ReactNode; highlight?: boolean; subTone?: "success" | "muted"; href?: string }) {
  const className = cx(
    "block rounded-2xl border p-5",
    highlight ? "border-transparent bg-accent text-white" : "border-line bg-card",
    href && "transition-colors focus-visible:outline-offset-4",
    href && (highlight ? "hover:bg-accent-hover" : "hover:border-line-strong"),
  );
  const body = (
    <>
      <p className={cx("text-sm", highlight ? "text-white/85" : "text-muted")}>{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight tabular">{value}</p>
      {sub && <p className={cx("mt-2 text-[13px]", highlight ? "text-white/85" : subTone === "success" ? "font-semibold text-success" : "text-muted")}>{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Marks a section that still runs on illustrative rows rather than real tables. */
export function SampleBadge() {
  return <Badge className="ms-2 align-middle">נתוני דוגמה</Badge>;
}

export function PageTitle({ title, sub, action, className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[34px]">{title}</h1>
        {sub && <p className="mt-1.5 text-[15px] text-muted sm:text-base">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-line", className)} />;
}

export function DefinitionRow({ term, children, strong }: { term: ReactNode; children: ReactNode; strong?: boolean }) {
  return (
    <div className={cx("flex items-baseline justify-between gap-3 py-1 text-[15px]", strong && "text-base font-bold")}>
      <dt className={strong ? "" : "text-muted"}>{term}</dt>
      <dd className="text-end font-semibold tabular">{children}</dd>
    </div>
  );
}
