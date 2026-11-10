"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarCheck, Eye, EyeOff, Loader2, Shield, Store } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { useStore } from "@/lib/store";
import { Button, Card, Field, Input, Tabs } from "@/components/ui";

type Mode = "signin" | "signup" | "reset";

const reasons: Record<string, { icon: typeof Store; text: string }> = {
  operator: { icon: Store, text: "כדי לנהל את העסק שלכם כמפעיל" },
  booking: { icon: CalendarCheck, text: "כדי לשלוח בקשה ולעקוב אחרי ההזמנה" },
  admin: { icon: Shield, text: "כניסה למערכת הניהול" },
};

/** Supabase auth errors in plain Hebrew. */
function explain(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "האימייל או הסיסמה לא נכונים.";
  if (m.includes("already registered") || m.includes("already been registered")) return "כבר יש חשבון עם האימייל הזה. עברו ללשונית כניסה.";
  if (m.includes("password") && (m.includes("short") || m.includes("at least") || m.includes("weak"))) return "הסיסמה קצרה מדי. צריך לפחות 8 תווים.";
  if (m.includes("rate limit") || m.includes("too many")) return "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.";
  if (m.includes("email") && m.includes("invalid")) return "כתובת האימייל לא תקינה.";
  return "משהו השתבש. נסו שוב בעוד רגע.";
}

export function LoginView() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useStore((s) => s.toast);
  const next = params.get("next") || "/bookings";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/bookings";
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") ? "הכניסה לא הושלמה. נסו שוב." : null);
  const [resetSent, setResetSent] = useState(false);

  const reason = safeNext.startsWith("/admin") ? reasons.admin : safeNext.startsWith("/operator") ? reasons.operator : safeNext.startsWith("/book") ? reasons.booking : null;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("כתובת האימייל לא תקינה.");
    if (mode !== "reset" && form.password.length < 8) return setError("הסיסמה צריכה להיות באורך 8 תווים לפחות.");
    if (mode === "signup" && !form.name.trim()) return setError("הוסיפו שם מלא.");

    setBusy(true);
    const db = supabaseBrowser();
    try {
      if (mode === "reset") {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset")}`;
        const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) return setError(explain(error.message));
        setResetSent(true);
        return;
      }
      const { error } =
        mode === "signin"
          ? await db.auth.signInWithPassword({ email, password: form.password })
          : await db.auth.signUp({ email, password: form.password, options: { data: { full_name: form.name.trim() } } });
      if (error) return setError(explain(error.message));
      toast(mode === "signin" ? "נכנסתם בהצלחה" : "החשבון נוצר. ברוכים הבאים!");
      router.push(safeNext);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 pt-12 pb-10 sm:pt-16">
      <Card className="p-6 shadow-card sm:p-8">
        <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-accent text-2xl font-extrabold text-white">
          ה
        </span>
        <h1 className="mt-5 text-[28px] leading-tight font-extrabold tracking-tight">{mode === "reset" ? "איפוס סיסמה" : mode === "signup" ? "הרשמה להפעילו" : "כניסה להפעילו"}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {reason ? (
            <span className="flex items-center gap-2">
              <reason.icon aria-hidden className="size-4 shrink-0 text-accent-ink" />
              {reason.text}
            </span>
          ) : mode === "reset" ? (
            "נשלח לכם קישור לבחירת סיסמה חדשה."
          ) : (
            "כדי לשלוח בקשות, לעקוב אחרי הזמנות או לנהל עסק כמפעיל."
          )}
        </p>

        {!supabaseConfigured ? (
          <p className="mt-6 rounded-xl bg-warning-soft px-4 py-3 text-[15px] text-warning">הכניסה תיפתח ברגע שמסד הנתונים יחובר.</p>
        ) : resetSent ? (
          <div role="status" className="mt-6 rounded-xl bg-success-soft px-4 py-4 text-[15px] leading-relaxed text-success">
            אם יש חשבון עם {form.email}, נשלח אליו קישור לאיפוס הסיסמה. כדאי לבדוק גם בתיקיית הספאם.
          </div>
        ) : (
          <>
            {mode !== "reset" && (
              <Tabs
                className="mt-6"
                label="כניסה או הרשמה"
                value={mode}
                onChange={(m) => {
                  setMode(m);
                  setError(null);
                }}
                tabs={[
                  { value: "signin", label: "כניסה" },
                  { value: "signup", label: "הרשמה" },
                ]}
              />
            )}
            <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
              {mode === "signup" && (
                <Field label="שם מלא" htmlFor="l-name">
                  <Input id="l-name" autoComplete="name" value={form.name} onChange={set("name")} />
                </Field>
              )}
              <Field label="אימייל" htmlFor="l-email">
                <Input id="l-email" type="email" dir="ltr" className="text-end" autoComplete={mode === "signup" ? "email" : "username"} inputMode="email" value={form.email} onChange={set("email")} />
              </Field>
              {mode !== "reset" && (
                <Field label="סיסמה" htmlFor="l-password" hint={mode === "signup" ? "לפחות 8 תווים" : undefined}>
                  <div className="relative">
                    <Input
                      id="l-password"
                      type={show ? "text" : "password"}
                      dir="ltr"
                      className="pe-12 text-end"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      value={form.password}
                      onChange={set("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-xl text-muted hover:text-ink"
                      aria-label={show ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
                      aria-pressed={show}
                    >
                      {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </Field>
              )}

              {error && (
                <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] font-semibold text-danger">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" disabled={busy}>
                {busy && <Loader2 aria-hidden className="size-5 animate-spin" />}
                {mode === "signin" ? "כניסה" : mode === "signup" ? "יצירת חשבון" : "שליחת קישור לאיפוס"}
              </Button>

              {mode === "signin" && (
                <Button variant="link" className="self-center" onClick={() => { setMode("reset"); setError(null); }}>
                  שכחתי סיסמה
                </Button>
              )}
              {mode === "reset" && (
                <Button variant="link" className="self-center" onClick={() => { setMode("signin"); setError(null); }}>
                  חזרה לכניסה
                </Button>
              )}
            </form>
          </>
        )}

        {mode === "signup" && (
          <p className="mt-5 text-[13px] leading-relaxed text-muted">
            בהרשמה אתם מסכימים ל
            <Link href="/info/terms" className="font-semibold text-accent-ink hover:underline">
              תנאי השימוש
            </Link>{" "}
            ול
            <Link href="/info/privacy" className="font-semibold text-accent-ink hover:underline">
              מדיניות הפרטיות
            </Link>
            .
          </p>
        )}
      </Card>
      <p className="mt-6 text-center text-sm text-muted">
        מחפשים בלי להתחבר?{" "}
        <Link href="/search" className="font-semibold text-accent-ink hover:underline">
          לחיפוש הפעלות
        </Link>
      </p>
    </div>
  );
}
