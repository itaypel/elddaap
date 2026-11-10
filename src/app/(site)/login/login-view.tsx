"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarCheck, Eye, EyeOff, Loader2, Shield, Store } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { useStore } from "@/lib/store";
import { Button, Card, Field, Input, Tabs } from "@/components/ui";

type Mode = "signin" | "signup";

export const USERNAME_DOMAIN = "users.elddaap.app";
const usernameOk = (u: string) => /^[a-z0-9][a-z0-9._-]{2,29}$/.test(u);

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
  const [form, setForm] = useState({ name: "", user: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") ? "הכניסה לא הושלמה. נסו שוב." : null);

  const reason = safeNext.startsWith("/admin") ? reasons.admin : safeNext.startsWith("/operator") ? reasons.operator : safeNext.startsWith("/book") ? reasons.booking : null;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = form.user.trim().toLowerCase();
    if (!user) return setError("הוסיפו שם משתמש.");
    if (mode === "signup" && !form.name.trim()) return setError("הוסיפו שם מלא.");
    if (mode === "signup" && !usernameOk(user)) return setError("שם משתמש: 3–30 תווים באנגלית, ספרות, נקודה, מקף או קו תחתון.");
    if (form.password.length < 8) return setError("הסיסמה צריכה להיות באורך 8 תווים לפחות.");

    setBusy(true);
    const db = supabaseBrowser();
    try {
      if (mode === "signin") {
        // Accept a username or, for older accounts, an email address.
        let email = user;
        if (!user.includes("@")) {
          const { data } = await db.rpc("login_email", { p_username: user });
          if (!data) return setError("שם המשתמש או הסיסמה לא נכונים.");
          email = data as string;
        }
        const { error } = await db.auth.signInWithPassword({ email, password: form.password });
        if (error) return setError(error.message.toLowerCase().includes("invalid login") ? "שם המשתמש או הסיסמה לא נכונים." : explain(error.message));
      } else {
        const { data: taken } = await db.rpc("login_email", { p_username: user });
        if (taken) return setError("שם המשתמש הזה תפוס. בחרו שם אחר.");
        const { error } = await db.auth.signUp({
          email: `${user}@${USERNAME_DOMAIN}`,
          password: form.password,
          options: { data: { full_name: form.name.trim(), username: user } },
        });
        if (error) return setError(explain(error.message));
      }
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
        <h1 className="mt-5 text-[28px] leading-tight font-extrabold tracking-tight">{mode === "signup" ? "הרשמה להפעילו" : "כניסה להפעילו"}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {reason ? (
            <span className="flex items-center gap-2">
              <reason.icon aria-hidden className="size-4 shrink-0 text-accent-ink" />
              {reason.text}
            </span>
          ) : (
            "כדי לשלוח בקשות, לעקוב אחרי הזמנות או לנהל עסק כמפעיל."
          )}
        </p>

        {!supabaseConfigured ? (
          <p className="mt-6 rounded-xl bg-warning-soft px-4 py-3 text-[15px] text-warning">הכניסה תיפתח ברגע שמסד הנתונים יחובר.</p>
        ) : (
          <>
            {(
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
              <Field label="שם משתמש" htmlFor="l-user" hint={mode === "signup" ? "באנגלית, למשל dana.levi" : undefined}>
                <Input id="l-user" dir="ltr" className="text-end" autoComplete="username" autoCapitalize="none" spellCheck={false} value={form.user} onChange={set("user")} />
              </Field>
              {(
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
                {mode === "signin" ? "כניסה" : "יצירת חשבון"}
              </Button>

              {mode === "signin" && <p className="text-center text-[13px] text-muted">שכחתם סיסמה? פנו למנהל האתר.</p>}
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
