"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Heart } from "lucide-react";
import {
  type Booking,
  type Notice,
  type Operator,
  type Profile,
  categoryById,
  dayLabel,
  depositOf,
  durationText,
  money,
  plusDays,
  pre,
  priceFrom,
  shortDate,
  statusMeta,
} from "@/lib/data";
import { acceptProposal, cancelBooking, markAllRead, updateProfile } from "@/app/actions";
import { downloadIcs } from "@/lib/ics";
import { useAction } from "@/components/use-action";
import { OperatorMedia } from "@/components/brand";
import { Sheet } from "@/components/sheet";
import { Badge, Button, ButtonLink, Card, CardHeader, Checkbox, Field, Input, PageTitle, StatusTrack, Tabs, Textarea, cx } from "@/components/ui";
import { useStore } from "@/lib/store";

type Tab = "active" | "past" | "cancelled";

export function BookingsView({
  bookings,
  notices,
  saved,
  profile,
  deposit,
}: {
  bookings: Booking[];
  notices: Notice[];
  saved: Operator[];
  profile: Profile | null;
  deposit: number;
}) {
  const params = useSearchParams();
  const newId = Number(params.get("new")) || null;
  const [tab, setTab] = useState<Tab>("active");

  const groups: Record<Tab, Booking[]> = {
    active: bookings.filter((b) => b.status === "pending" || b.status === "awaiting_payment" || b.status === "confirmed" || (b.status === "completed" && !b.rated)),
    past: bookings.filter((b) => b.status === "completed" && b.rated),
    cancelled: bookings.filter((b) => b.status === "cancelled" || b.status === "declined"),
  };
  const sortKey = (b: Booking) => (b.id === newId ? -1 : b.status === "completed" ? 2 : 0);
  const list = [...groups[tab]].sort((a, b) => sortKey(a) - sortKey(b) || a.date.localeCompare(b.date));
  const first = profile?.fullName.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 sm:px-6 sm:pt-10">
      <PageTitle title="ההזמנות שלי" sub={first ? `שלום ${first}. כל הבקשות, האישורים והתשלומים במקום אחד.` : "כל הבקשות, האישורים והתשלומים במקום אחד"} />
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
              <p className="text-lg font-bold">{tab === "cancelled" ? "אין הזמנות שבוטלו" : tab === "past" ? "עוד אין הזמנות קודמות" : "עוד אין כאן הזמנות"}</p>
              <p className="max-w-sm text-[15px] text-muted">מוצאים מפעיל, שולחים בקשה, והיא תופיע כאן עם כל הסטטוסים: אישור, תשלום ודירוג.</p>
              <ButtonLink href="/search">חיפוש הפעלות</ButtonLink>
            </Card>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {list.map((b) => (
                <BookingCard key={b.id} b={b} highlight={b.id === newId} deposit={deposit} />
              ))}
            </ul>
          )}
        </section>
        <aside className="flex flex-col gap-4">
          <NoticesCard notices={notices} />
          {profile && <PrefsCard profile={profile} />}
          <SavedCard saved={saved} />
          {profile && <DetailsCard profile={profile} />}
        </aside>
      </div>
    </div>
  );
}

function BookingCard({ b, highlight, deposit }: { b: Booking; highlight: boolean; deposit: number }) {
  const op = b.operator;
  const meta = statusMeta[b.status];
  const ref = useRef<HTMLLIElement>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [run, pending] = useAction();

  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  const isRateable = b.status === "completed" && !b.rated;
  const statusLabel = isRateable ? "הושלמה" : meta.label;
  const tone = b.proposal ? "warning" : meta.tone;

  let priceSub = "לא חויבתם";
  if (b.status === "awaiting_payment") priceSub = `מקדמה: ${money(depositOf(b, deposit))}`;
  if (b.status === "confirmed") priceSub = `שולמו ${money(b.paid)}`;
  if (b.status === "completed") priceSub = "שולם במלואו";

  const payBy = plusDays(b.date, -5);
  const replyAt = new Date(new Date(b.createdAt).getTime() + op.responseHours * 36e5);
  const replyBy = `${replyAt.getDate()}.${replyAt.getMonth() + 1} ב־${String(replyAt.getHours()).padStart(2, "0")}:${String(replyAt.getMinutes()).padStart(2, "0")}`;

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
                  {b.pkg.name} · {durationText(b.pkg.durationMin)} · {b.kids} ילדים
                </p>
                <p className="text-sm text-muted">
                  {dayLabel(b.date)}, {b.time} · {b.city} · הזמנה #{b.id}
                </p>
              </div>
              <div className="text-end">
                <p className="text-xl font-extrabold tabular">{money(b.total)}</p>
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
                ? `המפעיל יענה עד ${replyBy}. אם לא, נעזור לכם למצוא מפעיל אחר.`
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
                <Button size="sm" disabled={pending} onClick={() => run(() => acceptProposal(b.id), { success: "המועד החדש אושר. אפשר לשלם מקדמה." })}>
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
                מפעילים אחרים ב{categoryById[op.category]?.name}
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
              disabled={pending}
              onClick={() => run(() => cancelBooking(b.id), { success: "הבקשה בוטלה", tone: "neutral", onDone: () => setCancelOpen(false) })}
            >
              ביטול הבקשה
            </Button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed">
          הבקשה {pre("ל", op.name)} ב־{dayLabel(b.date)} תבוטל, והמפעיל יקבל הודעה. עדיין לא חויבתם, כך שהביטול בלי עלות. אי אפשר לשחזר בקשה שבוטלה.
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
      title={`הודעה ${pre("ל", to)}`}
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
      <p className="mt-3 text-[13px] text-muted">בקרוב: שיחה עם המפעיל ישירות מכאן. בינתיים ההודעה לא נשמרת.</p>
    </Sheet>
  );
}

function NoticesCard({ notices }: { notices: Notice[] }) {
  const [run] = useAction();
  const unread = notices.some((n) => !n.read);
  return (
    <Card className="p-5">
      <CardHeader
        title="התראות"
        action={
          unread && (
            <Button variant="link" size="sm" onClick={() => run(() => markAllRead("customer"))}>
              סימון הכול כנקרא
            </Button>
          )
        }
      />
      {notices.length === 0 ? (
        <p className="mt-3 text-sm text-muted">אישורים, תזכורות ועדכונים מהמפעילים יופיעו כאן.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {notices.slice(0, 6).map((n) => {
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
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} className="block rounded-lg hover:bg-sunken">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function PrefsCard({ profile }: { profile: Profile }) {
  const [prefs, setPrefs] = useState(profile.prefs);
  const [run] = useAction();
  const flip = (k: keyof Profile["prefs"]) => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    run(() => updateProfile({ prefs: next }));
  };
  return (
    <Card className="p-5">
      <CardHeader title="איך לעדכן אותי" />
      <div className="mt-2">
        <Checkbox label="הודעת וואטסאפ" checked={prefs.whatsapp} onChange={() => flip("whatsapp")} />
        <Checkbox label="SMS" checked={prefs.sms} onChange={() => flip("sms")} />
        <Checkbox label="אימייל" checked={prefs.email} onChange={() => flip("email")} />
        <Checkbox label="תזכורת יום לפני האירוע" checked={prefs.reminder} onChange={() => flip("reminder")} />
      </div>
    </Card>
  );
}

function SavedCard({ saved }: { saved: Operator[] }) {
  return (
    <Card className="p-5">
      <CardHeader title="מפעילים ששמרתי" />
      {saved.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Heart aria-hidden className="size-4 shrink-0" />
          לוחצים על הלב בכרטיס מפעיל כדי לשמור אותו כאן.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {saved.map((op) => (
            <li key={op.id}>
              <Link href={`/operators/${op.slug}`} className="-mx-2 flex items-center gap-3 rounded-xl p-2 hover:bg-sunken">
                <OperatorMedia category={op.category} className="size-12 shrink-0 rounded-lg" iconClassName="size-5" />
                <span>
                  <span className="block font-bold">{op.name}</span>
                  <span className="text-[13px] text-muted">
                    {categoryById[op.category]?.name} · החל מ־{money(priceFrom(op))}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DetailsCard({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ fullName: profile.fullName, phone: profile.phone });
  const [run, pending] = useAction();
  return (
    <Card className="p-5">
      <CardHeader
        title="הפרטים שלי"
        action={
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setDraft({ fullName: profile.fullName, phone: profile.phone });
              setOpen(true);
            }}
          >
            עריכה
          </Button>
        }
      />
      <dl className="mt-3 flex flex-col gap-1.5 text-[15px]">
        <dt className="sr-only">שם</dt>
        <dd>{profile.fullName || "—"}</dd>
        <dt className="sr-only">טלפון</dt>
        <dd dir="ltr" className="text-end">
          {profile.phone || <span className="text-muted">אין טלפון עדיין</span>}
        </dd>
        <dt className="sr-only">אימייל</dt>
        <dd dir="ltr" className="text-end">
          {profile.email}
        </dd>
      </dl>
      <p className="mt-3 text-sm text-muted">קבלות וחשבוניות נשלחות לאימייל של החשבון</p>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="עריכת פרטים"
        footer={
          <Button className="w-full" disabled={pending || !draft.fullName.trim()} onClick={() => run(() => updateProfile(draft), { success: "הפרטים נשמרו", onDone: () => setOpen(false) })}>
            שמירת שינויים
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="שם מלא" htmlFor="p-name">
            <Input id="p-name" autoComplete="name" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} />
          </Field>
          <Field label="טלפון נייד" htmlFor="p-phone">
            <Input id="p-phone" type="tel" dir="ltr" className="text-end" autoComplete="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          </Field>
          <Field label="אימייל" htmlFor="p-email" hint="האימייל משמש לכניסה ולא ניתן לשינוי כאן">
            <Input id="p-email" type="email" dir="ltr" className="bg-sunken text-end" readOnly value={profile.email} />
          </Field>
        </div>
      </Sheet>
    </Card>
  );
}
