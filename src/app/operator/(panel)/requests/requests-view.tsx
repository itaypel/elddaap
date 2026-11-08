"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import {
  type Booking,
  COMMISSION,
  CURRENT_OPERATOR,
  addMinutes,
  bookingTotal,
  dayLabel,
  locationTypes,
  money,
  operatorBySlug,
  overlaps,
  packageOf,
  pre,
  shortDate,
  statusMeta,
  weekday,
} from "@/lib/data";
import { useStore } from "@/lib/store";
import { hoursLeft } from "@/lib/ops";
import { Sheet } from "@/components/sheet";
import { Badge, Button, Card, Field, Input, PageTitle, Radio, Select, StatusTrack, Tabs, Textarea, cx } from "@/components/ui";

type Tab = "new" | "payment" | "approved" | "closed";

const inTab = (b: Booking, t: Tab) =>
  t === "new" ? b.status === "pending" : t === "payment" ? b.status === "awaiting_payment" : t === "approved" ? b.status === "confirmed" || b.status === "completed" : b.status === "cancelled" || b.status === "declined";

export function RequestsView() {
  const params = useSearchParams();
  const all = useStore((s) => s.bookings).filter((b) => b.operatorSlug === CURRENT_OPERATOR);
  const [tab, setTab] = useState<Tab>("new");
  const list = all.filter((b) => inTab(b, tab)).sort((a, b) => (tab === "new" ? hoursLeft(a) - hoursLeft(b) : a.date.localeCompare(b.date)));
  const [selectedId, setSelectedId] = useState<number | null>(Number(params.get("id")) || null);
  const selected = list.find((b) => b.id === selectedId) ?? list[0];
  const detailRef = useRef<HTMLDivElement>(null);

  const counts = (t: Tab) => all.filter((b) => inTab(b, t)).length;

  return (
    <>
      <PageTitle title="בקשות להזמנה" />
      <Tabs
        className="mt-5"
        label="סטטוס בקשות"
        value={tab}
        onChange={(t) => {
          setTab(t);
          setSelectedId(null);
        }}
        tabs={[
          { value: "new", label: `חדשות (${counts("new")})` },
          { value: "payment", label: `ממתינות לתשלום (${counts("payment")})` },
          { value: "approved", label: `מאושרות (${counts("approved")})` },
          { value: "closed", label: `נדחו ובוטלו (${counts("closed")})` },
        ]}
      />

      {list.length === 0 ? (
        <Card className="mt-5 px-6 py-14 text-center">
          <p className="text-lg font-bold">{tab === "new" ? "אין בקשות חדשות" : "אין כאן כלום כרגע"}</p>
          <p className="mt-1 text-[15px] text-muted">{tab === "new" ? "בקשה חדשה תופיע כאן, ונשלח לכם גם הודעת וואטסאפ." : "בקשות יעברו לכאן לפי הסטטוס שלהן."}</p>
        </Card>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[340px_1fr] lg:items-start">
          <ul className="flex flex-col gap-2" aria-label="רשימת בקשות">
            {list.map((b) => {
              const active = selected?.id === b.id;
              const h = hoursLeft(b);
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      setSelectedId(b.id);
                      if (window.matchMedia("(max-width: 1023px)").matches) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={cx("w-full rounded-2xl border bg-card p-4 text-start transition-colors", active ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong")}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[17px] font-bold">{b.customerName}</span>
                      {b.status === "pending" && <span className={cx("shrink-0 text-[13px] font-bold", h <= 8 ? "text-danger" : "text-warning")}>נותרו {h} שעות</span>}
                    </span>
                    <span className="mt-1 block text-[15px]">
                      {b.eventType} · {weekday(b.date)} {shortDate(b.date)}, {b.time}–{addMinutes(b.time, packageOf(b)?.durationMin ?? 90)}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {packageOf(b)?.name} · {b.kids} ילדים · גילאי {b.ageRange} · {money(bookingTotal(b))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div ref={detailRef} className="scroll-mt-20">
            {selected && <RequestDetail key={selected.id} b={selected} all={all} />}
          </div>
        </div>
      )}
    </>
  );
}

function RequestDetail({ b, all }: { b: Booking; all: Booking[] }) {
  const approve = useStore((s) => s.approve);
  const decline = useStore((s) => s.decline);
  const propose = useStore((s) => s.propose);
  const toast = useStore((s) => s.toast);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [alt, setAlt] = useState({ date: b.date, time: "12:30" });
  const [reason, setReason] = useState("busy");
  const [msg, setMsg] = useState("");

  const pkg = packageOf(b);
  const total = bookingTotal(b);
  const net = Math.round(total * (1 - COMMISSION));
  const meta = statusMeta[b.status];
  const end = addMinutes(b.time, pkg?.durationMin ?? 90);
  const clashes = all.filter((o) => o.id !== b.id && (o.status === "pending" || o.status === "awaiting_payment" || o.status === "confirmed") && overlaps(o, b));
  const blockingClash = clashes.find((o) => o.status !== "pending");
  const h = hoursLeft(b);
  const op = operatorBySlug(b.operatorSlug)!;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">{b.customerName}</h2>
          <p className="mt-1 text-[15px] text-muted">
            {b.eventType} · הזמנה #{b.id}
          </p>
        </div>
        <Badge tone={b.status === "pending" ? "warning" : meta.tone} className="text-sm">
          {meta.label}
          {b.status === "pending" && ` · נותרו ${h} שעות`}
        </Badge>
      </div>

      {b.status !== "cancelled" && b.status !== "declined" && <StatusTrack className="mt-5" step={meta.step} />}

      <dl className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["מתי", `${weekday(b.date)} ${shortDate(b.date)}, ${b.time}–${end}`],
          ["איפה", `${b.city} · ${b.distanceKm} ק״מ מכם`],
          ["ילדים", `${b.kids} · גילאי ${b.ageRange}`],
          ["חבילה", pkg?.name ?? "—"],
          ["מחיר ללקוח", money(total)],
          ["יגיע אליכם אחרי עמלה", money(net)],
          ["מקום", locationTypes.find((l) => l.id === b.locationType)?.short ?? "—"],
          ["טלפון", b.status === "pending" ? "ייחשף אחרי האישור" : b.phone],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl bg-sunken p-3">
            <dt className="text-[13px] text-muted">{t}</dt>
            <dd className="mt-0.5 font-bold tabular">{d}</dd>
          </div>
        ))}
      </dl>

      {b.notes && (
        <div className="mt-5">
          <h3 className="font-bold">הערות מהלקוח</h3>
          <p className="mt-2 rounded-xl bg-sunken p-3 text-[15px] leading-relaxed">{b.notes}</p>
        </div>
      )}

      {b.proposal && (
        <p className="mt-5 rounded-xl bg-accent-soft p-3 text-[15px] text-accent-ink">
          הצעתם מועד חלופי: {dayLabel(b.proposal.date)} ב־{b.proposal.time}. מחכים לתשובת הלקוח.
        </p>
      )}

      {b.status === "pending" && clashes.length > 0 && (
        <div role="note" className="mt-5 flex gap-3 rounded-xl bg-warning-soft p-4 text-[15px] leading-relaxed text-warning">
          <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>התנגשות ביומן.</strong>{" "}
            {clashes.map((c) => `${c.customerName} ביקש/ה את ${c.time} באותו יום`).join("; ")}.{" "}
            {blockingClash ? `כבר אישרתם את #${blockingClash.id}, אז אפשר רק להציע מועד אחר.` : "אפשר לאשר רק אחת מהבקשות, והשנייה תקבל הצעה למועד אחר."}
          </p>
        </div>
      )}

      {b.status === "pending" && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                disabled={!!blockingClash}
                onClick={() => {
                  const r = approve(b.id);
                  if (r.ok) toast(`אישרתם את הבקשה של ${b.customerName}. הלקוח קיבל הודעה.`);
                  else toast(r.reason ?? "אי אפשר לאשר כרגע", "danger");
                }}
              >
                אישור הבקשה
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setProposeOpen(true)}>
                הצעת מועד אחר
              </Button>
              <Button size="lg" variant="danger" onClick={() => setDeclineOpen(true)}>
                דחייה
              </Button>
            </div>
            <Button variant="link" onClick={() => setMsgOpen(true)}>
              הודעה ללקוח
            </Button>
          </div>
          <p className="mt-3 text-[13px] text-muted">אחרי האישור הלקוח מקבל הודעה ויש לו 48 שעות לשלם מקדמה. עד התשלום השעה שמורה לו ביומן שלכם.</p>
        </>
      )}

      {b.status !== "pending" && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
          <Button variant="secondary" onClick={() => setMsgOpen(true)}>
            הודעה ללקוח
          </Button>
          {b.status !== "cancelled" && b.status !== "declined" && (
            <a href={`https://waze.com/ul?q=${encodeURIComponent(b.address || b.city)}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-xl border border-line-strong px-5 text-[15px] font-semibold hover:bg-sunken">
              ניווט לאירוע
            </a>
          )}
        </div>
      )}

      <Sheet
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        title="הצעת מועד אחר"
        footer={
          <Button
            className="w-full"
            onClick={() => {
              propose(b.id, alt.date, alt.time);
              setProposeOpen(false);
              toast("ההצעה נשלחה ללקוח");
            }}
          >
            שליחת ההצעה
          </Button>
        }
      >
        <p className="mb-4 text-[15px] text-muted">הלקוח יקבל את ההצעה ויוכל לאשר אותה בלחיצה. הבקשה נשארת פתוחה עד שיענה.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="תאריך" htmlFor="alt-date">
            <Input id="alt-date" type="date" min="2026-11-08" value={alt.date} onChange={(e) => setAlt({ ...alt, date: e.target.value })} />
          </Field>
          <Field label="שעה" htmlFor="alt-time">
            <Select id="alt-time" value={alt.time} onChange={(e) => setAlt({ ...alt, time: e.target.value })}>
              {op.slots.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Sheet>

      <Sheet
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="לדחות את הבקשה?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setDeclineOpen(false)}>
              חזרה
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                decline(b.id);
                setDeclineOpen(false);
                toast("הבקשה נדחתה. הלקוח יקבל הצעות ממפעילים אחרים.", "neutral");
              }}
            >
              דחיית הבקשה
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-[15px] text-muted">הלקוח יקבל הודעה ונציע לו מפעילים אחרים שפנויים. במקום לדחות, אפשר גם להציע מועד אחר.</p>
        <fieldset>
          <legend className="mb-1 font-bold">סיבה (לא תוצג ללקוח)</legend>
          <Radio name="reason" checked={reason === "busy"} onChange={() => setReason("busy")} label="אין לי זמינות במועד" />
          <Radio name="reason" checked={reason === "area"} onChange={() => setReason("area")} label="מחוץ לאזור השירות" />
          <Radio name="reason" checked={reason === "fit"} onChange={() => setReason("fit")} label="ההפעלה לא מתאימה לגיל או למקום" />
          <Radio name="reason" checked={reason === "other"} onChange={() => setReason("other")} label="אחר" />
        </fieldset>
      </Sheet>

      <Sheet
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
        title={`הודעה ${pre("ל", b.customerName)}`}
        footer={
          <Button
            className="w-full"
            disabled={!msg.trim()}
            onClick={() => {
              setMsg("");
              setMsgOpen(false);
              toast("ההודעה נשלחה");
            }}
          >
            שליחה
          </Button>
        }
      >
        <Field label="ההודעה" htmlFor="op-msg">
          <Textarea id="op-msg" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="היי! רצינו לוודא שיש ברז מים בחצר" />
        </Field>
      </Sheet>
    </Card>
  );
}
