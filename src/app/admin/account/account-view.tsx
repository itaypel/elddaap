"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/lib/data";
import { updateUsername } from "@/app/actions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { useAction } from "@/components/use-action";
import { Button, Card, CardHeader, Field, Input, PageTitle } from "@/components/ui";

export function AccountView({ profile }: { profile: Profile }) {
  const toast = useStore((s) => s.toast);
  const [run, savingName] = useAction();
  const [username, setUsername] = useState(profile.username ?? "");
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (pw.next.length < 8) return setPwError("הסיסמה צריכה להיות באורך 8 תווים לפחות.");
    if (pw.next !== pw.confirm) return setPwError("שתי הסיסמאות לא זהות.");
    setPwBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw.next });
    setPwBusy(false);
    if (error) return setPwError(error.message.toLowerCase().includes("different") ? "הסיסמה החדשה זהה לישנה." : "לא הצלחנו לעדכן את הסיסמה. נסו שוב.");
    setPw({ next: "", confirm: "" });
    toast("הסיסמה עודכנה");
  };

  return (
    <>
      <PageTitle title="החשבון שלי" sub="פרטי הכניסה של מנהל המערכת. יש מנהל אחד בלבד." />
      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="p-5">
          <CardHeader title="שם משתמש" sub="איתו נכנסים לאתר ולמערכת הניהול" />
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => updateUsername(username), { success: "שם המשתמש עודכן" });
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Input id="a-user" aria-label="שם משתמש" aria-describedby="a-user-hint" dir="ltr" className="text-end" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} />
              <p id="a-user-hint" className="text-[13px] text-muted">3–30 תווים באנגלית, ספרות, נקודה, מקף או קו תחתון</p>
            </div>
            <Button type="submit" className="self-start" disabled={savingName || username.trim().toLowerCase() === (profile.username ?? "")}>
              שמירת שם המשתמש
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <CardHeader title="סיסמה" sub="אחרי השינוי נכנסים עם הסיסמה החדשה" />
          <form className="mt-4 flex flex-col gap-4" onSubmit={savePassword} noValidate>
            {/* Hidden username helps password managers save the right pair. */}
            <input type="text" autoComplete="username" value={profile.username ?? ""} readOnly hidden />
            <Field label="סיסמה חדשה" htmlFor="a-pw" hint="לפחות 8 תווים">
              <Input id="a-pw" type="password" dir="ltr" className="text-end" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <Field label="שוב, לאימות" htmlFor="a-pw2">
              <Input id="a-pw2" type="password" dir="ltr" className="text-end" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Field>
            {pwError && (
              <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] font-semibold text-danger">
                {pwError}
              </p>
            )}
            <Button type="submit" className="self-start" disabled={pwBusy}>
              {pwBusy && <Loader2 aria-hidden className="size-4 animate-spin" />}
              עדכון סיסמה
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
