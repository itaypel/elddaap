"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CancellationPolicy, type Operator, type Package, cancellationPolicies, categories, durationText, money, regions } from "@/lib/data";
import { useStore } from "@/lib/store";
import { saveOperatorProfile } from "@/app/actions";
import { OperatorMedia } from "@/components/brand";
import { Badge, Button, Card, CardHeader, Field, Input, Select, Textarea, buttonClass, cx } from "@/components/ui";

export function ProfileView({ op }: { op: Operator }) {
  const toast = useStore((s) => s.toast);
  const router = useRouter();
  const [saving, start] = useTransition();

  const [name, setName] = useState(op.name);
  const [tagline, setTagline] = useState(op.tagline);
  const [about, setAbout] = useState(op.about);
  const [cats, setCats] = useState<string[]>(op.categories.length ? op.categories : [op.category]);
  const [packages, setPackages] = useState<Package[]>(op.packages);
  const [editing, setEditing] = useState<string | null>((op.packages.find((p) => p.popular) ?? op.packages[0])?.id ?? null);
  const [areas, setAreas] = useState<string[]>(op.regions);
  const [policy, setPolicy] = useState<CancellationPolicy>(op.cancellation);

  const dirty =
    name !== op.name || tagline !== op.tagline || about !== op.about || policy !== op.cancellation || JSON.stringify(packages) !== JSON.stringify(op.packages) || JSON.stringify(areas) !== JSON.stringify(op.regions) ||
    JSON.stringify(cats) !== JSON.stringify(op.categories.length ? op.categories : [op.category]);

  const save = () => {
    if (!name.trim()) {
      toast("לשם העסק אין ערך. הוסיפו שם לפני השמירה.", "danger");
      return;
    }
    if (packages.some((p) => !p.name.trim() || p.price <= 0)) {
      toast("לכל חבילה צריך שם ומחיר. בדקו את החבילות לפני השמירה.", "danger");
      return;
    }
    start(async () => {
      const res = await saveOperatorProfile({ operatorId: op.id, slug: op.slug, name, tagline, about, categories: cats, regions: areas, cancellation: policy, packages });
      if (!res.ok) return toast(res.error, "danger");
      toast(op.status === "active" ? "השינויים נשמרו ומופיעים בכרטיס שלכם" : "השינויים נשמרו");
      router.refresh();
    });
  };

  const updatePkg = (id: string, patch: Partial<Package>) => setPackages((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const addPkg = () => {
    const id = `p${Date.now().toString(36)}`;
    setPackages((ps) => [...ps, { id, name: "חבילה חדשה", durationMin: 60, maxKids: 15, ageMin: 6, ageMax: 10, price: 1000, includes: "", active: false }]);
    setEditing(id);
  };
  const editPkg = packages.find((p) => p.id === editing);
  const completion = Math.min(100, 40 + (about.trim().length > 40 ? 20 : 0) + (packages.some((p) => p.active) ? 20 : 0) + (op.facts.length ? 10 : 0) + (op.prepare.length ? 10 : 0));
  const photos = 4;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">פרופיל וחבילות</h1>
        <div className="flex gap-2">
          <Link href={`/operators/${op.slug}`} target="_blank" className={buttonClass("secondary", "md")}>
            תצוגה כמו שלקוח רואה
          </Link>
          <Button onClick={save} disabled={!dirty || saving}>
            שמירת שינויים
          </Button>
        </div>
      </div>

      <Card className="mt-5 flex flex-wrap items-center gap-4 p-5">
        <div className="min-w-48 flex-1">
          <p className="font-bold">הפרופיל מלא ב־{completion}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label="שלמות הפרופיל">
            <div className="h-full rounded-full bg-accent" style={{ width: `${completion}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="warning">הוסיפו סרטון קצר</Badge>
          <Badge tone="warning">הוסיפו שאלות נפוצות</Badge>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader title="פרטים כלליים" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="שם העסק" htmlFor="pf-name">
            <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="משפט קצר שמופיע בתוצאות" htmlFor="pf-tag" hint={`${tagline.length}/60`}>
            <Input id="pf-tag" maxLength={60} value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </Field>
          <Field label="על ההפעלה" htmlFor="pf-about" className="sm:col-span-2">
            <Textarea id="pf-about" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} />
          </Field>
        </div>
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold">קטגוריות (עד 2)</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = cats.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  disabled={!on && cats.length >= 2}
                  onClick={() => setCats(on ? cats.filter((x) => x !== c.id) : [...cats, c.id])}
                  className={cx(
                    "min-h-10 rounded-full border px-3.5 text-sm font-medium transition-colors disabled:opacity-40",
                    on ? "border-accent bg-accent-soft font-semibold text-accent-ink" : "border-line-strong hover:bg-sunken",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader title="תמונות וסרטונים" sub="גוררים כדי לשנות סדר. הראשונה היא התמונה הראשית." />
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: photos }).map((_, i) => (
            <li key={i} className="relative">
              <OperatorMedia category={op.category} className="aspect-[4/3] rounded-xl" iconClassName="size-6" label={`תמונה ${i + 1}`} />
              {i === 0 && <span className="absolute bottom-2 start-2 rounded-md bg-card px-1.5 py-0.5 text-[12px] font-bold">ראשית</span>}
              {i === photos - 1 && i > 0 && <Badge tone="warning" className="absolute bottom-2 start-2 text-[12px]">בבדיקה</Badge>}
            </li>
          ))}
          <li>
            <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-xl border-[1.5px] border-dashed border-line-strong text-center text-sm font-semibold text-accent-ink hover:bg-sunken has-focus-visible:ring-3 has-focus-visible:ring-accent/40">
              <span className="flex flex-col items-center gap-1">
                <Plus aria-hidden className="size-5" />
                הוספה
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) toast("העלאת תמונות תיפתח בשלב הבא. הקבצים לא נשמרו.", "neutral");
                  e.target.value = "";
                }}
              />
            </label>
          </li>
        </ul>
        <p className="mt-3 text-[13px] text-muted">העלאת תמונות וסרטונים תיפתח בשלב הבא. תמונות שבהן מזוהים ילדים עוברות בדיקה של הצוות. מעלים רק תמונות שיש עליהן הסכמה של ההורים או המוסד.</p>
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader
          title="חבילות"
          action={
            <Button variant="secondary" size="sm" onClick={addPkg}>
              הוספת חבילה
            </Button>
          }
        />
        <ul className="mt-4 flex flex-col gap-2">
          {packages.map((p) => (
            <li key={p.id} className={cx("flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3", editing === p.id ? "border-accent" : "border-line")}>
              <div className="min-w-0">
                <p className="font-bold">{p.name}</p>
                <p className="text-[13px] text-muted">
                  {durationText(p.durationMin)} · {p.maxKids ? `עד ${p.maxKids} ילדים` : "ללא הגבלה"} · גילאי {p.ageMin}–{p.ageMax}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold tabular">{money(p.price)}</span>
                <button type="button" onClick={() => updatePkg(p.id, { active: !p.active })} aria-pressed={p.active} aria-label={`${p.name}: ${p.active ? "פעילה, לחצו להסתרה" : "מוסתרת, לחצו להפעלה"}`}>
                  <Badge tone={p.active ? "success" : "neutral"}>{p.active ? "פעילה" : "מוסתרת"}</Badge>
                </button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(editing === p.id ? null : p.id)} aria-expanded={editing === p.id}>
                  {editing === p.id ? "סגירה" : "עריכה"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {editPkg && (
          <div className="mt-3 rounded-2xl bg-sunken p-4">
            <h3 className="font-bold">עריכת חבילה: {editPkg.name}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Field label="שם" htmlFor="pk-name" className="col-span-2 md:col-span-3 lg:col-span-2">
                <Input id="pk-name" value={editPkg.name} onChange={(e) => updatePkg(editPkg.id, { name: e.target.value })} />
              </Field>
              <Field label="משך" htmlFor="pk-dur">
                <Select id="pk-dur" value={editPkg.durationMin} onChange={(e) => updatePkg(editPkg.id, { durationMin: Number(e.target.value) })}>
                  {[45, 60, 75, 90, 120, 180, 240].map((m) => (
                    <option key={m} value={m}>
                      {durationText(m)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="עד כמה ילדים" htmlFor="pk-kids">
                <Input id="pk-kids" inputMode="numeric" value={editPkg.maxKids ?? ""} placeholder="ללא הגבלה" onChange={(e) => updatePkg(editPkg.id, { maxKids: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })} />
              </Field>
              <Field label="מגיל" htmlFor="pk-from">
                <Input id="pk-from" inputMode="numeric" value={editPkg.ageMin} onChange={(e) => updatePkg(editPkg.id, { ageMin: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
              </Field>
              <Field label="עד גיל" htmlFor="pk-to">
                <Input id="pk-to" inputMode="numeric" value={editPkg.ageMax} onChange={(e) => updatePkg(editPkg.id, { ageMax: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
              </Field>
              <Field label="מחיר כולל מע״מ" htmlFor="pk-price">
                <Input id="pk-price" inputMode="numeric" value={editPkg.price} onChange={(e) => updatePkg(editPkg.id, { price: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
              </Field>
              <Field label="כל ילד נוסף" htmlFor="pk-extra">
                <Input id="pk-extra" inputMode="numeric" value={editPkg.extraKidPrice ?? ""} onChange={(e) => updatePkg(editPkg.id, { extraKidPrice: Number(e.target.value.replace(/\D/g, "")) || undefined })} />
              </Field>
              <Field label="מה כלול" htmlFor="pk-inc" className="col-span-2 md:col-span-3 lg:col-span-6">
                <Textarea id="pk-inc" rows={2} value={editPkg.includes} onChange={(e) => updatePkg(editPkg.id, { includes: e.target.value })} />
              </Field>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader title="אזורי שירות וגילאים" />
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold">לאן מגיעים בלי תוספת</legend>
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => {
              const on = areas.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setAreas(on ? areas.filter((x) => x !== r) : [...areas, r])}
                  className={cx("min-h-10 rounded-full border px-3.5 text-sm font-medium transition-colors", on ? "border-accent bg-accent-soft font-semibold text-accent-ink" : "border-line-strong hover:bg-sunken")}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="דמי נסיעה מחוץ לאזורים" htmlFor="pf-fee" hint="מוצג ללקוח לפני שליחת הבקשה">
            <Input id="pf-fee" defaultValue="10 ₪ לכל 10 ק״מ" />
          </Field>
          <Field label="זמן נסיעה מינימלי בין אירועים" htmlFor="pf-gap">
            <Select id="pf-gap" defaultValue="60">
              <option value="30">חצי שעה</option>
              <option value="60">שעה</option>
              <option value="90">שעה וחצי</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <CardHeader title="מדיניות ביטול" />
        <div role="radiogroup" aria-label="מדיניות ביטול" className="mt-4 grid gap-2 md:grid-cols-3">
          {(Object.keys(cancellationPolicies) as CancellationPolicy[]).map((k) => {
            const p = cancellationPolicies[k];
            const on = policy === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPolicy(k)}
                className={cx("rounded-xl border p-4 text-start transition-colors", on ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line-strong hover:bg-sunken")}
              >
                <span className={cx("block font-bold", on && "text-accent-ink")}>{p.name}</span>
                <span className="mt-1 block text-sm text-muted">{p.short}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="sticky bottom-20 z-10 mt-6 flex justify-end lg:bottom-6">
        {dirty && (
          <div className="animate-rise flex items-center gap-3 rounded-2xl bg-contrast p-2 ps-4 text-on-contrast shadow-float">
            <span className="text-sm font-semibold">יש שינויים שלא נשמרו</span>
            <button type="button" onClick={save} disabled={saving} className="min-h-10 rounded-xl bg-accent px-4 text-sm font-bold text-white">
              שמירת שינויים
            </button>
          </div>
        )}
      </div>
    </>
  );
}
