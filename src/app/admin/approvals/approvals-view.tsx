"use client";

import { useState } from "react";
import { categoryById } from "@/lib/data";
import type { AdminOperator } from "@/lib/db";
import { setOperatorStatus } from "@/app/actions";
import { useAction } from "@/components/use-action";
import { useStore } from "@/lib/store";
import { OperatorMedia } from "@/components/brand";
import { Badge, Button, Card, CardHeader, Field, PageTitle, SampleBadge, Tabs, Textarea, cx } from "@/components/ui";

type Tab = "profiles" | "content" | "flagged" | "complaints";

const typeLabel: Record<string, string> = { exempt: "עוסק פטור", licensed: "עוסק מורשה", ltd: "חברה בע״מ", nonprofit: "עמותה" };

// Complaints and reported reviews have no tables yet; these rows illustrate the workflow.
const sampleComplaints = [
  { id: "C-207", order: 10377, who: "לקוחה · יעל מ.", topic: "המפעיל הגיע באיחור של שעה", opened: "לפני 3 ימים", late: true },
  { id: "C-211", order: 10431, who: "מפעיל · הקוסם נועם", topic: "הלקוח ביטל ביום האירוע ומבקש את המקדמה", opened: "אתמול", late: false },
];
const sampleFlagged = [
  { id: "f1", on: "קפיצות ענק", score: 2, text: "המתקן היה מלוכלך והמפעיל עזב באמצע לעשן. לא נעים בכלל.", report: "לא עזבתי, יצאתי להביא מתקן מהרכב" },
  { id: "f2", on: "מדע בקופסה", score: 1, text: "לא רלוונטי, התקשרו אליי ממספר של מתחרה והציעו מחיר זול יותר.", report: "הביקורת לא עוסקת בהפעלה" },
];

const docState = (s: string) => s as "ok" | "missing" | "expired" | "optional";

export function ApprovalsView({ operators }: { operators: AdminOperator[] }) {
  const toast = useStore((s) => s.toast);
  const [run, pending] = useAction();
  const [tab, setTab] = useState<Tab>("profiles");

  const queue = operators.filter((o) => o.status === "pending");
  const [selId, setSelId] = useState<string | null>(queue[0]?.id ?? null);
  const current = queue.find((o) => o.id === selId) ?? queue[0];
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [complaints, setComplaints] = useState<Record<string, "open" | "in_progress" | "closed">>({ "C-207": "open", "C-211": "in_progress" });
  const [flagged, setFlagged] = useState<Record<string, "kept" | "hidden">>({});

  const missingDocs = (o: AdminOperator) => o.documents.filter((d) => docState(d.state) === "missing" || docState(d.state) === "expired").length;
  const docsOk = (o: AdminOperator) => o.documents.length > 0 && missingDocs(o) === 0;
  const openComplaints = sampleComplaints.filter((c) => complaints[c.id] !== "closed").length;
  const openFlagged = sampleFlagged.filter((f) => !flagged[f.id]).length;

  const decide = (o: AdminOperator, status: "active" | "pending" | "rejected", note: string | null, success: string) =>
    run(() => setOperatorStatus(o.id, status, note), {
      success,
      tone: status === "rejected" ? "neutral" : "success",
      onDone: () => setSelId(queue.find((q) => q.id !== o.id)?.id ?? null),
    });

  return (
    <>
      <PageTitle title="אישורים ובקרה" />
      <Tabs
        className="mt-5"
        label="סוג בקרה"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "profiles", label: `פרופילים לאישור (${queue.length})` },
          { value: "content", label: "תמונות ותוכן" },
          { value: "flagged", label: `ביקורות שדווחו (${openFlagged})` },
          { value: "complaints", label: `תלונות (${openComplaints})` },
        ]}
      />

      {tab === "profiles" &&
        (!current ? (
          <Card className="mt-5 px-6 py-14 text-center">
            <p className="text-lg font-bold">אין פרופילים שמחכים לאישור</p>
            <p className="mt-1 text-[15px] text-muted">מפעיל חדש שמסיים את טופס ההצטרפות יופיע כאן.</p>
          </Card>
        ) : (
          <div className={cx("mt-5 grid gap-4 lg:items-start", queue.length > 1 && "lg:grid-cols-[300px_1fr]")}>
            <ul className={cx("flex flex-col gap-2", queue.length < 2 && "hidden")}>
              {queue.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    aria-current={current.id === o.id ? "true" : undefined}
                    onClick={() => setSelId(o.id)}
                    className={cx("w-full rounded-2xl border bg-card p-4 text-start", current.id === o.id ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong")}
                  >
                    <span className="block text-[17px] font-bold">{o.name}</span>
                    <span className="block text-sm text-muted">
                      {categoryById[o.category]?.name} · {o.regionLabel || "—"}
                    </span>
                    <span className={cx("mt-1 block text-sm font-bold", docsOk(o) ? "text-success" : "text-danger")}>
                      {docsOk(o) ? "מוכן לאישור" : missingDocs(o) === 1 ? "חסר מסמך אחד" : `חסרים ${missingDocs(o) || "כל ה"} מסמכים`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <Card className="p-5 sm:p-6">
              <h2 className="text-2xl font-extrabold">{current.name}</h2>
              <p className="mt-1 text-[15px] text-muted">
                {categoryById[current.category]?.name} · {typeLabel[current.business.type] ?? current.business.type ?? "—"} · נרשם {new Date(current.createdAt).toLocaleDateString("he-IL")}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  ["בעל העסק", current.business.owner || "—"],
                  ["מספר עוסק", current.business.taxId || "—"],
                  ["טלפון", current.business.phone || "—"],
                  ["גילאים", `${current.ageMin}–${current.ageMax}`],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-xl bg-sunken p-3">
                    <dt className="text-[13px] text-muted">{t}</dt>
                    <dd className="mt-0.5 font-bold tabular">{d}</dd>
                  </div>
                ))}
              </dl>

              {current.about && <p className="mt-4 rounded-xl bg-sunken p-3 text-[15px] leading-relaxed">{current.about}</p>}

              <h3 className="mt-6 font-bold">מסמכים</h3>
              <ul className="mt-2 divide-y divide-line">
                {current.documents.map((d) => {
                  const st = docState(d.state);
                  return (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <span className="text-[15px]">{d.name}</span>
                      <span className="flex items-center gap-3">
                        {d.note && <span className="text-sm text-muted">{d.note}</span>}
                        <Badge tone={st === "ok" ? "success" : st === "optional" ? "neutral" : "danger"}>
                          {st === "ok" ? "התקבל" : st === "missing" ? "חסר" : st === "expired" ? "פג תוקף" : "לא חובה"}
                        </Badge>
                      </span>
                    </li>
                  );
                })}
                {current.documents.length === 0 && <li className="py-3 text-[15px] text-muted">לא צורפו מסמכים</li>}
              </ul>

              <h3 className="mt-6 font-bold">חבילות</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {current.packages.map((p) => (
                  <li key={p.id} className="rounded-xl border border-line px-3 py-2 text-sm">
                    <strong>{p.name}</strong> · {p.price.toLocaleString("he-IL")} ₪
                  </li>
                ))}
              </ul>

              <Field label="הודעה למפעיל (אם חסר משהו)" htmlFor="adm-msg" className="mt-6">
                <Textarea id="adm-msg" rows={3} value={msg[current.id] ?? ""} onChange={(e) => setMsg({ ...msg, [current.id]: e.target.value })} placeholder="מה חסר ואיך להשלים" />
              </Field>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                <Button size="lg" disabled={pending || !docsOk(current)} onClick={() => decide(current, "active", null, `${current.name} אושר ופורסם`)}>
                  אישור ופרסום
                </Button>
                <Button size="lg" variant="secondary" disabled={pending || !msg[current.id]?.trim()} onClick={() => decide(current, "pending", msg[current.id].trim(), "בקשת ההשלמה נשלחה למפעיל")}>
                  בקשת השלמה
                </Button>
                <Button size="lg" variant="danger" disabled={pending} onClick={() => decide(current, "rejected", msg[current.id]?.trim() || null, "הפרופיל נדחה")}>
                  דחייה
                </Button>
              </div>
              {!docsOk(current) && <p className="mt-2 text-[13px] text-muted">אפשר לאשר רק כשכל מסמכי החובה התקבלו. שלחו בקשת השלמה עם מה שחסר.</p>}
            </Card>
          </div>
        ))}

      {tab === "content" && (
        <Card className="mt-5 p-5">
          <CardHeader title="תמונות שמחכות לבדיקה" sub="יופעל יחד עם העלאת התמונות. תמונות עם ילדים מזוהים יתפרסמו רק עם הסכמה מסומנת." />
          <ul className="mt-4 grid grid-cols-2 gap-3 opacity-60 sm:grid-cols-3 lg:grid-cols-5">
            {(["water", "magic", "science", "art", "sport"] as const).map((c) => (
              <li key={c}>
                <OperatorMedia category={c} className="aspect-[4/3] rounded-xl" iconClassName="size-6" />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "complaints" && (
        <Card className="mt-5 p-5">
          <CardHeader
            title={
              <>
                תלונות פתוחות
                <SampleBadge />
              </>
            }
            sub="פניות של לקוחות ומפעילים על הזמנה מסוימת"
          />
          <div className="-mx-5 mt-3 overflow-x-auto px-5">
            <table className="w-full min-w-[680px] border-collapse text-[15px]">
              <caption className="sr-only">תלונות</caption>
              <thead>
                <tr className="border-b border-line text-[13px] text-muted">
                  {["פנייה", "הזמנה", "מי פנה", "נושא", "נפתחה", "סטטוס", ""].map((h, i) => (
                    <th key={i} scope="col" className="px-3 py-2.5 text-start font-medium first:ps-0">
                      {h || <span className="sr-only">פעולה</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleComplaints.map((c) => {
                  const st = complaints[c.id] ?? "open";
                  return (
                    <tr key={c.id} className="border-b border-line last:border-0">
                      <td className="py-3 text-muted tabular">{c.id}</td>
                      <td className="px-3 text-muted tabular">#{c.order}</td>
                      <td className="px-3 font-bold">{c.who}</td>
                      <td className="px-3">{c.topic}</td>
                      <td className={cx("px-3", c.late && st !== "closed" ? "font-bold text-danger" : "text-muted")}>{c.opened}</td>
                      <td className="px-3">
                        <Badge tone={st === "open" ? "danger" : st === "in_progress" ? "warning" : "success"}>{st === "open" ? "פתוחה" : st === "in_progress" ? "בטיפול" : "נסגרה"}</Badge>
                      </td>
                      <td className="px-3 text-end">
                        {st !== "closed" && (
                          <button
                            type="button"
                            className="min-h-9 text-sm font-semibold text-accent-ink hover:underline"
                            onClick={() => {
                              setComplaints((x) => ({ ...x, [c.id]: st === "open" ? "in_progress" : "closed" }));
                              toast(st === "open" ? `${c.id} בטיפול` : `${c.id} נסגרה`, "neutral");
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

      {tab === "flagged" && (
        <section aria-labelledby="flagged-title" className="mt-5">
          <h2 id="flagged-title" className="text-lg font-bold">
            ביקורות שמפעילים דיווחו עליהן
            <SampleBadge />
          </h2>
          <p className="mt-1 text-sm text-muted">ביקורת שלילית לא מוסתרת רק בגלל שהיא שלילית, אלא רק אם היא מפרה את המדיניות.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {sampleFlagged.map((f) => {
              const st = flagged[f.id];
              return (
                <Card key={f.id} className="p-5">
                  <p className="text-sm text-muted">
                    על <strong className="text-ink">{f.on}</strong> · {f.score} / 5 · הזמנה מאומתת
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed">{f.text}</p>
                  <p className="mt-2 rounded-xl bg-sunken px-3 py-2 text-sm">דיווח של המפעיל: ״{f.report}״</p>
                  {st ? (
                    <p className="mt-3 text-sm font-semibold text-muted">{st === "kept" ? "הביקורת נשארה" : "הביקורת הוסתרה"}</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setFlagged((x) => ({ ...x, [f.id]: "kept" }))}>
                        השארת הביקורת
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setFlagged((x) => ({ ...x, [f.id]: "hidden" }))}>
                        הסתרה
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
