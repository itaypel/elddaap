"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Heart } from "lucide-react";
import {
  type Booking,
  bookingTotal,
  categoryById,
  dayLabel,
  depositOf,
  durationText,
  money,
  operatorBySlug,
  packageOf,
  parseDate,
  priceFrom,
  shortDate,
  statusMeta,
} from "@/lib/data";
import { useMyBookings, useStore } from "@/lib/store";
import { downloadIcs } from "@/lib/ics";
import { OperatorMedia } from "@/components/brand";
import { Sheet } from "@/components/sheet";
import { Badge, Button, ButtonLink, Card, CardHeader, Checkbox, Field, Input, PageTitle, StatusTrack, Tabs, Textarea, cx } from "@/components/ui";

type Tab = "active" | "past" | "cancelled";

const plusDays = (iso: string, n: number) => {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function BookingsView() {
  const params = useSearchParams();
  const newId = Number(params.get("new")) || null;
  const mine = useMyBookings();
  const [tab, setTab] = useState<Tab>("active");

  const groups: Record<Tab, Booking[]> = {
    active: mine.filter((b) => b.status === "pending" || b.status === "awaiting_payment" || b.status === "confirmed" || (b.status === "completed" && !b.rated)),
    past: mine.filter((b) => b.status === "completed" && b.rated),
    cancelled: mine.filter((b) => b.status === "cancelled" || b.status === "declined"),
  };
  const sortKey = (b: Booking) => (b.id === newId ? -1 : b.status === "completed" ? 2 : 0);
  const list = [...groups[tab]].sort((a, b) => sortKey(a) - sortKey(b) || a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 sm:px-6 sm:pt-10">
      <PageTitle title="ההזמנות שלי" sub="כל הבקשות, האישורים והתשלומים במקום אחד" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section aria-label="הזמנות">
          <Tabs
            label="סינון הזמנות"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "active", label: `פעילות (${groups.active.length})` },
              { value: "past", label: `עבר (${groups.past.length})` },
              { value: "cancelled", label: `בוטלו (${groups.cancelled.length})` },
            ]}
          />
          {list.length === 0 ? (
            <Card className="mt-4 flex flex-col items-center gap-3 px-6 py-14 text-center">
              <p className="text-lg font-bold">{tab === "cancelled" ? "אין הזמנות שבוטלו" : "אין כאן הזמנות עדיין"}</p>
              <p className="text-[15px] text-muted">מוצאים מפעיל, שולחים בקשה, והיא תופיע כאן עם כל הסטטוסים.</p>
              <ButtonLink href="/search">חיפוש הפעלות</ButtonLink>
            </Card>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {list.map((b) => (
                <BookingCard key={b.id} b={b} highlight={b.id === newId} />
              ))}
            </ul>
          )}
        </section>
        <aside className="flex flex-col gap-4">
          <NoticesCard />
          <PrefsCard />
          <SavedCard />
          <DetailsCard />
        </aside>
      </div>
    </div>
  );
}

function BookingCard({ b, highlight }: { b: Booking; highlight: boolean }) {
  const op = operatorBySlug(b.operatorSlug)!;
  const pkg = packageOf(b);
  const total = bookingTotal(b);
  const meta = statusMeta[b.status];
  const ref = useRef<HTMLLIElement>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const cancel = useStore((s) => s.cancel);
  const acceptProposal = useStore((s) => s.acceptProposal);
  const toast = useStore((s) => s.toast);

  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  const isRateable = b.status === "completed" && !b.rated;
  const statusLabel = isRateable ? "הושלמה" : meta.label;
  const tone = b.proposal ? "warning" : meta.tone;

  let priceSub = "לא חויבתם";
  if (b.status === "awaiting_payment") priceSub = `מקדמה: ${money(depositOf(b))}`;
  if (b.status === "confirmed") priceSub = `שולמה מקדמה ${money(b.paid)}`;
  if (b.status === "completed") priceSub = "שולם במלואו";

  const payBy = plusDays(b.date, -5);
  const replyBy = plusDays(b.createdAt.slice(0, 10), 1);

  return (
    <li ref={ref}>
      <article className={cx("rounded-2xl border bg-card p-4 transition-shadow sm:p-5", highlight ? "border-accent shadow-float ring-1 ring-accent" : "border-line")}>
        <div className="flex gap-4">
          <OperatorMedia category={op.category} className="hidden size-16 shrink-0 rounded-xl sm:grid" iconClassName="size-7" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">
                    <Link href={`/operators/${op.slug}`} className="hover:underline">
                      {op.name}
                    </Link>
                  </h2>
                  <Badge tone={tone}>{b.proposal ? "הוצע מועד חלופי" : statusLabel}</Badge>
                  {highlight && <Badge tone="accent">חדש</Badge>}
                </div>
                <p className="mt-1 text-[15px] text-muted">
                  {pkg?.name} · {pkg && durationText(pkg.durationMin)} · {b.kids} ילדים
                </p>
                <p className="text-sm text-muted">
                  {dayLabel(b.date)}, {b.time} · {b.city} · הזמנה #{b.id}
                </p>
              </div>
              <div className="text-end">
                <p className="text-xl font-extrabold tabular">{money(total)}</p>
                <p className="text-[13px] text-muted">{priceSub}</p>
              </div>
            </div>
          </div>
        </div>

        {b.status !== "cancelled" && b.status !== "declined" && <StatusTrack className="mt-5" step={meta.step} />}

        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-sunken p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-[15px] leading-relaxed">
            {b.proposal
              ? `${op.name} לא פנויים ב־${shortDate(b.date)} ${b.time}, ומציעים ${dayLabel(b.proposal.date)} ב־${b.proposal.time}.`
              : b.status === "pending"
                ? `המפעיל יענה עד ${shortDate(replyBy)} ב־${b.createdAt.slice(11, 16) || "14:00"}. אם לא, נעזור לכם למצוא מפעיל אחר.`
                : b.status === "awaiting_payment"
                  ? `המפעיל אישר. משלמים מקדמה עד ${shortDate(payBy)} כדי לשמור את התאריך.`
                  : b.status === "confirmed"
                    ? "הכול סגור. היתרה תחויב באותו כרטיס יום אחרי האירוע."
                    : isRateable
                      ? "איך היה? הדירוג שלכם עוזר להורים אחרים לבחור."
                      : b.status === "completed"
                        ? "תודה שדירגתם!"
                        : b.status === "declined"
                          ? "המפעיל לא זמין במועד הזה. יש עוד מפעילים פנויים."
                          : "הבקשה בוטלה ולא חויבתם."}
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            {b.proposal ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setCancelOpen(true)}>
                  ביטול הבקשה
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    acceptProposal(b.id);
                    toast("המועד החדש אושר. אפשר לשלם מקדמה.");
                  }}
                >
                  אישור המועד החדש
                </Button>
              </>
            ) : b.status === "pending" ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setCancelOpen(true)}>
                  ביטול הבקשה
                </Button>
                <Button size="sm" onClick={() => setMsgOpen(true)}>
                  הודעה למפעיל
                </Button>
              </>
            ) : b.status === "awaiting_payment" ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => downloadIcs(b)}>
                  <CalendarPlus aria-hidden className="size-4" />
                  הוספה ליומן
                </Button>
                <ButtonLink href={`/pay/${b.id}`} size="sm">
                  לתשלום מקדמה
                </ButtonLink>
              </>
            ) : b.status === "confirmed" ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => downloadIcs(b)}>
                  <CalendarPlus aria-hidden className="size-4" />
                  הוספה ליומן
                </Button>
                <Button size="sm" onClick={() => setMsgOpen(true)}>
                  הודעה למפעיל
                </Button>
              </>
            ) : b.status === "completed" ? (
              <>
                <ButtonLink href={`/operators/${op.slug}`} variant="secondary" size="sm">
                  הזמנה חוזרת
                </ButtonLink>
                {isRateable && (
                  <ButtonLink href={`/rate/${b.id}`} size="sm">
                    דירוג המפעיל
                  </ButtonLink>
                )}
              </>
            ) : (
              <ButtonLink href={`/search?cat=${op.category}&date=${b.date}`} size="sm" variant="secondary">
                מפעילים אחרים ב{categoryById[op.category].name}
              </ButtonLink>
            )}
          </div>
        </div>
      </article>

      <Sheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="לבטל את הבקשה?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              השארת הבקשה
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                cancel(b.id);
                setCancelOpen(false);
                toast("הבקשה בוטלה", "neutral");
              }}
            >
              ביטול הבקשה
            </Button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed">
          הבקשה ל{op.name} ב־{dayLabel(b.date)} תבוטל, והמפעיל יקבל הודעה. עדיין לא חויבתם, כך שהביטול בלי עלות. אי אפשר לשחזר בקשה שבוטלה.
        </p>
      </Sheet>

      <MessageSheet open={msgOpen} onClose={() => setMsgOpen(false)} to={op.name} />
    </li>
  );
}

function MessageSheet({ open, onClose, to }: { open: boolean; onClose: () => void; to: string }) {
  const [text, setText] = useState("");
  const toast = useStore((s) => s.toast);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`הודעה ל${to}`}
      footer={
        <Button
          className="w-full"
          disabled={!text.trim()}
          onClick={() => {
            setText("");
            onClose();
            toast("ההודעה נשלחה");
          }}
        >
          שליחה
        </Button>
      }
    >
      <Field label="ההודעה" htmlFor="msg-text">
        <Textarea id="msg-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="למשל: אפשר להגיע חצי שעה מוקדם יותר?" />
      </Field>
    </Sheet>
  );
}

function NoticesCard() {
  const notices = useStore((s) => s.notices).filter((n) => n.audience === "customer");
  const markAllRead = useStore((s) => s.markAllRead);
  const unread = notices.some((n) => !n.read);
  return (
    <Card className="p-5">
      <CardHeader
        title="התראות"
        action={
          unread && (
            <Button variant="link" size="sm" onClick={() => markAllRead("customer")}>
              סימון הכול כנקרא
            </Button>
          )
        }
      />
      <ul className="mt-3 divide-y divide-line">
        {notices.slice(0, 5).map((n) => {
          const body = (
            <span className="flex gap-3 py-3">
              <span aria-hidden className={cx("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-line-strong" : "bg-accent")} />
              <span>
                <span className={cx("block text-[15px] leading-snug", !n.read && "font-bold")}>{n.text}</span>
                <span className="text-[13px] text-muted">{n.at}</span>
                {!n.read && <span className="sr-only"> (חדש)</span>}
              </span>
            </span>
          );
          return <li key={n.id}>{n.href ? <Link href={n.href} className="block rounded-lg hover:bg-sunken">{body}</Link> : body}</li>;
        })}
      </ul>
    </Card>
  );
}

function PrefsCard() {
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  return (
    <Card className="p-5">
      <CardHeader title="איך לעדכן אותי" />
      <div className="mt-2">
        <Checkbox label="הודעת וואטסאפ" checked={prefs.whatsapp} onChange={() => setPrefs({ whatsapp: !prefs.whatsapp })} />
        <Checkbox label="SMS" checked={prefs.sms} onChange={() => setPrefs({ sms: !prefs.sms })} />
        <Checkbox label="אימייל" checked={prefs.email} onChange={() => setPrefs({ email: !prefs.email })} />
        <Checkbox label="תזכורת יום לפני האירוע" checked={prefs.reminder} onChange={() => setPrefs({ reminder: !prefs.reminder })} />
      </div>
    </Card>
  );
}

function SavedCard() {
  const saved = useStore((s) => s.saved);
  return (
    <Card className="p-5">
      <CardHeader title="מפעילים ששמרתי" />
      {saved.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Heart aria-hidden className="size-4" />
          לוחצים על הלב בכרטיס מפעיל כדי לשמור אותו כאן.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {saved.map((slug) => {
            const op = operatorBySlug(slug);
            if (!op) return null;
            return (
              <li key={slug}>
                <Link href={`/operators/${slug}`} className="-mx-2 flex items-center gap-3 rounded-xl p-2 hover:bg-sunken">
                  <OperatorMedia category={op.category} className="size-12 shrink-0 rounded-lg" iconClassName="size-5" />
                  <span>
                    <span className="block font-bold">{op.name}</span>
                    <span className="text-[13px] text-muted">
                      {categoryById[op.category].name} · החל מ־{money(priceFrom(op))}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function DetailsCard() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const toast = useStore((s) => s.toast);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(profile);
  return (
    <Card className="p-5">
      <CardHeader
        title="הפרטים שלי"
        action={
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setDraft(profile);
              setOpen(true);
            }}
          >
            עריכה
          </Button>
        }
      />
      <dl className="mt-3 flex flex-col gap-1.5 text-[15px]">
        <dt className="sr-only">שם</dt>
        <dd>{profile.name}</dd>
        <dt className="sr-only">טלפון</dt>
        <dd dir="ltr" className="text-end">
          {profile.phone}
        </dd>
        <dt className="sr-only">אימייל</dt>
        <dd dir="ltr" className="text-end">
          {profile.email}
        </dd>
      </dl>
      <p className="mt-3 text-sm text-muted">קבלות וחשבוניות נשלחות לאימייל הזה</p>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="עריכת פרטים"
        footer={
          <Button
            className="w-full"
            onClick={() => {
              setProfile(draft);
              setOpen(false);
              toast("הפרטים נשמרו");
            }}
          >
            שמירת שינויים
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="שם מלא" htmlFor="p-name">
            <Input id="p-name" autoComplete="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="טלפון נייד" htmlFor="p-phone">
            <Input id="p-phone" type="tel" dir="ltr" className="text-end" autoComplete="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </Field>
          <Field label="אימייל" htmlFor="p-email">
            <Input id="p-email" type="email" dir="ltr" className="text-end" autoComplete="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </Field>
        </div>
      </Sheet>
    </Card>
  );
}
