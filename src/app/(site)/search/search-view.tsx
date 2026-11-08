"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Clock, MapPin, SlidersHorizontal, Star, X, Scale } from "lucide-react";
import {
  type CategoryId,
  type LocationType,
  type Operator,
  ageRanges,
  availabilityWindow,
  availableOn,
  categories,
  categoryById,
  locationTypes,
  money,
  priceFrom,
  publicOperators,
  regions,
  shortDate,
  weekday,
  durationText,
} from "@/lib/data";
import { useStore } from "@/lib/store";
import { OperatorMedia } from "@/components/brand";
import { HeroSearch } from "@/components/hero-search";
import { Sheet } from "@/components/sheet";
import { Badge, Button, ButtonLink, Card, Checkbox, Input, Radio, Rating, Segmented, Select, cx } from "@/components/ui";

type Filters = {
  onlyAvailable: boolean;
  ages: string[];
  priceMin: string;
  priceMax: string;
  cats: CategoryId[];
  locs: LocationType[];
  duration: "any" | "short" | "mid" | "long";
  rating: "any" | "4" | "4.5";
};

const minDuration = (o: Operator) => Math.min(...o.packages.map((p) => p.durationMin));

export function SearchView() {
  const params = useSearchParams();
  const date = params.get("date") || "2026-12-11";
  const type = params.get("type") || "יום הולדת";
  const region = params.get("region") || "";
  const budget = params.get("budget") ?? "";
  const age = params.get("age") || "";
  const cat = params.get("cat") as CategoryId | null;

  const initial: Filters = {
    onlyAvailable: true,
    ages: age ? [age] : [],
    priceMin: "",
    priceMax: budget,
    cats: cat ? [cat] : [],
    locs: [],
    duration: "any",
    rating: "any",
  };
  const [f, setF] = useState<Filters>(initial);
  const [regionSel, setRegionSel] = useState(region);
  const [sort, setSort] = useState("best");
  const [view, setView] = useState<"list" | "map">("list");
  const [visible, setVisible] = useState(6);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const compare = useStore((s) => s.compare);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const clearCompare = useStore((s) => s.clearCompare);

  const results = useMemo(() => {
    let list = publicOperators().filter((o) => {
      if (regionSel && !o.regions.includes(regionSel as never)) return false;
      if (f.onlyAvailable && !availableOn(o, date)) return false;
      if (f.ages.length) {
        const ok = f.ages.some((id) => {
          const r = ageRanges.find((a) => a.id === id)!;
          return o.ageMin <= r.max && o.ageMax >= r.min;
        });
        if (!ok) return false;
      }
      const p = priceFrom(o);
      if (f.priceMin && p < Number(f.priceMin)) return false;
      if (f.priceMax && p > Number(f.priceMax)) return false;
      if (f.cats.length && !f.cats.includes(o.category)) return false;
      if (f.locs.length && !f.locs.some((l) => o.locations.includes(l))) return false;
      const d = minDuration(o);
      if (f.duration === "short" && d > 60) return false;
      if (f.duration === "mid" && (d < 60 || d > 120)) return false;
      if (f.duration === "long" && d <= 120) return false;
      if (f.rating !== "any" && o.rating < Number(f.rating)) return false;
      return true;
    });
    if (sort === "price") list = [...list].sort((a, b) => priceFrom(a) - priceFrom(b));
    else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === "reviews") list = [...list].sort((a, b) => b.reviewsCount - a.reviewsCount);
    else list = [...list].sort((a, b) => Number(!!b.sponsored) - Number(!!a.sponsored) || b.rating * 10 + b.reviewsCount / 20 - (a.rating * 10 + a.reviewsCount / 20));
    return list;
  }, [f, regionSel, sort, date]);

  const activeFilterCount =
    f.ages.length + f.cats.length + f.locs.length + (f.priceMin ? 1 : 0) + (f.priceMax ? 1 : 0) + (f.duration !== "any" ? 1 : 0) + (f.rating !== "any" ? 1 : 0) + (f.onlyAvailable ? 0 : 1);

  const resetFilters = () => setF({ onlyAvailable: true, ages: [], priceMin: "", priceMax: "", cats: [], locs: [], duration: "any", rating: "any" });

  const chips = [type, `${weekday(date)}, ${shortDate(date)}.${date.slice(0, 4)}`, age ? `גילאי ${ageRanges.find((a) => a.id === age)?.label}` : null, regionSel || null, budget ? `עד ${money(Number(budget))}` : null].filter(Boolean);

  const filterPanel = <FilterPanel f={f} setF={setF} onReset={resetFilters} />;

  return (
    <>
      {/* Search summary */}
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <span className="text-sm text-muted">החיפוש שלך:</span>
          <ul className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {chips.map((c) => (
              <li key={c as string} className="shrink-0 rounded-full border border-line-strong px-3 py-1 text-sm font-medium">
                {c}
              </li>
            ))}
          </ul>
          <Button variant="link" size="sm" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            {editing ? "סגירה" : "שינוי חיפוש"}
          </Button>
        </div>
        {editing && (
          <div className="mx-auto max-w-6xl px-4 pb-5 sm:px-6">
            <HeroSearch />
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 pb-28 sm:px-6 lg:grid-cols-[260px_1fr] lg:pt-8">
        {/* Sidebar (regular width) */}
        <aside className="hidden flex-col gap-4 lg:flex" aria-label="סינון תוצאות">
          <Card className="overflow-hidden">
            <button type="button" onClick={() => setView("map")} className="block w-full text-start">
              <MiniMap results={results} />
              <span className="flex min-h-11 items-center px-4 text-sm font-semibold text-accent-ink">הצגת התוצאות על המפה</span>
            </button>
          </Card>
          <Card className="p-4">{filterPanel}</Card>
        </aside>

        <section aria-labelledby="results-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 id="results-title" className="text-2xl font-extrabold tracking-tight">
              {results.length} מפעילים {f.onlyAvailable ? "פנויים" : ""} ב־{shortDate(date)}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-card px-4 text-sm font-semibold lg:hidden"
              >
                <SlidersHorizontal aria-hidden className="size-4" />
                סינון
                {activeFilterCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs leading-5 text-white">{activeFilterCount}</span>}
              </button>
              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="hidden sm:inline">מיון</span>
                <Select aria-label="מיון" value={sort} onChange={(e) => setSort(e.target.value)} className="min-w-36 text-sm">
                  <option value="best">הכי מתאים</option>
                  <option value="price">מחיר: מהנמוך</option>
                  <option value="rating">דירוג גבוה</option>
                  <option value="reviews">הכי הרבה ביקורות</option>
                </Select>
              </label>
              <Segmented label="תצוגה" value={view} onChange={setView} options={[{ value: "list", label: "רשימה" }, { value: "map", label: "מפה" }]} />
            </div>
          </div>

          {regionSel && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setRegionSel("")} className="flex min-h-9 items-center gap-1 rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent-ink">
                אזור: {regionSel}
                <X aria-label="הסרת סינון אזור" className="size-4" />
              </button>
            </div>
          )}

          {view === "map" ? (
            <Card className="mt-5 overflow-hidden">
              <BigMap results={results} region={regionSel} onRegion={setRegionSel} />
            </Card>
          ) : results.length === 0 ? (
            <Card className="mt-5 flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-lg font-bold">אין מפעילים שמתאימים לכל הסינונים</p>
              <p className="max-w-sm text-[15px] text-muted">נסו להרחיב את טווח המחיר, להוסיף אזור או לבטל את הסינון לפי זמינות.</p>
              <Button variant="secondary" onClick={() => { resetFilters(); setRegionSel(""); }}>
                ניקוי כל הסינונים
              </Button>
            </Card>
          ) : (
            <ul className="mt-5 flex flex-col gap-3">
              {results.slice(0, visible).map((op) => (
                <ResultRow key={op.slug} op={op} date={date} compared={compare.includes(op.slug)} onCompare={() => toggleCompare(op.slug)} />
              ))}
            </ul>
          )}

          {view === "list" && visible < results.length && (
            <div className="mt-5 flex justify-center">
              <Button variant="secondary" onClick={() => setVisible((v) => v + 6)}>
                הצגת עוד מפעילים
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Compare bar */}
      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 md:bottom-6">
          <div className="animate-rise mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-contrast px-4 py-3 text-on-contrast shadow-float">
            <p className="text-[15px]">
              <span className="font-bold">{compare.length} מפעילים נבחרו להשוואה:</span>{" "}
              <span className="opacity-80">{compare.map((s) => publicOperators().find((o) => o.slug === s)?.name).join(", ")}</span>
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearCompare} className="min-h-10 rounded-xl px-3 text-sm font-semibold opacity-80 hover:opacity-100">
                ניקוי
              </button>
              <button
                type="button"
                disabled={compare.length < 2}
                onClick={() => setCompareOpen(true)}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-card px-4 text-sm font-bold text-ink disabled:opacity-50"
              >
                <Scale aria-hidden className="size-4" />
                השוואה זה לצד זה
              </button>
            </div>
          </div>
        </div>
      )}

      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="סינון"
        footer={
          <Button className="w-full" onClick={() => setFiltersOpen(false)}>
            הצגת {results.length} תוצאות
          </Button>
        }
      >
        <div className="mb-5">
          <p className="mb-2 font-bold">אזור</p>
          <Select aria-label="אזור" value={regionSel} onChange={(e) => setRegionSel(e.target.value)}>
            <option value="">כל האזורים</option>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </div>
        {filterPanel}
      </Sheet>

      <Sheet open={compareOpen} onClose={() => setCompareOpen(false)} title="השוואת מפעילים" wide>
        <CompareTable slugs={compare} date={date} />
      </Sheet>
    </>
  );
}

function ResultRow({ op, date, compared, onCompare }: { op: Operator; date: string; compared: boolean; onCompare: () => void }) {
  const pkg = op.packages.find((p) => p.popular) ?? op.packages[0];
  const available = availableOn(op, date);
  return (
    <li>
      <article className="grid gap-4 rounded-2xl border border-line bg-card p-3 sm:grid-cols-[200px_1fr_190px] sm:p-4">
        <OperatorMedia category={op.category} className="aspect-[16/9] rounded-xl sm:aspect-auto sm:min-h-36" />
        <div className="flex min-w-0 flex-col gap-1.5 px-1 sm:px-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            {op.sponsored && <Badge className="bg-sunken text-ink">ממומן</Badge>}
            <span className="text-muted">{categoryById[op.category].name}</span>
            {op.verified && (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <BadgeCheck aria-hidden className="size-4" />
                מפעיל מאומת
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold">
            <Link href={`/operators/${op.slug}?date=${date}`} className="hover:underline">
              {op.name}
            </Link>
          </h2>
          <Rating value={op.rating} count={op.reviewsCount} />
          <p className="text-sm text-muted">
            גילאי {op.ageMin}–{op.ageMax} · {op.regionLabel} · {op.durationLabel}
          </p>
          <p className="text-sm text-muted">כלול: {op.includes}</p>
          {available && (
            <p className="mt-1">
              <Badge tone="success">
                <Clock aria-hidden className="size-3.5" />
                פנוי ב־{shortDate(date)} · {availabilityWindow(op)}
              </Badge>
            </p>
          )}
        </div>
        <div className="flex flex-col justify-between gap-3 border-line px-1 sm:border-s sm:ps-4">
          <div className="flex items-baseline justify-between gap-2 sm:block">
            <p className="text-[13px] text-muted">החל מ־</p>
            <p className="text-2xl font-extrabold tabular">{money(priceFrom(op))}</p>
            <p className="text-[13px] text-muted">{pkg.maxKids ? `עד ${pkg.maxKids} ילדים` : "ללא הגבלת ילדים"}</p>
          </div>
          <div className="flex flex-col gap-1">
            <ButtonLink href={`/operators/${op.slug}?date=${date}`} className="w-full">
              לכרטיס המפעיל
            </ButtonLink>
            <Checkbox label="הוספה להשוואה" checked={compared} onChange={onCompare} className="justify-center text-sm" />
          </div>
        </div>
      </article>
    </li>
  );
}

function FilterPanel({ f, setF, onReset }: { f: Filters; setF: (f: Filters) => void; onReset: () => void }) {
  const [moreCats, setMoreCats] = useState(false);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">סינון</h2>
        <Button variant="link" size="sm" onClick={onReset}>
          ניקוי הכול
        </Button>
      </div>
      <div className="rounded-xl bg-accent-soft px-3">
        <Checkbox label={<span className="font-semibold text-accent-ink">רק מפעילים פנויים בתאריך שלי</span>} checked={f.onlyAvailable} onChange={() => setF({ ...f, onlyAvailable: !f.onlyAvailable })} />
      </div>
      <fieldset>
        <legend className="mb-1 font-bold">גיל הילדים</legend>
        {ageRanges.map((a) => (
          <Checkbox key={a.id} label={a.label} checked={f.ages.includes(a.id)} onChange={() => setF({ ...f, ages: toggle(f.ages, a.id) })} />
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-bold">מחיר לחבילה</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-[13px] text-muted">
            מ־
            <Input inputMode="numeric" placeholder="500 ₪" value={f.priceMin} onChange={(e) => setF({ ...f, priceMin: e.target.value.replace(/\D/g, "") })} />
          </label>
          <label className="flex flex-col gap-1 text-[13px] text-muted">
            עד
            <Input inputMode="numeric" placeholder="2,000 ₪" value={f.priceMax} onChange={(e) => setF({ ...f, priceMax: e.target.value.replace(/\D/g, "") })} />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1 font-bold">קטגוריה</legend>
        {(moreCats ? categories : categories.slice(0, 5)).map((c) => (
          <Checkbox key={c.id} label={c.name} checked={f.cats.includes(c.id)} onChange={() => setF({ ...f, cats: toggle(f.cats, c.id) })} />
        ))}
        <Button variant="link" size="sm" onClick={() => setMoreCats((v) => !v)} aria-expanded={moreCats}>
          {moreCats ? "פחות קטגוריות" : `עוד ${categories.length - 5} קטגוריות`}
        </Button>
      </fieldset>
      <fieldset>
        <legend className="mb-1 font-bold">איפה ההפעלה</legend>
        {locationTypes.map((l) => (
          <Checkbox key={l.id} label={l.label} checked={f.locs.includes(l.id)} onChange={() => setF({ ...f, locs: toggle(f.locs, l.id) })} />
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-1 font-bold">משך ההפעלה</legend>
        {[
          ["any", "כל משך"],
          ["short", "עד שעה"],
          ["mid", "שעה עד שעתיים"],
          ["long", "מעל שעתיים"],
        ].map(([v, l]) => (
          <Radio key={v} name="duration" label={l} checked={f.duration === v} onChange={() => setF({ ...f, duration: v as Filters["duration"] })} />
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-1 font-bold">דירוג</legend>
        {[
          ["4.5", "4.5 ומעלה"],
          ["4", "4 ומעלה"],
          ["any", "הכול"],
        ].map(([v, l]) => (
          <Radio key={v} name="rating" label={l} checked={f.rating === v} onChange={() => setF({ ...f, rating: v as Filters["rating"] })} />
        ))}
      </fieldset>
    </div>
  );
}

/* Region pins laid out north to south — a schematic, not a geographic map. */
const pinPos: Record<string, { x: number; y: number }> = {
  צפון: { x: 62, y: 10 },
  "חיפה והקריות": { x: 42, y: 24 },
  שרון: { x: 38, y: 40 },
  מרכז: { x: 34, y: 52 },
  ירושלים: { x: 62, y: 60 },
  שפלה: { x: 38, y: 66 },
  דרום: { x: 46, y: 86 },
};

function MiniMap({ results }: { results: Operator[] }) {
  return (
    <div className="relative h-36 bg-sunken" aria-label={`מפה: ${results.length} תוצאות`} role="img">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-line-strong" aria-hidden>
        <path d="M30 4 L66 2 L70 20 L60 40 L66 62 L58 98 L42 98 L30 70 L26 46 L32 26 Z" fill="var(--card)" stroke="currentColor" strokeWidth="0.6" />
      </svg>
      {regions.map((r) => {
        const n = results.filter((o) => o.regions.includes(r)).length;
        if (!n) return null;
        return (
          <span key={r} className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-3 ring-accent/25" style={{ left: `${pinPos[r].x}%`, top: `${pinPos[r].y}%` }} />
        );
      })}
      <span className="absolute top-3 start-3 flex items-center gap-1 rounded-full bg-card px-2.5 py-0.5 text-[13px] font-semibold">
        <MapPin aria-hidden className="size-3.5" />
        מפה
      </span>
    </div>
  );
}

function BigMap({ results, region, onRegion }: { results: Operator[]; region: string; onRegion: (r: string) => void }) {
  return (
    <div className="grid md:grid-cols-[1fr_280px]">
      <div className="relative min-h-[420px] bg-sunken">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full text-line-strong" aria-hidden>
          <path d="M30 4 L66 2 L70 20 L60 40 L66 62 L58 98 L42 98 L30 70 L26 46 L32 26 Z" fill="var(--card)" stroke="currentColor" strokeWidth="0.4" />
        </svg>
        {regions.map((r) => {
          const n = results.filter((o) => o.regions.includes(r)).length;
          const active = region === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onRegion(active ? "" : r)}
              aria-pressed={active}
              className={cx(
                "absolute flex min-h-9 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold shadow-card transition-colors",
                active ? "bg-accent text-white" : n ? "bg-card text-ink hover:bg-accent-soft" : "bg-card/70 text-subtle",
              )}
              style={{ left: `${pinPos[r].x}%`, top: `${pinPos[r].y}%` }}
            >
              <MapPin aria-hidden className="size-3.5" />
              {r} · {n}
            </button>
          );
        })}
      </div>
      <ul className="max-h-[420px] overflow-y-auto border-line md:border-s">
        {results.map((o) => (
          <li key={o.slug} className="border-b border-line last:border-0">
            <Link href={`/operators/${o.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken">
              <OperatorMedia category={o.category} className="size-12 shrink-0 rounded-lg" iconClassName="size-5" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{o.name}</span>
                <span className="block truncate text-[13px] text-muted">{o.regionLabel}</span>
              </span>
              <span className="text-sm font-bold tabular">{money(priceFrom(o))}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompareTable({ slugs, date }: { slugs: string[]; date: string }) {
  const ops = slugs.map((s) => publicOperators().find((o) => o.slug === s)).filter(Boolean) as Operator[];
  const rows: { label: string; render: (o: Operator) => React.ReactNode }[] = [
    { label: "מחיר החל מ", render: (o) => <strong className="tabular">{money(priceFrom(o))}</strong> },
    { label: "דירוג", render: (o) => (
      <span className="inline-flex items-center gap-1">
        <Star aria-hidden className="size-4 fill-star text-star" />
        <span className="tabular">{o.rating.toFixed(1)}</span>
        <span className="text-muted">({o.reviewsCount})</span>
      </span>
    ) },
    { label: "גילאים", render: (o) => `${o.ageMin}–${o.ageMax}` },
    { label: "משך", render: (o) => durationText(Math.min(...o.packages.map((p) => p.durationMin))) },
    { label: "אזורי שירות", render: (o) => o.regionLabel },
    { label: "מה כלול", render: (o) => o.includes },
    { label: "פנוי ב־" + shortDate(date), render: (o) => (availableOn(o, date) ? <Badge tone="success">פנוי</Badge> : <Badge>לא פנוי</Badge>) },
    { label: "ביטוח צד ג׳", render: (o) => (o.insured ? "בתוקף" : "—") },
  ];
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[520px] border-collapse text-[15px]">
        <thead>
          <tr>
            <th className="w-32" />
            {ops.map((o) => (
              <th key={o.slug} scope="col" className="p-2 text-start align-bottom">
                <OperatorMedia category={o.category} className="mb-2 aspect-[16/9] rounded-lg" iconClassName="size-7" />
                <span className="font-bold">{o.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-line">
              <th scope="row" className="p-2 text-start align-top text-sm font-medium text-muted">
                {r.label}
              </th>
              {ops.map((o) => (
                <td key={o.slug} className="p-2 align-top">
                  {r.render(o)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-line">
            <td />
            {ops.map((o) => (
              <td key={o.slug} className="p-2">
                <ButtonLink href={`/operators/${o.slug}?date=${date}`} size="sm" className="w-full">
                  לכרטיס
                </ButtonLink>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
