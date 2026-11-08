"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { categoryById, operatorBySlug } from "@/lib/data";
import { useStore } from "@/lib/store";
import { OperatorMedia } from "@/components/brand";
import { Badge, Button, Card, CardHeader, Field, Tabs, Textarea, buttonClass, cx } from "@/components/ui";

const omit = <T,>(o: Record<string, T>, key: string) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== key)) as Record<string, T>;

type Tab = "profiles" | "content" | "flagged" | "complaints";

type DocState = "ok" | "missing" | "expired";
const queue: { slug: string; type: string; submitted: string; state: { label: string; tone: "danger" | "success" | "warning" }; docs: { name: string; note: string; state: DocState }[] }[] = [
  {
    slug: "pinat-hachai",
    type: "עוסק מורשה",
    submitted: "נרשם לפני יומיים",
    state: { label: "חסר מסמך אחד", tone: "danger" },
    docs: [
      { name: "ביטוח צד ג׳", note: "בתוקף עד 08/2027", state: "ok" },
      { name: "אישור היעדר עבירות מין", note: "2 מתוך 2 אנשי צוות", state: "ok" },
      { name: "רישיון להצגת בעלי חיים", note: "נדרש בקטגוריה הזו", state: "missing" },
      { name: "תעודת עוסק", note: "", state: "ok" },
    ],
  },
  {
    slug: "kfitzot-anak",
    type: "חברה בע״מ",
    submitted: "עדכון פרופיל: מתקן חדש",
    state: { label: "מוכן לאישור", tone: "success" },
    docs: [
      { name: "ביטוח צד ג׳", note: "בתוקף עד 02/2027", state: "ok" },
      { name: "אישור היעדר עבירות מין", note: "3 מתוך 3 אנשי צוות", state: "ok" },
      { name: "תקן למתקנים מתנפחים", note: "ת״י 5515", state: "ok" },
      { name: "תעודת התאגדות", note: "", state: "ok" },
    ],
  },
  {
    slug: "studio-tzeva",
    type: "עוסק פטור",
    submitted: "עדכון פרופיל",
    state: { label: "ביטוח פג תוקף", tone: "warning" },
    docs: [
      { name: "ביטוח צד ג׳", note: "פג ב־10/2026", state: "expired" },
      { name: "אישור היעדר עבירות מין", note: "1 מתוך 1", state: "ok" },
      { name: "תעודת עוסק", note: "", state: "ok" },
    ],
  },
];

const complaints = [
  { id: "C-207", order: 10377, who: "לקוחה · יעל מ.", topic: "המפעיל הגיע באיחור של שעה", opened: "לפני 3 ימים", late: true, owner: "לא שויך" },
  { id: "C-211", order: 10431, who: "מפעיל · הקוסם נועם", topic: "הלקוח ביטל ביום האירוע ומבקש את המקדמה", opened: "אתמול", late: false, owner: "אני" },
];

const flagged = [
  { id: "f1", on: "קפיצות ענק", score: 2, text: "המתקן היה מלוכלך והמפעיל עזב באמצע לעשן. לא נעים בכלל.", report: "לא עזבתי, יצאתי להביא מתקן מהרכב" },
  { id: "f2", on: "מדע בקופסה", score: 1, text: "לא רלוונטי, התקשרו אליי ממספר של מתחרה והציעו מחיר זול יותר.", report: "הביקורת לא עוסקת בהפעלה" },
];

export function ApprovalsView() {
  const params = useSearchParams();
  const admin = useStore((s) => s.admin);
  const setAdmin = useStore((s) => s.setAdmin);
  const toast = useStore((s) => s.toast);
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "profiles");
  // Follow the sidebar's ?tab= links while already on this page.
  const urlTab = params.get("tab") as Tab | null;
  const [seenUrlTab, setSeenUrlTab] = useState(urlTab);
  if (urlTab !== seenUrlTab) {
    setSeenUrlTab(urlTab);
    if (urlTab) setTab(urlTab);
  }
  const [sel, setSel] = useState(queue[0].slug);
  const [msg, setMsg] = useState<Record<string, string>>({
    "pinat-hachai": "שלום! חסר רישיון להצגת בעלי חיים. אפשר להעלות אותו באזור המפעילים, ונאשר את הפרופיל מיד אחרי.",
    "studio-tzeva": "שלום! פוליסת הביטוח פגה ב־10/2026. העלו פוליסה בתוקף כדי שהפרופיל יחזור לתוצאות החיפוש.",
  });

  const pendingQueue = queue.filter((q) => !admin.approvals[q.slug]);
  const current = queue.find((q) => q.slug === sel)!;
  const op = operatorBySlug(current.slug)!;
  const decided = admin.approvals[current.slug];
  const openComplaints = complaints.filter((c) => admin.complaints[c.id] !== "closed").length;
  const openFlagged = flagged.filter((f) => !admin.flagged[f.id]).length;

  const decide = (v: "approved" | "rejected" | "info_requested", note: string) => {
    setAdmin((a) => ({ ...a, approvals: { ...a.approvals, [current.slug]: v } }));
    toast(note, v === "rejected" ? "neutral" : "success");
    const next = pendingQueue.find((q) => q.slug !== current.slug);
    if (next) setSel(next.slug);
  };

  return (
    <>
      <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">אישורים ובקרת תוכן</h1>
      <Tabs
        className="mt-5"
        label="סוג בקרה"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "profiles", label: `פרופילים לאישור (${pendingQueue.length})` },
          { value: "content", label: "תמונות ותוכן (5)" },
          { value: "flagged", label: `ביקורות שדווחו (${openFlagged})` },
          { value: "complaints", label: `תלונות (${openComplaints})` },
        ]}
      />

      {tab === "profiles" && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr] lg:items-start">
          <ul className="flex flex-col gap-2">
            {queue.map((q) => {
              const o = operatorBySlug(q.slug)!;
              const d = admin.approvals[q.slug];
              return (
                <li key={q.slug}>
                  <button
                    type="button"
                    aria-current={sel === q.slug ? "true" : undefined}
                    onClick={() => setSel(q.slug)}
                    className={cx("w-full rounded-2xl border bg-card p-4 text-start", sel === q.slug ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong", d && "opacity-60")}
                  >
                    <span className="block text-[17px] font-bold">{o.name}</span>
                    <span className="block text-sm text-muted">
                      {categoryById[o.category].name} · {o.regionLabel}
                    </span>
                    <span className={cx("mt-1 block text-sm font-bold", d ? "text-muted" : q.state.tone === "danger" ? "text-danger" : q.state.tone === "success" ? "text-success" : "text-warning")}>
                      {d === "approved" ? "אושר ופורסם" : d === "rejected" ? "נדחה" : d === "info_requested" ? "נשלחה בקשת השלמה" : q.state.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">{op.name}</h2>
                <p className="mt-1 text-[15px] text-muted">
                  {categoryById[op.category].name} · {current.type} · {current.submitted}
                </p>
              </div>
              <Link href={`/operators/${op.slug}`} target="_blank" className={buttonClass("secondary", "sm")}>
                תצוגה מקדימה של הפרופיל
              </Link>
            </div>

            <h3 className="mt-6 font-bold">מסמכים</h3>
            <ul className="mt-2 divide-y divide-line">
              {current.docs.map((d) => (
                <li key={d.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-[15px]">{d.name}</span>
                  <span className="flex items-center gap-3">
                    {d.note && <span className="text-sm text-muted">{d.note}</span>}
                    <Badge tone={d.state === "ok" ? "success" : "danger"}>{d.state === "ok" ? "תקין" : d.state === "missing" ? "חסר" : "פג תוקף"}</Badge>
                    {d.state !== "missing" && (
                      <button type="button" className="min-h-9 text-sm font-semibold text-accent-ink hover:underline" onClick={() => toast("המסמך נפתח בחלון מאובטח", "neutral")}>
                        צפייה
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 font-bold">תמונות לבדיקה</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="relative">
                  <OperatorMedia category={op.category} className="aspect-[4/3] rounded-xl" iconClassName="size-6" label={`תמונה ${i + 1}`} />
                  {i === 2 && <Badge tone="warning" className="absolute bottom-2 start-2 text-[12px]">ילדים מזוהים</Badge>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] text-muted">תמונה שבה מזוהים ילדים עולה רק אם המפעיל סימן שיש הסכמה בכתב.</p>

            <Field label="הודעה למפעיל (אם חסר משהו)" htmlFor="adm-msg" className="mt-6">
              <Textarea id="adm-msg" rows={3} value={msg[current.slug] ?? ""} onChange={(e) => setMsg({ ...msg, [current.slug]: e.target.value })} placeholder="מה חסר ואיך להשלים" />
            </Field>

            {decided ? (
              <p className="mt-5 rounded-xl bg-sunken p-3 text-[15px]">
                {decided === "approved" ? "הפרופיל אושר ופורסם." : decided === "rejected" ? "הפרופיל נדחה והמפעיל קיבל הודעה." : "נשלחה בקשת השלמה למפעיל."}{" "}
                <button type="button" className="font-semibold text-accent-ink hover:underline" onClick={() => setAdmin((a) => ({ ...a, approvals: omit(a.approvals, current.slug) }))}>
                  ביטול ההחלטה
                </button>
              </p>
            ) : (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                <Button size="lg" disabled={current.docs.some((d) => d.state !== "ok")} onClick={() => decide("approved", `${op.name} אושר ופורסם`)}>
                  אישור ופרסום
                </Button>
                <Button size="lg" variant="secondary" disabled={!msg[current.slug]?.trim()} onClick={() => decide("info_requested", "בקשת ההשלמה נשלחה למפעיל")}>
                  בקשת השלמה
                </Button>
                <Button size="lg" variant="danger" onClick={() => decide("rejected", "הפרופיל נדחה")}>
                  דחייה
                </Button>
              </div>
            )}
            {!decided && current.docs.some((d) => d.state !== "ok") && <p className="mt-2 text-[13px] text-muted">אפשר לאשר רק כשכל המסמכים תקינים.</p>}
          </Card>
        </div>
      )}

      {tab === "content" && (
        <Card className="mt-5 p-5">
          <CardHeader title="תמונות שמחכות לבדיקה" sub="תמונות עם ילדים מזוהים מתפרסמות רק עם הסכמה מסומנת" />
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(["water", "magic", "science", "art", "sport"] as const).map((c, i) => (
              <li key={c} className="flex flex-col gap-2">
                <OperatorMedia category={c} className="aspect-[4/3] rounded-xl" iconClassName="size-6" label={`תמונה מ${categoryById[c].name}`} />
                <span className="text-[13px] text-muted">{i % 2 ? "ילדים מזוהים · יש הסכמה" : "בלי ילדים מזוהים"}</span>
                <div className="flex gap-1.5">
                  <Button size="sm" className="flex-1" onClick={() => toast("התמונה אושרה")}>
                    אישור
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => toast("התמונה הוסרה", "neutral")}>
                    הסרה
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(tab === "complaints" || tab === "profiles") && (
        <Card className="mt-5 p-5">
          <CardHeader title="תלונות" />
          <div className="-mx-5 mt-3 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] border-collapse text-[15px]">
              <caption className="sr-only">תלונות פתוחות</caption>
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  {["פנייה", "הזמנה", "מי פנה", "נושא", "נפתחה", "מטפל", "סטטוס", ""].map((h, i) => (
                    <th key={i} scope="col" className="px-3 py-2.5 text-start font-medium first:ps-0">
                      {h || <span className="sr-only">פעולה</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const st = admin.complaints[c.id] ?? "open";
                  return (
                    <tr key={c.id} className="border-b border-line last:border-0">
                      <td className="py-3 text-muted tabular">{c.id}</td>
                      <td className="px-3 text-muted tabular">#{c.order}</td>
                      <td className="px-3 font-bold">{c.who}</td>
                      <td className="px-3">{c.topic}</td>
                      <td className={cx("px-3", c.late && st !== "closed" ? "font-bold text-danger" : "text-muted")}>{c.opened}</td>
                      <td className="px-3 text-muted">{st === "open" ? c.owner : "אני"}</td>
                      <td className="px-3">
                        <Badge tone={st === "open" ? "danger" : st === "in_progress" ? "warning" : "success"}>{st === "open" ? "פתוחה" : st === "in_progress" ? "בטיפול" : "נסגרה"}</Badge>
                      </td>
                      <td className="px-3 text-end">
                        {st !== "closed" && (
                          <button
                            type="button"
                            className="min-h-9 text-sm font-semibold text-accent-ink hover:underline"
                            onClick={() => {
                              setAdmin((a) => ({ ...a, complaints: { ...a.complaints, [c.id]: st === "open" ? "in_progress" : "closed" } }));
                              toast(st === "open" ? `${c.id} שויכה אליך` : `${c.id} נסגרה`);
                            }}
                          >
                            {st === "open" ? "טיפול" : "סגירה"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(tab === "flagged" || tab === "profiles") && (
        <section aria-labelledby="flagged-title" className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="flagged-title" className="text-xl font-extrabold">
              ביקורות שדווחו
            </h2>
            <p className="text-sm text-muted">ביקורת שלילית לא מוסתרת רק בגלל שהיא שלילית, אלא רק אם היא מפרה את המדיניות</p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {flagged.map((f) => {
              const st = admin.flagged[f.id];
              return (
                <Card key={f.id} className="p-5">
                  <p className="text-sm text-muted">
                    על <strong className="text-ink">{f.on}</strong> · {f.score} / 5 · הזמנה מאומתת
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed">{f.text}</p>
                  <p className="mt-2 rounded-xl bg-sunken px-3 py-2 text-sm">דיווח של המפעיל: ״{f.report}״</p>
                  {st ? (
                    <p className="mt-3 text-sm font-semibold text-muted">
                      {st === "kept" ? "הביקורת נשארה" : "הביקורת הוסתרה"} ·{" "}
                      <button type="button" className="text-accent-ink hover:underline" onClick={() => setAdmin((a) => ({ ...a, flagged: omit(a.flagged, f.id) }))}>
                        ביטול
                      </button>
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => { setAdmin((a) => ({ ...a, flagged: { ...a.flagged, [f.id]: "kept" } })); toast("הביקורת נשארת"); }}>
                        השארת הביקורת
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => { setAdmin((a) => ({ ...a, flagged: { ...a.flagged, [f.id]: "hidden" } })); toast("הביקורת הוסתרה", "neutral"); }}>
                        הסתרה
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => toast("נשלחה פנייה לכותב/ת הביקורת", "neutral")}>
                        פנייה לכותב
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
