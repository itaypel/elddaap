"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Check, CircleCheckBig, Eye, EyeOff, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { categories, durationText, locationTypes, regions } from "@/lib/data";
import { DOCS_BUCKET, randomName } from "@/lib/photos";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { useStore } from "@/lib/store";
import { createOperator } from "@/app/actions";
import { Logo } from "@/components/brand";
import { PhotoManager, type PhotoSet } from "@/components/photo-manager";
import { Badge, Button, ButtonLink, Card, Checkbox, ChoiceTile, Field, Input, Select, Textarea, cx } from "@/components/ui";

type StepId = "account" | "business" | "photos" | "verify" | "area" | "packages" | "bank" | "plan";

const stepInfo: Record<StepId, { title: string; sub: string }> = {
  account: { title: "פתיחת חשבון", sub: "פרטי בעל העסק וכניסה" },
  business: { title: "פרטי העסק", sub: "שם, קטגוריה ופרטי קשר" },
  photos: { title: "תמונות", sub: "לוגו ותמונות מהפעילות" },
  verify: { title: "אימות העסק", sub: "מספר עוסק, ביטוח ואישורים" },
  area: { title: "אזורי שירות וגילאים", sub: "לאן מגיעים ולאיזה גיל" },
  packages: { title: "חבילות ומחירים", sub: "מה כלול וכמה זה עולה" },
  bank: { title: "קבלת תשלומים", sub: "חשבון בנק להעברות" },
  plan: { title: "בחירת מסלול", sub: "בסיסי או מתקדם" },
};

const docs = [
  { id: "insurance", title: "ביטוח צד ג׳ בתוקף", sub: "פוליסה שמכסה הפעלות לילדים, עם תאריך תוקף", required: true },
  { id: "noOffense", title: "אישור היעדר עבירות מין", sub: "לכל איש צוות שעובד עם ילדים. מבקשים במשטרה או באתר gov.il", required: true },
  { id: "license", title: "רישיונות לפי סוג הפעילות", sub: "לדוגמה: תקן למתקנים מתנפחים, רישיון לבעלי חיים, הסמכת מדריך", required: false },
  { id: "business", title: "תעודת עוסק או אישור ניהול ספרים", sub: "כדי שנוכל להעביר לכם תשלומים ולהפיק חשבוניות", required: true },
];

const commitments = [
  "כל מי שמגיע מטעמי לאירועים עבר בדיקת היעדר עבירות מין, והאישור שלו בתוקף.",
  "לא אפרסם תמונות שבהן מזוהים ילדים בלי הסכמה בכתב של ההורים או המוסד.",
  "אענה לבקשות הזמנה תוך 24 שעות ואעדכן את יומן הזמינות.",
];

const USERNAME_DOMAIN = "users.elddaap.app";
const usernameOk = (u: string) => /^[a-z0-9][a-z0-9._-]{2,29}$/.test(u);
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

/** Israeli mobile → "050-1234567", or null when it isn't one. Accepts +972 / spaces / dashes. */
function mobile(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("972")) d = `0${d.slice(3)}`;
  return /^05\d{8}$/.test(d) ? `${d.slice(0, 3)}-${d.slice(3)}` : null;
}

/** Supabase auth errors in plain Hebrew. */
function explainAuth(message: string) {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) return "שם המשתמש הזה תפוס. בחרו שם אחר.";
  if (m.includes("password") && (m.includes("short") || m.includes("at least") || m.includes("weak"))) return "הסיסמה קצרה מדי. צריך לפחות 8 תווים.";
  if (m.includes("rate limit") || m.includes("too many")) return "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.";
  return "לא הצלחנו לפתוח את החשבון. נסו שוב בעוד רגע.";
}

const DOC_MAX = 10 * 1024 * 1024;

type Pkg = { name: string; duration: number; maxKids: string; price: string; includes: string };
type Account = { id: string; fullName: string; email: string; phone: string };

export function JoinView({ account }: { account: Account | null }) {
  const router = useRouter();
  const toast = useStore((s) => s.toast);
  const setSession = useStore((s) => s.setSession);
  const [submitting, start] = useTransition();
  const [ids] = useState<StepId[]>(() => [...(account ? [] : (["account"] as StepId[])), "business", "photos", "verify", "area", "packages", "bank", "plan"]);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [tried, setTried] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const cur = ids[step];

  const [uid, setUid] = useState<string | null>(account?.id ?? null);
  const [acct, setAcct] = useState({ name: "", user: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [acctError, setAcctError] = useState<string | null>(null);

  const [biz, setBiz] = useState({ name: "", cats: [] as string[], about: "", email: account?.email ?? "", phone: account?.phone ? (mobile(account.phone) ?? account.phone) : "" });
  const [media, setMedia] = useState<PhotoSet>({ logo: null, photos: [] });
  const [ver, setVer] = useState({ type: "licensed", displayName: "", taxId: "", owner: account?.fullName ?? "" });
  const [files, setFiles] = useState<Record<string, { name: string; path: string }>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [commits, setCommits] = useState<boolean[]>([false, false, false, false]);
  const [area, setArea] = useState({ regions: [] as string[], ageMin: "4", ageMax: "12", locs: ["home"] as string[] });
  const [pkgs, setPkgs] = useState<Pkg[]>([{ name: "", duration: 60, maxKids: "", price: "", includes: "" }]);
  const [bank, setBank] = useState({ bank: "", branch: "", account: "", holder: "" });
  const [plan, setPlan] = useState<"basic" | "pro">("basic");

  const errors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (cur === "account") {
      if (!acct.name.trim()) e["a-name"] = "הוסיפו את השם המלא שלכם";
      if (!usernameOk(acct.user.trim().toLowerCase())) e["a-user"] = "3–30 תווים באנגלית, ספרות, נקודה, מקף או קו תחתון";
      if (!emailOk(acct.email)) e["a-email"] = "כתובת אימייל לא תקינה";
      if (!mobile(acct.phone)) e["a-phone"] = "מספר נייד ישראלי, למשל 050-1234567";
      if (acct.password.length < 8) e["a-password"] = "לפחות 8 תווים";
    }
    if (cur === "business") {
      if (!biz.name.trim()) e["j-name"] = "הוסיפו את שם העסק";
      if (!biz.cats.length) e["j-cats"] = "בחרו לפחות קטגוריה אחת";
      if (!emailOk(biz.email)) e["j-email"] = "כתובת אימייל לא תקינה";
      if (!mobile(biz.phone)) e["j-phone"] = "מספר נייד ישראלי, למשל 050-1234567";
    }
    if (cur === "photos") {
      if (!media.photos.length) e["j-photos"] = "הוסיפו לפחות תמונה אחת מהפעילות";
    }
    if (cur === "verify") {
      if (!(ver.displayName || biz.name).trim()) e["j-display"] = "הוסיפו שם כפי שיופיע באתר";
      if (!/^\d{8,9}$/.test(ver.taxId)) e["j-tax"] = "8 או 9 ספרות";
      if (!ver.owner.trim()) e["j-owner"] = "הוסיפו את שם בעל העסק";
      docs.filter((d) => d.required && !files[d.id]).forEach((d) => (e[`j-doc-${d.id}`] = "מסמך חובה"));
      if (!commits.every(Boolean)) e["j-commit"] = "צריך לאשר את כל ההתחייבויות";
    }
    if (cur === "area") {
      if (!area.regions.length) e["j-regions"] = "בחרו לפחות אזור אחד";
      if (Number(area.ageMin) > Number(area.ageMax)) e["j-age"] = "גיל ההתחלה גבוה מגיל הסיום";
    }
    if (cur === "packages") {
      pkgs.forEach((p, i) => {
        if (!p.name.trim()) e[`j-pkg-${i}-name`] = "שם החבילה";
        if (!Number(p.price)) e[`j-pkg-${i}-price`] = "מחיר";
      });
    }
    if (cur === "bank") {
      if (!bank.bank) e["j-bank"] = "בחרו בנק";
      if (!/^\d{3}$/.test(bank.branch)) e["j-branch"] = "3 ספרות";
      if (!/^\d{4,9}$/.test(bank.account)) e["j-account"] = "מספר חשבון";
      if (!bank.holder.trim()) e["j-holder"] = "שם בעל החשבון";
    }
    return e;
  };
  const errs = tried ? errors() : {};
  const err = (k: string) => (errs[k] ? <p id={`${k}-err`} className="text-[13px] font-semibold text-danger">{errs[k]}</p> : null);
  const inv = (k: string) => (errs[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  const go = (i: number) => {
    setStep(i);
    top.current?.scrollIntoView({ behavior: "smooth" });
  };

  /** Creates the owner's account (same pattern as /login) and continues the wizard signed in. */
  const createAccount = async () => {
    setAcctError(null);
    const user = acct.user.trim().toLowerCase();
    const phone = mobile(acct.phone)!;
    const email = acct.email.trim().toLowerCase();
    const fullName = acct.name.trim();
    setCreating(true);
    try {
      const db = supabaseBrowser();
      const { data: taken } = await db.rpc("login_email", { p_username: user });
      if (taken) {
        setAcctError("שם המשתמש הזה תפוס. בחרו שם אחר.");
        document.getElementById("a-user")?.focus();
        return;
      }
      const { data, error } = await db.auth.signUp({
        email: `${user}@${USERNAME_DOMAIN}`,
        password: acct.password,
        options: { data: { full_name: fullName, username: user, email, phone } },
      });
      if (error) return setAcctError(explainAuth(error.message));
      if (!data.session || !data.user) return setAcctError("החשבון נוצר, אבל לא הצלחנו להיכנס אליו. היכנסו דרך עמוד הכניסה כדי להמשיך.");
      setUid(data.user.id);
      setBiz((b) => ({ ...b, email: b.email || email, phone: b.phone || phone }));
      setVer((v) => ({ ...v, owner: v.owner || fullName }));
      setSession({ status: "signedIn", userId: data.user.id, name: fullName, email });
      toast("החשבון נפתח. ממשיכים לפרטי העסק");
      router.refresh();
      go(step + 1);
    } finally {
      setCreating(false);
    }
  };

  const uploadDoc = async (docId: string, file: File | undefined) => {
    if (!file || !uid) return;
    if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) return toast("אפשר להעלות PDF או תמונה.", "danger");
    if (file.size > DOC_MAX) return toast("הקובץ גדול מ־10MB.", "danger");
    setUploadingDoc(docId);
    const ext = (file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${uid}/${randomName(docId, ext)}`;
    const { error } = await supabaseBrowser().storage.from(DOCS_BUCKET).upload(path, file, { contentType: file.type });
    setUploadingDoc(null);
    if (error) return toast("העלאת המסמך נכשלה. נסו שוב.", "danger");
    const prev = files[docId]?.path;
    setFiles((f) => ({ ...f, [docId]: { name: file.name, path } }));
    if (prev) void supabaseBrowser().storage.from(DOCS_BUCKET).remove([prev]);
  };

  const next = () => {
    const e = errors();
    if (Object.keys(e).length) {
      setTried(true);
      setTimeout(() => document.getElementById(Object.keys(e)[0])?.focus(), 0);
      return;
    }
    setTried(false);
    if (cur === "account") {
      void createAccount();
      return;
    }
    if (step === ids.length - 1) {
      start(async () => {
        const phone = mobile(biz.phone)!;
        const res = await createOperator({
          name: biz.name.trim(),
          categories: biz.cats,
          about: biz.about.trim(),
          email: biz.email.trim().toLowerCase(),
          phone,
          logo: media.logo,
          photos: media.photos,
          regions: area.regions,
          ageMin: Number(area.ageMin) || 3,
          ageMax: Number(area.ageMax) || 12,
          locations: area.locs.length ? area.locs : ["home"],
          packages: pkgs.map((p) => ({ name: p.name.trim(), duration: p.duration, maxKids: p.maxKids, price: Number(p.price), includes: p.includes.trim() })),
          business: { type: ver.type, displayName: (ver.displayName || biz.name).trim(), taxId: ver.taxId, owner: ver.owner.trim(), phone, email: biz.email.trim().toLowerCase(), plan },
          bank,
          documents: docs.map((d) => ({
            id: d.id,
            name: d.title,
            file: files[d.id]?.name ?? null,
            path: files[d.id]?.path ?? null,
            state: files[d.id] ? "ok" : d.required ? "missing" : "optional",
            note: files[d.id]?.name ?? "",
          })),
        });
        if (!res.ok) {
          toast(res.error, "danger");
          return;
        }
        setSession({ operator: { id: "", slug: res.data ?? "", status: "pending" } });
        setDone(true);
        toast("הפרופיל נשלח לבדיקה");
        top.current?.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }
    go(step + 1);
  };

  // Once the account exists, its step is behind us for good.
  const firstEditable = uid && ids[0] === "account" ? 1 : 0;
  const busy = submitting || creating || uploadingDoc !== null;

  return (
    <>
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo badge="למפעילים" />
          <Link href="/info/contact" className="flex min-h-11 items-center px-2 text-[15px] font-semibold text-accent-ink hover:underline">
            שאלות? דברו איתנו
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6" ref={top}>
        {done ? (
          <div className="mx-auto max-w-lg py-12 text-center">
            {media.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.logo} alt="" className="mx-auto size-20 rounded-2xl object-cover" />
            ) : (
              <CircleCheckBig aria-hidden className="mx-auto size-14 text-success" strokeWidth={1.6} />
            )}
            <h1 className="mt-4 text-[28px] font-extrabold tracking-tight">הפרופיל נשלח לבדיקה</h1>
            <p className="mt-2 text-[17px] leading-relaxed text-muted">
              הצוות שלנו בודק את המסמכים, בדרך כלל תוך 2 ימי עסקים. נעדכן אתכם בוואטסאפ ברגע שהפרופיל של {biz.name || "העסק"} יעלה לאתר.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
              <ButtonLink href="/" variant="secondary">
                לאתר
              </ButtonLink>
              <ButtonLink href="/operator">לאזור המפעילים</ButtonLink>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">הצטרפות כמפעיל</h1>
            <p className="mt-1.5 text-[15px] text-muted sm:text-base">בערך 15 דקות. אחרי בדיקה של הצוות הפרופיל שלכם עולה לאתר.</p>

            <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr] lg:items-start">
              <Card as="aside" className="p-2 lg:sticky lg:top-6" aria-label="שלבי ההצטרפות">
                <ol className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
                  {ids.map((id, i) => {
                    const s = stepInfo[id];
                    const state = i < step ? "done" : i === step ? "current" : "todo";
                    return (
                      <li key={id} aria-current={state === "current" ? "step" : undefined} className="shrink-0">
                        <button
                          type="button"
                          disabled={i > step || i < firstEditable || busy}
                          onClick={() => i < step && (setTried(false), setStep(i))}
                          className={cx("flex w-full items-center gap-3 rounded-xl p-2.5 text-start disabled:cursor-default", state === "current" && "bg-accent-soft")}
                        >
                          <span
                            className={cx(
                              "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold tabular",
                              state === "done" ? "bg-success text-white" : state === "current" ? "bg-accent text-white" : "bg-sunken text-muted",
                            )}
                          >
                            {state === "done" ? <Check aria-label="הושלם" className="size-4" strokeWidth={3} /> : i + 1}
                          </span>
                          <span className="hidden lg:block">
                            <span className={cx("block text-[15px] font-bold", state === "current" && "text-accent-ink")}>{s.title}</span>
                            <span className="block text-[13px] text-muted">{s.sub}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </Card>

              <div className="flex flex-col gap-4">
                <Card className="p-5 sm:p-6">
                  <p className="text-sm font-semibold text-accent-ink">
                    שלב {step + 1} מתוך {ids.length}
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold">{stepInfo[cur].title}</h2>

                  {cur === "account" && (
                    <div className="mt-2">
                      <p className="text-[15px] text-muted">חשבון עסקי חדש. איתו נכנסים לאזור המפעילים, מנהלים הזמנות ומקבלים תשלומים.</p>
                      {!supabaseConfigured ? (
                        <p className="mt-5 rounded-xl bg-warning-soft px-4 py-3 text-[15px] text-warning">ההרשמה תיפתח ברגע שמסד הנתונים יחובר.</p>
                      ) : (
                        <form
                          noValidate
                          onSubmit={(e) => {
                            e.preventDefault();
                            next();
                          }}
                          className="mt-5 grid gap-4 sm:grid-cols-2"
                        >
                          <Field label="שם מלא של בעל העסק" htmlFor="a-name">
                            <Input id="a-name" autoComplete="name" value={acct.name} onChange={(e) => setAcct({ ...acct, name: e.target.value })} {...inv("a-name")} />
                            {err("a-name")}
                          </Field>
                          <Field label="שם משתמש לכניסה" htmlFor="a-user" hint="באנגלית, למשל water.battle">
                            <Input
                              id="a-user"
                              dir="ltr"
                              className="text-end"
                              autoComplete="username"
                              autoCapitalize="none"
                              spellCheck={false}
                              value={acct.user}
                              onChange={(e) => setAcct({ ...acct, user: e.target.value })}
                              {...inv("a-user")}
                            />
                            {err("a-user")}
                          </Field>
                          <Field label="אימייל" htmlFor="a-email">
                            <Input id="a-email" type="email" dir="ltr" className="text-end" autoComplete="email" value={acct.email} onChange={(e) => setAcct({ ...acct, email: e.target.value })} {...inv("a-email")} />
                            {err("a-email")}
                          </Field>
                          <Field label="טלפון נייד" htmlFor="a-phone">
                            <Input
                              id="a-phone"
                              type="tel"
                              dir="ltr"
                              className="text-end"
                              autoComplete="tel"
                              placeholder="050-1234567"
                              value={acct.phone}
                              onChange={(e) => setAcct({ ...acct, phone: e.target.value })}
                              onBlur={() => mobile(acct.phone) && setAcct((a) => ({ ...a, phone: mobile(a.phone)! }))}
                              {...inv("a-phone")}
                            />
                            {err("a-phone")}
                          </Field>
                          <Field label="סיסמה" htmlFor="a-password" hint="לפחות 8 תווים" className="sm:col-span-2">
                            <div className="relative sm:max-w-[calc(50%-0.5rem)]">
                              <Input
                                id="a-password"
                                type={showPw ? "text" : "password"}
                                dir="ltr"
                                className="pe-12 text-end"
                                autoComplete="new-password"
                                value={acct.password}
                                onChange={(e) => setAcct({ ...acct, password: e.target.value })}
                                {...inv("a-password")}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPw((v) => !v)}
                                className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-xl text-muted hover:text-ink"
                                aria-label={showPw ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
                                aria-pressed={showPw}
                              >
                                {showPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                              </button>
                            </div>
                            {err("a-password")}
                          </Field>
                          {acctError && (
                            <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] font-semibold text-danger sm:col-span-2">
                              {acctError}
                            </p>
                          )}
                          <button type="submit" hidden aria-hidden tabIndex={-1} />
                          <p className="text-[13px] leading-relaxed text-muted sm:col-span-2">
                            בפתיחת החשבון אתם מסכימים ל
                            <Link href="/info/terms" target="_blank" className="font-semibold text-accent-ink hover:underline">
                              תנאי השימוש
                            </Link>{" "}
                            ול
                            <Link href="/info/privacy" target="_blank" className="font-semibold text-accent-ink hover:underline">
                              מדיניות הפרטיות
                            </Link>
                            .
                          </p>
                        </form>
                      )}
                      <p className="mt-5 border-t border-line pt-4 text-[15px] text-muted">
                        כבר יש לכם חשבון?{" "}
                        <Link href="/login?next=/operator/join" className="font-semibold text-accent-ink hover:underline">
                          כניסה
                        </Link>
                      </p>
                    </div>
                  )}

                  {cur === "business" && (
                    <div className="mt-5 flex flex-col gap-4">
                      <Field label="שם העסק" htmlFor="j-name">
                        <Input id="j-name" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} placeholder="למשל: Water Battle" {...inv("j-name")} />
                        {err("j-name")}
                      </Field>
                      <fieldset>
                        <legend className="mb-2 text-sm font-semibold">קטגוריה (עד 2)</legend>
                        <div id="j-cats" tabIndex={-1} className="flex flex-wrap gap-2">
                          {categories.map((c) => {
                            const on = biz.cats.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                aria-pressed={on}
                                disabled={!on && biz.cats.length >= 2}
                                onClick={() => setBiz({ ...biz, cats: on ? biz.cats.filter((x) => x !== c.id) : [...biz.cats, c.id] })}
                                className={cx("min-h-10 rounded-full border px-3.5 text-sm font-medium disabled:opacity-40", on ? "border-accent bg-accent-soft font-semibold text-accent-ink" : "border-line-strong hover:bg-sunken")}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                        {err("j-cats")}
                      </fieldset>
                      <Field label="תיאור קצר" htmlFor="j-about" hint="2–3 משפטים: מה עושים, למי זה מתאים ומה מיוחד">
                        <Textarea id="j-about" value={biz.about} onChange={(e) => setBiz({ ...biz, about: e.target.value })} />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="אימייל של העסק" htmlFor="j-email" hint="לעדכונים על הזמנות וחשבוניות">
                          <Input id="j-email" type="email" dir="ltr" className="text-end" autoComplete="email" value={biz.email} onChange={(e) => setBiz({ ...biz, email: e.target.value })} {...inv("j-email")} />
                          {err("j-email")}
                        </Field>
                        <Field label="טלפון נייד לבקשות הזמנה" htmlFor="j-phone" hint="נשלח אליו התראות בוואטסאפ">
                          <Input
                            id="j-phone"
                            type="tel"
                            dir="ltr"
                            className="text-end"
                            autoComplete="tel"
                            placeholder="050-1234567"
                            value={biz.phone}
                            onChange={(e) => setBiz({ ...biz, phone: e.target.value })}
                            onBlur={() => mobile(biz.phone) && setBiz((b) => ({ ...b, phone: mobile(b.phone)! }))}
                            {...inv("j-phone")}
                          />
                          {err("j-phone")}
                        </Field>
                      </div>
                    </div>
                  )}

                  {cur === "photos" && (
                    <div className="mt-2">
                      <p className="mb-5 text-[15px] text-muted">תמונות טובות הן הדבר הראשון שהורים רואים. העלו תמונות אמיתיות מהפעלות, באור טוב.</p>
                      {uid ? (
                        <PhotoManager
                          uid={uid}
                          value={media}
                          onChange={(next) => {
                            setMedia(next);
                            return true;
                          }}
                          galleryId="j-photos"
                          error={err("j-photos")}
                        />
                      ) : (
                        <p className="rounded-xl bg-warning-soft px-4 py-3 text-[15px] text-warning">כדי להעלות תמונות צריך להיות מחוברים.</p>
                      )}
                    </div>
                  )}

                  {cur === "verify" && (
                    <div className="mt-5 flex flex-col gap-5">
                      <fieldset>
                        <legend className="mb-2 text-sm font-semibold">סוג העסק</legend>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ["exempt", "עוסק פטור"],
                            ["licensed", "עוסק מורשה"],
                            ["ltd", "חברה בע״מ"],
                            ["nonprofit", "עמותה"],
                          ].map(([v, l]) => (
                            <ChoiceTile key={v} name="biztype" value={v} checked={ver.type === v} onSelect={() => setVer({ ...ver, type: v })}>
                              {l}
                            </ChoiceTile>
                          ))}
                        </div>
                      </fieldset>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="שם העסק כפי שיופיע באתר" htmlFor="j-display">
                          <Input id="j-display" value={ver.displayName || biz.name} onChange={(e) => setVer({ ...ver, displayName: e.target.value })} {...inv("j-display")} />
                          {err("j-display")}
                        </Field>
                        <Field label="מספר עוסק או ח.פ." htmlFor="j-tax">
                          <Input id="j-tax" inputMode="numeric" value={ver.taxId} onChange={(e) => setVer({ ...ver, taxId: e.target.value.replace(/\D/g, "").slice(0, 9) })} {...inv("j-tax")} />
                          {err("j-tax")}
                        </Field>
                        <Field label="שם בעל העסק" htmlFor="j-owner">
                          <Input id="j-owner" autoComplete="name" value={ver.owner} onChange={(e) => setVer({ ...ver, owner: e.target.value })} {...inv("j-owner")} />
                          {err("j-owner")}
                        </Field>
                      </div>
                    </div>
                  )}

                  {cur === "area" && (
                    <div className="mt-5 flex flex-col gap-5">
                      <fieldset>
                        <legend className="mb-2 text-sm font-semibold">לאן אתם מגיעים</legend>
                        <div id="j-regions" tabIndex={-1} className="flex flex-wrap gap-2">
                          {regions.map((r) => {
                            const on = area.regions.includes(r);
                            return (
                              <button
                                key={r}
                                type="button"
                                aria-pressed={on}
                                onClick={() => setArea({ ...area, regions: on ? area.regions.filter((x) => x !== r) : [...area.regions, r] })}
                                className={cx("min-h-10 rounded-full border px-3.5 text-sm font-medium", on ? "border-accent bg-accent-soft font-semibold text-accent-ink" : "border-line-strong hover:bg-sunken")}
                              >
                                {r}
                              </button>
                            );
                          })}
                        </div>
                        {err("j-regions")}
                      </fieldset>
                      <div className="grid max-w-sm grid-cols-2 gap-3">
                        <Field label="מגיל" htmlFor="j-age">
                          <Input id="j-age" inputMode="numeric" value={area.ageMin} onChange={(e) => setArea({ ...area, ageMin: e.target.value.replace(/\D/g, "") })} {...inv("j-age")} />
                        </Field>
                        <Field label="עד גיל" htmlFor="j-age-max">
                          <Input id="j-age-max" inputMode="numeric" value={area.ageMax} onChange={(e) => setArea({ ...area, ageMax: e.target.value.replace(/\D/g, "") })} />
                        </Field>
                        <div className="col-span-2">{err("j-age")}</div>
                      </div>
                      <fieldset>
                        <legend className="mb-1 text-sm font-semibold">איפה אפשר להפעיל</legend>
                        {locationTypes.map((l) => (
                          <Checkbox
                            key={l.id}
                            label={l.label}
                            checked={area.locs.includes(l.id)}
                            onChange={() => setArea({ ...area, locs: area.locs.includes(l.id) ? area.locs.filter((x) => x !== l.id) : [...area.locs, l.id] })}
                          />
                        ))}
                      </fieldset>
                    </div>
                  )}

                  {cur === "packages" && (
                    <div className="mt-5 flex flex-col gap-3">
                      {pkgs.map((p, i) => (
                        <div key={i} className="rounded-2xl bg-sunken p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold">חבילה {i + 1}</h3>
                            {pkgs.length > 1 && (
                              <button type="button" onClick={() => setPkgs(pkgs.filter((_, j) => j !== i))} className="grid size-11 place-items-center rounded-lg text-muted hover:bg-card hover:text-danger" aria-label={`מחיקת חבילה ${i + 1}`}>
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                            <Field label="שם" htmlFor={`j-pkg-${i}-name`} className="col-span-2 md:col-span-1">
                              <Input id={`j-pkg-${i}-name`} value={p.name} placeholder="מסיבת מים" onChange={(e) => setPkgs(pkgs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} {...inv(`j-pkg-${i}-name`)} />
                              {err(`j-pkg-${i}-name`)}
                            </Field>
                            <Field label="משך" htmlFor={`j-pkg-${i}-dur`}>
                              <Select id={`j-pkg-${i}-dur`} value={p.duration} onChange={(e) => setPkgs(pkgs.map((x, j) => (j === i ? { ...x, duration: Number(e.target.value) } : x)))}>
                                {[45, 60, 90, 120, 180].map((m) => (
                                  <option key={m} value={m}>
                                    {durationText(m)}
                                  </option>
                                ))}
                              </Select>
                            </Field>
                            <Field label="עד כמה ילדים" htmlFor={`j-pkg-${i}-kids`}>
                              <Input id={`j-pkg-${i}-kids`} inputMode="numeric" placeholder="ללא הגבלה" value={p.maxKids} onChange={(e) => setPkgs(pkgs.map((x, j) => (j === i ? { ...x, maxKids: e.target.value.replace(/\D/g, "") } : x)))} />
                            </Field>
                            <Field label="מחיר כולל מע״מ" htmlFor={`j-pkg-${i}-price`}>
                              <Input id={`j-pkg-${i}-price`} inputMode="numeric" placeholder="₪" value={p.price} onChange={(e) => setPkgs(pkgs.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/\D/g, "") } : x)))} {...inv(`j-pkg-${i}-price`)} />
                              {err(`j-pkg-${i}-price`)}
                            </Field>
                            <Field label="מה כלול" htmlFor={`j-pkg-${i}-inc`} className="col-span-2 md:col-span-4">
                              <Input id={`j-pkg-${i}-inc`} value={p.includes} placeholder="ציוד, מדריכים, פרס לחתן השמחה" onChange={(e) => setPkgs(pkgs.map((x, j) => (j === i ? { ...x, includes: e.target.value } : x)))} />
                            </Field>
                          </div>
                        </div>
                      ))}
                      <Button variant="secondary" className="self-start" onClick={() => setPkgs([...pkgs, { name: "", duration: 90, maxKids: "", price: "", includes: "" }])}>
                        <Plus aria-hidden className="size-4" />
                        הוספת חבילה
                      </Button>
                    </div>
                  )}

                  {cur === "bank" && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label="בנק" htmlFor="j-bank">
                        <Select id="j-bank" value={bank.bank} onChange={(e) => setBank({ ...bank, bank: e.target.value })} {...inv("j-bank")}>
                          <option value="">בחירה</option>
                          {["הפועלים (12)", "לאומי (10)", "דיסקונט (11)", "מזרחי טפחות (20)", "הבינלאומי (31)", "ירושלים (54)", "וואן זירו (18)"].map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </Select>
                        {err("j-bank")}
                      </Field>
                      <Field label="סניף" htmlFor="j-branch">
                        <Input id="j-branch" inputMode="numeric" value={bank.branch} onChange={(e) => setBank({ ...bank, branch: e.target.value.replace(/\D/g, "").slice(0, 3) })} {...inv("j-branch")} />
                        {err("j-branch")}
                      </Field>
                      <Field label="מספר חשבון" htmlFor="j-account">
                        <Input id="j-account" inputMode="numeric" value={bank.account} onChange={(e) => setBank({ ...bank, account: e.target.value.replace(/\D/g, "").slice(0, 9) })} {...inv("j-account")} />
                        {err("j-account")}
                      </Field>
                      <Field label="שם בעל החשבון" htmlFor="j-holder">
                        <Input id="j-holder" value={bank.holder} onChange={(e) => setBank({ ...bank, holder: e.target.value })} {...inv("j-holder")} />
                        {err("j-holder")}
                      </Field>
                      <p className="text-[13px] text-muted sm:col-span-2">ההעברות מתבצעות פעם בחודש, ב־10 לחודש, על הזמנות שהושלמו. ספק הסליקה יאמת את החשבון בהעברת בדיקה של 1 ₪.</p>
                    </div>
                  )}

                  {cur === "plan" && <p className="mt-2 text-[15px] text-muted">אפשר לעבור מסלול בכל זמן. רוב המפעילים מתחילים בבסיסי.</p>}
                </Card>

                {cur === "verify" && (
                  <>
                    <Card className="p-5 sm:p-6">
                      <h2 className="text-lg font-bold">מסמכים</h2>
                      <p className="text-sm text-muted">PDF או תמונה, עד 10MB. הקבצים נשמרים באופן פרטי, ורק צוות האימות יכול לראות אותם.</p>
                      <ul className="mt-3 divide-y divide-line">
                        {docs.map((d) => (
                          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                            <div className="flex items-start gap-3">
                              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunken">
                                <FileText aria-hidden className="size-5" />
                              </span>
                              <div>
                                <p className="font-bold">
                                  {d.title} <span className={cx("text-[13px] font-semibold", d.required ? "text-danger" : "text-muted")}>· {d.required ? "חובה" : "לפי הקטגוריה"}</span>
                                </p>
                                <p className="text-[13px] text-muted">{d.sub}</p>
                                {err(`j-doc-${d.id}`)}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {files[d.id] && (
                                <Badge tone="success" className="max-w-56">
                                  <Check aria-hidden className="size-3.5 shrink-0" strokeWidth={3} />
                                  <span className="truncate">{files[d.id].name}</span>
                                </Badge>
                              )}
                              <label
                                className={cx(
                                  "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold hover:bg-sunken has-focus-visible:ring-3 has-focus-visible:ring-accent/40",
                                  uploadingDoc !== null && "pointer-events-none opacity-60",
                                )}
                              >
                                {uploadingDoc === d.id && <Loader2 aria-hidden className="size-4 animate-spin" />}
                                {uploadingDoc === d.id ? "מעלים…" : files[d.id] ? "החלפה" : "העלאת קובץ"}
                                <input
                                  id={`j-doc-${d.id}`}
                                  type="file"
                                  accept=".pdf,application/pdf,image/*"
                                  className="sr-only"
                                  disabled={uploadingDoc !== null}
                                  onChange={(e) => {
                                    void uploadDoc(d.id, e.target.files?.[0]);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Card>
                    <Card className="p-5 sm:p-6">
                      <h2 className="text-lg font-bold">התחייבויות</h2>
                      <div id="j-commit" tabIndex={-1} className="mt-2">
                        {commitments.map((c, i) => (
                          <Checkbox key={c} label={c} checked={commits[i]} onChange={() => setCommits(commits.map((v, j) => (j === i ? !v : v)))} />
                        ))}
                        <Checkbox
                          checked={commits[3]}
                          onChange={() => setCommits(commits.map((v, j) => (j === 3 ? !v : v)))}
                          label={
                            <>
                              קראתי ואני מסכים/ה ל
                              <Link href="/info/terms" target="_blank" className="font-semibold text-accent-ink hover:underline">
                                תנאי השימוש למפעילים
                              </Link>{" "}
                              ולחלוקת האחריות בין המפעיל לפלטפורמה.
                            </>
                          }
                        />
                      </div>
                      {err("j-commit")}
                    </Card>
                  </>
                )}

                {(cur === "verify" || cur === "plan") && (
                  <section id="plans" aria-labelledby="plans-title" className="scroll-mt-6">
                    <h2 id="plans-title" className="text-lg font-bold">
                      המסלולים {cur === "verify" && <span className="text-sm font-normal text-muted">(בוחרים בשלב {ids.length})</span>}
                    </h2>
                    <div role="radiogroup" aria-label="מסלול" className="mt-3 grid gap-3 md:grid-cols-2">
                      {(
                        [
                          ["basic", "בסיסי", "חינם", "עמלה של 10% רק על הזמנה שהושלמה", ["פרופיל עסקי וחבילות", "בקשות הזמנה ואישור", "יומן זמינות", "תשלומים והעברות"]],
                          ["pro", "מתקדם", "99 ₪ לחודש", "כל מה שבבסיסי, ועוד", ["נתונים עסקיים ודוחות", "חשיפה מוגברת בקטגוריה", "ניהול לקוחות ותזכורות", "תגובות מהירות מוכנות"]],
                        ] as const
                      ).map(([k, name, price, sub, list]) => {
                        const on = plan === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={cur !== "plan"}
                            onClick={() => setPlan(k)}
                            className={cx("rounded-2xl border bg-card p-5 text-start disabled:cursor-default", on ? "border-accent ring-1 ring-accent" : "border-line")}
                          >
                            <span className="block text-lg font-bold">{name}</span>
                            <span className="mt-1 block text-[28px] font-extrabold">{price}</span>
                            <span className="text-sm text-muted">{sub}</span>
                            <ul className="mt-3 flex list-disc flex-col gap-1 ps-5 text-[15px] marker:text-subtle">
                              {list.map((l) => (
                                <li key={l}>{l}</li>
                              ))}
                            </ul>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="secondary"
                    disabled={step <= firstEditable || busy}
                    onClick={() => {
                      setTried(false);
                      setStep(step - 1);
                    }}
                  >
                    חזרה
                  </Button>
                  <Button size="lg" onClick={next} disabled={busy || (cur === "account" && !supabaseConfigured)}>
                    {(creating || submitting) && <Loader2 aria-hidden className="size-5 animate-spin" />}
                    {submitting ? "שולחים…" : creating ? "פותחים חשבון…" : cur === "account" ? "פתיחת חשבון והמשך" : step === ids.length - 1 ? "שליחה לבדיקה" : "שמירה והמשך"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
