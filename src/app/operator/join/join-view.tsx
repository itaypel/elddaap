"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Check, CircleCheckBig, FileText, Plus, Trash2 } from "lucide-react";
import { categories, durationText, locationTypes, regions } from "@/lib/data";
import { useStore } from "@/lib/store";
import { createOperator } from "@/app/actions";
import { Logo } from "@/components/brand";
import { Badge, Button, ButtonLink, Card, Checkbox, ChoiceTile, Field, Input, Select, Textarea, cx } from "@/components/ui";

const steps = [
  { title: "פרטי העסק", sub: "שם, קטגוריה ותיאור קצר" },
  { title: "אימות העסק", sub: "מספר עוסק, ביטוח ואישורים" },
  { title: "אזורי שירות וגילאים", sub: "לאן מגיעים ולאיזה גיל" },
  { title: "חבילות ומחירים", sub: "מה כלול וכמה זה עולה" },
  { title: "קבלת תשלומים", sub: "חשבון בנק להעברות" },
  { title: "בחירת מסלול", sub: "בסיסי או מתקדם" },
];

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

type Pkg = { name: string; duration: number; maxKids: string; price: string; includes: string };

export function JoinView() {
  const toast = useStore((s) => s.toast);
  const setSession = useStore((s) => s.setSession);
  const [submitting, start] = useTransition();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [tried, setTried] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const [biz, setBiz] = useState({ name: "", cats: [] as string[], about: "" });
  const [ver, setVer] = useState({ type: "licensed", displayName: "", taxId: "", owner: "", phone: "" });
  const [files, setFiles] = useState<Record<string, string>>({});
  const [commits, setCommits] = useState<boolean[]>([false, false, false, false]);
  const [area, setArea] = useState({ regions: [] as string[], ageMin: "4", ageMax: "12", locs: ["home"] as string[] });
  const [pkgs, setPkgs] = useState<Pkg[]>([{ name: "", duration: 60, maxKids: "", price: "", includes: "" }]);
  const [bank, setBank] = useState({ bank: "", branch: "", account: "", holder: "" });
  const [plan, setPlan] = useState<"basic" | "pro">("basic");

  const errors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!biz.name.trim()) e["j-name"] = "הוסיפו את שם העסק";
      if (!biz.cats.length) e["j-cats"] = "בחרו לפחות קטגוריה אחת";
    }
    if (step === 1) {
      if (!(ver.displayName || biz.name).trim()) e["j-display"] = "הוסיפו שם כפי שיופיע באתר";
      if (!/^\d{8,9}$/.test(ver.taxId)) e["j-tax"] = "8 או 9 ספרות";
      if (!ver.owner.trim()) e["j-owner"] = "הוסיפו את שם בעל העסק";
      if (!/^0\d{1,2}-?\d{7}$/.test(ver.phone.replace(/\s/g, ""))) e["j-phone"] = "מספר בפורמט 050-0000000";
      docs.filter((d) => d.required && !files[d.id]).forEach((d) => (e[`j-doc-${d.id}`] = "מסמך חובה"));
      if (!commits.every(Boolean)) e["j-commit"] = "צריך לאשר את כל ההתחייבויות";
    }
    if (step === 2) {
      if (!area.regions.length) e["j-regions"] = "בחרו לפחות אזור אחד";
      if (Number(area.ageMin) > Number(area.ageMax)) e["j-age"] = "גיל ההתחלה גבוה מגיל הסיום";
    }
    if (step === 3) {
      pkgs.forEach((p, i) => {
        if (!p.name.trim()) e[`j-pkg-${i}-name`] = "שם החבילה";
        if (!Number(p.price)) e[`j-pkg-${i}-price`] = "מחיר";
      });
    }
    if (step === 4) {
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

  const next = () => {
    const e = errors();
    if (Object.keys(e).length) {
      setTried(true);
      setTimeout(() => document.getElementById(Object.keys(e)[0])?.focus(), 0);
      return;
    }
    setTried(false);
    if (step === steps.length - 1) {
      start(async () => {
        const res = await createOperator({
          name: biz.name.trim(),
          categories: biz.cats,
          about: biz.about.trim(),
          regions: area.regions,
          ageMin: Number(area.ageMin) || 3,
          ageMax: Number(area.ageMax) || 12,
          locations: area.locs.length ? area.locs : ["home"],
          packages: pkgs.map((p) => ({ name: p.name.trim(), duration: p.duration, maxKids: p.maxKids, price: Number(p.price), includes: p.includes.trim() })),
          business: { type: ver.type, displayName: (ver.displayName || biz.name).trim(), taxId: ver.taxId, owner: ver.owner.trim(), phone: ver.phone.trim(), plan },
          bank,
          documents: docs.map((d) => ({ id: d.id, name: d.title, file: files[d.id] ?? null, state: files[d.id] ? "ok" : d.required ? "missing" : "optional", note: files[d.id] ?? "" })),
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
    setStep(step + 1);
    top.current?.scrollIntoView({ behavior: "smooth" });
  };

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
            <CircleCheckBig aria-hidden className="mx-auto size-14 text-success" strokeWidth={1.6} />
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
                  {steps.map((s, i) => {
                    const state = i < step ? "done" : i === step ? "current" : "todo";
                    return (
                      <li key={s.title} aria-current={state === "current" ? "step" : undefined} className="shrink-0">
                        <button
                          type="button"
                          disabled={i > step}
                          onClick={() => i < step && setStep(i)}
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
                    שלב {step + 1} מתוך {steps.length}
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold">{steps[step].title}</h2>

                  {step === 0 && (
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
                    </div>
                  )}

                  {step === 1 && (
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
                        <Field label="טלפון לבקשות הזמנה" htmlFor="j-phone">
                          <Input id="j-phone" type="tel" dir="ltr" className="text-end" autoComplete="tel" value={ver.phone} onChange={(e) => setVer({ ...ver, phone: e.target.value })} {...inv("j-phone")} />
                          {err("j-phone")}
                        </Field>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
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

                  {step === 3 && (
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

                  {step === 4 && (
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

                  {step === 5 && (
                    <p className="mt-2 text-[15px] text-muted">אפשר לעבור מסלול בכל זמן. רוב המפעילים מתחילים בבסיסי.</p>
                  )}
                </Card>

                {step === 1 && (
                  <>
                    <Card className="p-5 sm:p-6">
                      <h2 className="text-lg font-bold">מסמכים</h2>
                      <p className="text-sm text-muted">רק צוות האימות רואה את המסמכים. בגרסה הזו נשמר שם הקובץ, והצוות יבקש את הקבצים עצמם לפני האישור.</p>
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
                            {files[d.id] ? (
                              <Badge tone="success">
                                <Check aria-hidden className="size-3.5" strokeWidth={3} />
                                {files[d.id]}
                              </Badge>
                            ) : (
                              <label className="flex min-h-11 cursor-pointer items-center rounded-xl border border-line-strong px-4 text-sm font-semibold hover:bg-sunken has-focus-visible:ring-3 has-focus-visible:ring-accent/40">
                                העלאת קובץ
                                <input
                                  id={`j-doc-${d.id}`}
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="sr-only"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) setFiles({ ...files, [d.id]: f.name });
                                  }}
                                />
                              </label>
                            )}
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

                {(step === 1 || step === 5) && (
                  <section id="plans" aria-labelledby="plans-title" className="scroll-mt-6">
                    <h2 id="plans-title" className="text-lg font-bold">
                      המסלולים {step === 1 && <span className="text-sm font-normal text-muted">(בוחרים בשלב 6)</span>}
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
                            disabled={step !== 5}
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
                  <Button variant="secondary" disabled={step === 0} onClick={() => { setTried(false); setStep(step - 1); }}>
                    חזרה
                  </Button>
                  <Button size="lg" onClick={next} disabled={submitting}>
                    {submitting ? "שולחים…" : step === steps.length - 1 ? "שליחה לבדיקה" : "שמירה והמשך"}
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
