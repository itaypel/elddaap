"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarCheck, Loader2, Store } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { Card } from "@/components/ui";

const reasons: Record<string, { icon: typeof Store; text: string }> = {
  operator: { icon: Store, text: "כדי לנהל את העסק שלכם כמפעיל" },
  booking: { icon: CalendarCheck, text: "כדי לשלוח בקשה ולעקוב אחרי ההזמנה" },
};

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginView() {
  const params = useSearchParams();
  const next = params.get("next") || "/bookings";
  const failed = params.get("error");
  const [busy, setBusy] = useState(false);
  const reason = next.startsWith("/operator") ? reasons.operator : next.startsWith("/book") || next.startsWith("/bookings") ? reasons.booking : null;

  const signIn = async () => {
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) setBusy(false);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 pt-12 pb-10 sm:pt-20">
      <Card className="p-6 shadow-card sm:p-8">
        <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-accent text-2xl font-extrabold text-white">
          ה
        </span>
        <h1 className="mt-5 text-[28px] leading-tight font-extrabold tracking-tight">כניסה להפעילו</h1>
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

        {failed && (
          <p role="alert" className="mt-5 rounded-xl bg-danger-soft px-4 py-3 text-[15px] font-semibold text-danger">
            הכניסה לא הושלמה. נסו שוב, ואם זה חוזר, כתבו לנו.
          </p>
        )}

        {supabaseConfigured ? (
          <button
            type="button"
            onClick={signIn}
            disabled={busy}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-card px-5 text-base font-semibold text-ink transition-colors hover:bg-sunken disabled:opacity-60"
          >
            {busy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <GoogleMark />}
            {busy ? "מעבירים אתכם ל־Google…" : "המשך עם Google"}
          </button>
        ) : (
          <p className="mt-6 rounded-xl bg-warning-soft px-4 py-3 text-[15px] text-warning">הכניסה תיפתח ברגע שמסד הנתונים יחובר.</p>
        )}

        <p className="mt-5 text-[13px] leading-relaxed text-muted">
          בכניסה אתם מסכימים ל
          <Link href="/info/terms" className="font-semibold text-accent-ink hover:underline">
            תנאי השימוש
          </Link>{" "}
          ול
          <Link href="/info/privacy" className="font-semibold text-accent-ink hover:underline">
            מדיניות הפרטיות
          </Link>
          . אנחנו משתמשים רק בשם ובאימייל מחשבון Google.
        </p>
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
