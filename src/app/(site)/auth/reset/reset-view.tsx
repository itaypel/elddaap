"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { Button, Card, Field, Input } from "@/components/ui";

export function ResetView() {
  const router = useRouter();
  const toast = useStore((s) => s.toast);
  const signedIn = useStore((s) => s.session.status === "signedIn");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("הסיסמה צריכה להיות באורך 8 תווים לפחות.");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError("לא הצלחנו לעדכן את הסיסמה. בקשו קישור חדש ונסו שוב.");
    toast("הסיסמה עודכנה");
    router.push("/bookings");
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-12 pb-10 sm:pt-16">
      <Card className="p-6 shadow-card sm:p-8">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">בחירת סיסמה חדשה</h1>
        {!signedIn ? (
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            הקישור פג או כבר נוצל.{" "}
            <Link href="/login" className="font-semibold text-accent-ink hover:underline">
              בקשו קישור חדש
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
            <Field label="סיסמה חדשה" htmlFor="r-password" hint="לפחות 8 תווים">
              <Input id="r-password" type="password" dir="ltr" className="text-end" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && (
              <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] font-semibold text-danger">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={busy}>
              {busy && <Loader2 aria-hidden className="size-5 animate-spin" />}
              שמירת הסיסמה
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
