"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import {
  type Booking,
  type Operator,
  type Settings,
  addMinutes,
  dayLabel,
  locationTypes,
  money,
  overlaps,
  pre,
  shortDate,
  statusMeta,
  todayIso,
  weekday,
} from "@/lib/data";
import { approveBooking, completeBooking, declineBooking, proposeBooking } from "@/app/actions";
import { useStore } from "@/lib/store";
import { hoursLeft } from "@/lib/ops";
import { useAction } from "@/components/use-action";
import { Sheet } from "@/components/sheet";
import { Badge, Button, Card, Field, Input, PageTitle, Radio, Select, StatusTrack, Tabs, Textarea, cx } from "@/components/ui";

type Tab = "new" | "payment" | "approved" | "closed";

const tabOf = (b: Booking): Tab =>
  b.status === "pending" ? "new" : b.status === "awaiting_payment" ? "payment" : b.status === "confirmed" || b.status === "completed" ? "approved" : "closed";
const inTab = (b: Booking, t: Tab) => tabOf(b) === t;
const timeLeft = (h: number) => (h > 0 ? `נותרו ${h} שעות לתשובה` : "עבר הזמן לתשובה");

export function RequestsView({ op, bookings: all, settings }: { op: Operator; bookings: Booking[]; settings: Settings }) {
  const params = useSearchParams();
  const linked = all.find((b) => b.id === Number(params.get("id")));
  // A link to a specific booking opens the tab that booking lives in.
  const [tab, setTab] = useState<Tab>(linked ? tabOf(linked) : "new");
  const list = all.filter((b) => inTab(b, tab)).sort((a, b) => (tab === "new" ? hoursLeft(a, settings.replyHours) - hoursLeft(b, settings.replyHours) : a.date.localeCompare(b.date)));
  const [selectedId, setSelectedId] = useState<number | null>(linked?.id ?? null);
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
              const h = hoursLeft(b, settings.replyHours);
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
                      {b.status === "pending" && <span className={cx("shrink-0 text-[13px] font-bold", h <= 8 ? "text-danger" : "text-warning")}>{timeLeft(h)}</span>}
                    </span>
                    <span className="mt-1 block text-[15px]">
                      {b.eventType} · {weekday(b.date)} {shortDate(b.date)}, {b.time}–{addMinutes(b.time, b.pkg.durationMin)}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {b.pkg.name} · {b.kids} ילדים · גילאי {b.ageRange} · {money(b.total)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div ref={detailRef} className="scroll-mt-20">
            {selected && <RequestDetail key={selected.id} b={selected} all={all} op={op} settings={settings} />}
          </div>
        </div>
      )}
    </>
  );
}

function RequestDetail({ b, all, op, settings }: { b: Booking; all: Booking[]; op: Operator; settings: Settings }) {
  const toast = useStore((s) => s.toast);
  const [run, pending] = useAction();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [alt, setAlt] = useState({ date: b.date, time: op.slots.find((t) => t !== b.time) ?? b.time });
  const [reason, setReason] = useState("busy");
  const [msg, setMsg] = useState("");

  const pkg = b.pkg;
  const total = b.total;
  const net = Math.round(total * (1 - settings.commission));
  const meta = statusMeta[b.status];
  const end = addMinutes(b.time, pkg.durationMin);
  const clashes = all.filter((o) => o.id !== b.id && (o.status === "pending" || o.status === "awaiting_payment" || o.status === "confirmed") && overlaps(o, b));
  const blockingClash = clashes.find((o) => o.status !== "pending");
  const h = hoursLeft(b, settings.replyHours);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">{b.customerName}</h2>
          <p className="mt-1 text-[15px] text-muted">
            {b.eventType} · הזמנה #{b.id}
          </p>
        </div>
        {/* The status track below already shows where the booking is; the badge adds only the deadline, or the outcome when there is no track. */}
        {b.status === "pending" ? (
          <Badge tone={h <= 8 ? "danger" : "warning"} className="text-sm">
            {timeLeft(h)}
          </Badge>
        ) : (
          (b.status === "cancelled" || b.status === "declined") && (
            <Badge tone={meta.tone} className="text-sm">
              {meta.label}
            </Badge>
          )
        )}
      </div>

      {b.status !== "cancelled" && b.status !== "declined" && <StatusTrack className="mt-5" step={meta.step} />}

      <dl className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["מתי", `${weekday(b.date)} ${shortDate(b.date)}, ${b.time}–${end}`],
          ["איפה", `${b.city} · ${b.distanceKm} ק״מ מכם`],
          ["ילדים", `${b.kids} · גילאי ${b.ageRange}`],
          ["חבילה", pkg.name || "—"],
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
                disabled={!!blockingClash || pending}
                onClick={() => {
                  run(() => approveBooking(b.id), { success: `אישרתם את הבקשה של ${b.customerName}. הלקוח קיבל הודעה.` });
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
          <p className="mt-3 text-[13px] text-muted">אחרי האישור הלקוח מקבל הודעה ויש לו {settings.payHours} שעות לשלם מקדמה. עד התשלום השעה שמורה לו ביומן שלכם.</p>
        </>
      )}

      {b.status !== "pending" && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
          {b.status === "confirmed" && b.date <= todayIso() && (
            <Button disabled={pending} onClick={() => run(() => completeBooking(b.id), { success: `#${b.id} סומנה כהושלמה. הלקוח יתבקש לדרג.` })}>
              סימון כהושלמה
            </Button>
          )}
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
              run(() => proposeBooking(b.id, alt.date, alt.time), { success: "ההצעה נשלחה ללקוח", onDone: () => setProposeOpen(false) });
            }}
          >
            שליחת ההצעה
          </Button>
        }
      >
        <p className="mb-4 text-[15px] text-muted">הלקוח יקבל את ההצעה ויוכל לאשר אותה בלחיצה. הבקשה נשארת פתוחה עד שיענה.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="תאריך" htmlFor="alt-date">
            <Input id="alt-date" type="date" min={todayIso()} value={alt.date} onChange={(e) => setAlt({ ...alt, date: e.target.value })} />
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
                run(() => declineBooking(b.id), { success: "הבקשה נדחתה. הלקוח יקבל הצעות ממפעילים אחרים.", tone: "neutral", onDone: () => setDeclineOpen(false) });
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
