"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  type LocationType,
  DEPOSIT,
  cancellationPolicies,
  dayLabel,
  durationText,
  eventTypes,
  locationTypes,
  money,
  pre,
  shortDate,
  weekday,
} from "@/lib/data";
import { useOperator, useStore } from "@/lib/store";
import { OperatorMedia } from "@/components/brand";
import { FlowHeader } from "@/components/site-chrome";
import { Button, Card, Checkbox, ChoiceTile, DefinitionRow, Field, Input, Select, Textarea, cx } from "@/components/ui";

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["פרטי האירוע", "אישור המפעיל", "תשלום מקדמה"];
  return (
    <ol className="flex flex-wrap gap-2" aria-label="שלבי ההזמנה">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li
            key={s}
            aria-current={active ? "step" : undefined}
            className={cx(
              "flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold",
              active ? "border-contrast bg-contrast text-on-contrast" : done ? "border-accent-line bg-accent-soft text-accent-ink" : "border-line-strong bg-card text-muted",
            )}
          >
            <span className={cx("grid size-6 place-items-center rounded-full text-xs tabular", active ? "bg-on-contrast text-contrast" : "bg-sunken text-ink")}>{n}</span>
            {s}
          </li>
        );
      })}
    </ol>
  );
}

const phoneOk = (p: string) => /^0\d{1,2}-?\d{7}$/.test(p.replace(/\s/g, ""));
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function BookView({ slug }: { slug: string }) {
  const op = useOperator(slug)!;
  const params = useSearchParams();
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const createBooking = useStore((s) => s.createBooking);
  const toast = useStore((s) => s.toast);

  const pkg = op.packages.find((p) => p.id === params.get("pkg")) ?? op.packages[0];
  const date = params.get("date") || "2026-12-11";
  const time = params.get("time") || op.slots[0];
  const extras = (params.get("extras") || "").split(",").filter(Boolean);

  const [form, setForm] = useState({
    eventType: "יום הולדת",
    address: "הרימון 12, רעננה",
    kids: params.get("kids") || "22",
    ageRange: "6–8",
    location: "home" as LocationType,
    notes: "",
    kind: "parent" as "parent" | "institution",
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    org: "",
    orgId: "",
    terms: false,
    photos: false,
    marketing: false,
  });
  const [tried, setTried] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const kids = Math.max(1, Number(form.kids) || 1);
  const extraKids = pkg.maxKids && kids > pkg.maxKids ? kids - pkg.maxKids : 0;
  const extraKidsCost = extraKids * (pkg.extraKidPrice ?? 0);
  const extrasCost = extras.reduce((s, id) => s + (op.extras.find((e) => e.id === id)?.price ?? 0), 0);
  const total = pkg.price + extraKidsCost + extrasCost;
  const deposit = Math.round(total * DEPOSIT);
  const city = form.address.split(",").pop()?.trim() || "—";

  const errors: Record<string, string> = {};
  if (!form.address.trim()) errors.address = "הוסיפו כתובת כדי שהמפעיל יוכל לחשב זמן הגעה";
  if (!form.name.trim()) errors.name = "הוסיפו שם מלא";
  if (!phoneOk(form.phone)) errors.phone = "מספר נייד בפורמט 050-0000000";
  if (!emailOk(form.email)) errors.email = "כתובת אימייל לא תקינה";
  if (form.kind === "institution" && !form.org.trim()) errors.org = "הוסיפו את שם המוסד לחשבונית";
  if (!form.terms) errors.terms = "צריך לאשר את תנאי ההזמנה כדי לשלוח";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.keys(errors).length) {
      const first = Object.keys(errors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const id = createBooking({
      operatorSlug: op.slug,
      packageId: pkg.id,
      customerId: "dana",
      customerName: form.kind === "institution" ? form.org : form.name,
      customerKind: form.kind,
      phone: form.phone,
      email: form.email,
      eventType: form.eventType,
      date,
      time,
      city,
      address: form.address,
      distanceKm: 12,
      kids,
      ageRange: form.ageRange,
      locationType: form.location,
      notes: form.notes,
      extras,
      price: pkg.price + extraKidsCost,
      travelFee: 0,
    });
    toast(`הבקשה נשלחה ${pre("ל", op.name)}`);
    router.push(`/bookings?new=${id}`);
  };

  const err = (k: string) =>
    tried && errors[k] ? (
      <p id={`${k}-err`} className="text-[13px] font-semibold text-danger">
        {errors[k]}
      </p>
    ) : null;
  const invalid = (k: string) => (tried && errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <>
      <FlowHeader backHref={`/operators/${op.slug}?date=${date}`} backLabel="חזרה לכרטיס המפעיל" />
      <main id="main" className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">בקשת הזמנה</h1>
        <div className="mt-4">
          <Stepper current={1} />
        </div>

        <form ref={formRef} onSubmit={submit} noValidate className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="flex flex-col gap-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold">פרטי האירוע</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="סוג האירוע" htmlFor="eventType">
                  <Select id="eventType" name="eventType" value={form.eventType} onChange={(e) => set("eventType", e.target.value)}>
                    {eventTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="תאריך ושעה" htmlFor="when" hint={<Link href={`/operators/${op.slug}?date=${date}`} className="font-semibold text-accent-ink hover:underline">שינוי מועד</Link>}>
                  <Input id="when" readOnly value={`${dayLabel(date)} · ${time}`} className="bg-sunken" />
                </Field>
                <Field label="כתובת האירוע" htmlFor="address" className="sm:col-span-2">
                  <Input id="address" name="address" autoComplete="street-address" value={form.address} onChange={(e) => set("address", e.target.value)} {...invalid("address")} />
                  {err("address")}
                </Field>
                <Field label="מספר ילדים" htmlFor="kids">
                  <Input id="kids" name="kids" type="number" inputMode="numeric" min={1} value={form.kids} onChange={(e) => set("kids", e.target.value)} />
                </Field>
                <Field label="טווח גילאים" htmlFor="ageRange">
                  <Select id="ageRange" name="ageRange" value={form.ageRange} onChange={(e) => set("ageRange", e.target.value)}>
                    {["3–5", "4–6", "6–8", "8–10", "10–12", "12–14"].map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <fieldset className="mt-4">
                <legend className="mb-1.5 text-sm font-semibold">איפה תתקיים ההפעלה</legend>
                <div className="flex flex-wrap gap-2">
                  {locationTypes
                    .filter((l) => op.locations.includes(l.id))
                    .map((l) => (
                      <ChoiceTile key={l.id} name="location" value={l.id} checked={form.location === l.id} onSelect={() => set("location", l.id)}>
                        {l.short}
                      </ChoiceTile>
                    ))}
                </div>
              </fieldset>
              <Field label="הערות למפעיל" htmlFor="notes" className="mt-4">
                <Textarea id="notes" name="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="אלרגיות, צרכי נגישות, חניה, שם חתן או כלת השמחה" />
              </Field>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold">מי מזמין</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <ChoiceTile name="kind" value="parent" checked={form.kind === "parent"} onSelect={() => set("kind", "parent")}>
                  הורה או משפחה
                </ChoiceTile>
                <ChoiceTile name="kind" value="institution" checked={form.kind === "institution"} onSelect={() => set("kind", "institution")}>
                  מוסד, רשות או ארגון
                </ChoiceTile>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {form.kind === "institution" && (
                  <>
                    <Field label="שם המוסד או הארגון" htmlFor="org">
                      <Input id="org" name="org" autoComplete="organization" value={form.org} onChange={(e) => set("org", e.target.value)} {...invalid("org")} />
                      {err("org")}
                    </Field>
                    <Field label="ח.פ. או מספר מוסד (לחשבונית)" htmlFor="orgId">
                      <Input id="orgId" name="orgId" inputMode="numeric" value={form.orgId} onChange={(e) => set("orgId", e.target.value)} />
                    </Field>
                  </>
                )}
                <Field label={form.kind === "institution" ? "איש קשר" : "שם מלא"} htmlFor="name">
                  <Input id="name" name="name" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} {...invalid("name")} />
                  {err("name")}
                </Field>
                <Field label="טלפון נייד" htmlFor="phone">
                  <Input id="phone" name="phone" type="tel" dir="ltr" autoComplete="tel" inputMode="tel" className="text-end" value={form.phone} onChange={(e) => set("phone", e.target.value)} {...invalid("phone")} />
                  {err("phone")}
                </Field>
                <Field label="אימייל לקבלת אישורים וחשבונית" htmlFor="email" className="sm:col-span-2">
                  <Input id="email" name="email" type="email" dir="ltr" autoComplete="email" className="text-end" value={form.email} onChange={(e) => set("email", e.target.value)} {...invalid("email")} />
                  {err("email")}
                </Field>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-bold">תנאי ההזמנה</h2>
              <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ["נותן השירות", `${op.name} · עוסק מורשה`],
                  ["מחיר כולל מע״מ", `${money(total)}, מקדמה ${Math.round(DEPOSIT * 100)}% אחרי האישור`],
                  ["ביטול", cancellationPolicies[op.cancellation].short],
                  ["גשם או מזג אוויר קיצוני", "מועד חלופי בלי עלות"],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-xl bg-sunken p-3">
                    <dt className="text-[13px] text-muted">{t}</dt>
                    <dd className="mt-0.5 text-[15px] font-bold">{d}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3">
                <Checkbox
                  name="terms"
                  checked={form.terms}
                  onChange={() => set("terms", !form.terms)}
                  {...invalid("terms")}
                  label={
                    <>
                      קראתי ואני מסכים/ה ל
                      <Link href="/info/terms" className="font-semibold text-accent-ink underline-offset-4 hover:underline" target="_blank">
                        תנאי ההזמנה
                      </Link>{" "}
                      ול
                      <Link href="/info/cancellation" className="font-semibold text-accent-ink underline-offset-4 hover:underline" target="_blank">
                        מדיניות הביטול
                      </Link>
                    </>
                  }
                />
                {err("terms")}
                <Checkbox checked={form.photos} onChange={() => set("photos", !form.photos)} label="המפעיל רשאי לצלם את ההפעלה לשימוש פנימי בלבד. תמונות שבהן רואים ילדים לא יפורסמו בלי אישור נפרד." />
                <Checkbox checked={form.marketing} onChange={() => set("marketing", !form.marketing)} label="אשמח לקבל עדכונים ומבצעים במייל" />
              </div>
            </Card>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-3">
                <OperatorMedia category={op.category} className="size-14 shrink-0 rounded-xl" iconClassName="size-6" />
                <div>
                  <p className="font-bold">{op.name}</p>
                  <p className="text-[13px] text-muted">
                    חבילת {pkg.name} · {durationText(pkg.durationMin)}
                  </p>
                </div>
              </div>
              <dl className="mt-4 border-t border-line pt-3">
                <DefinitionRow term="מתי">
                  {weekday(date)} {shortDate(date)} · {time}
                </DefinitionRow>
                <DefinitionRow term="איפה">{city}</DefinitionRow>
                <DefinitionRow term="ילדים">
                  {kids} · גילאי {form.ageRange}
                </DefinitionRow>
              </dl>
              <dl className="mt-3 border-t border-line pt-3">
                <DefinitionRow term={pkg.name}>{money(pkg.price)}</DefinitionRow>
                {extraKidsCost > 0 && <DefinitionRow term={`${extraKids} ילדים נוספים`}>{money(extraKidsCost)}</DefinitionRow>}
                {extras.map((id) => {
                  const e = op.extras.find((x) => x.id === id);
                  return e ? (
                    <DefinitionRow key={id} term={e.name}>
                      {money(e.price)}
                    </DefinitionRow>
                  ) : null;
                })}
                <DefinitionRow term="נסיעה">{money(0)}</DefinitionRow>
                <DefinitionRow term="סה״כ" strong>
                  {money(total)}
                </DefinitionRow>
                <DefinitionRow term="מקדמה אחרי האישור">{money(deposit)}</DefinitionRow>
              </dl>
              <Button type="submit" size="lg" className="mt-4 w-full">
                שליחת בקשה למפעיל
              </Button>
              <p className="mt-2 text-center text-[13px] text-muted">לא תחויבו עכשיו</p>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">מה קורה אחרי השליחה</h2>
              <ol className="mt-3 flex list-decimal flex-col gap-2 ps-5 text-sm leading-relaxed text-muted marker:font-semibold marker:text-ink">
                <li>הבקשה נשלחת למפעיל עם כל פרטי האירוע</li>
                <li>המפעיל מאשר, מציע מועד אחר או דוחה, תוך 24 שעות</li>
                <li>אחרי האישור מקבלים הודעה ומשלמים מקדמה</li>
                <li>יום לפני האירוע נשלחת תזכורת לשני הצדדים</li>
              </ol>
            </Card>
          </aside>
        </form>
      </main>
    </>
  );
}
