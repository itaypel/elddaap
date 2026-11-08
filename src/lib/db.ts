import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- rows are mapped to typed models right here */
import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { Booking, CategoryId, Notice, Operator, Package, Profile, Review, Settings } from "./data";
import { defaultSettings } from "./data";
import { supabaseConfigured } from "./supabase/env";
import { supabasePublic, supabaseServer } from "./supabase/server";

/* ----------------------------------------------------------------- Mappers */

const toPackage = (r: any): Package => ({
  id: r.id,
  name: r.name,
  durationMin: r.duration_min,
  maxKids: r.max_kids,
  ageMin: r.age_min,
  ageMax: r.age_max,
  price: r.price,
  includes: r.includes,
  popular: r.popular,
  active: r.active,
  extraKidPrice: r.extra_kid_price ?? undefined,
});

const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const whenLabel = (label: string) => {
  const m = /^(\d{2})\/(\d{4})$/.exec(label);
  return m ? `${months[Number(m[1]) - 1]} ${m[2]}` : label;
};

const toReview = (r: any): Review => ({
  id: r.id,
  author: r.author,
  context: r.context,
  when: whenLabel(r.when_label),
  score: r.score,
  text: r.text,
  reply: r.reply ?? undefined,
  verified: r.verified,
});

export const toOperator = (r: any): Operator => {
  const packages = ((r.packages ?? []) as any[]).sort((a, b) => a.sort - b.sort).map(toPackage);
  const minDuration = packages.length ? Math.min(...packages.map((p) => p.durationMin)) : 0;
  return {
    id: r.id,
    slug: r.slug,
    ownerId: r.owner_id,
    name: r.name,
    category: r.category_id as CategoryId,
    categories: r.categories ?? [r.category_id],
    tagline: r.tagline,
    rating: Number(r.rating),
    reviewsCount: r.reviews_count,
    ageMin: r.age_min,
    ageMax: r.age_max,
    regions: r.regions ?? [],
    regionLabel: r.region_label,
    durationLabel: r.duration_label || (minDuration ? (minDuration < 60 || minDuration === 90 ? `${minDuration} דקות` : minDuration === 60 ? "שעה" : minDuration === 120 ? "שעתיים" : `${minDuration / 60} שעות`) : ""),
    includes: r.includes || packages[0]?.includes || "",
    locations: r.locations ?? [],
    sponsored: r.sponsored,
    verified: r.verified,
    insured: r.insured,
    responseHours: r.response_hours,
    packages,
    extras: r.extras ?? [],
    about: r.about,
    facts: r.facts ?? [],
    prepare: r.prepare ?? [],
    sub: r.sub_ratings,
    reviews: ((r.reviews ?? []) as any[]).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(toReview),
    cancellation: r.cancellation,
    slots: r.slots ?? [],
    plan: r.plan,
    status: r.status,
    reviewNote: r.review_note,
    insuranceUntil: r.insurance_until,
    bookingsCount: r.bookings_count,
    blockedDates: r.blocked_dates ?? [],
  };
};

export const BOOKING_SELECT = "*, operator:operators(id, slug, name, category_id, cancellation, extras, response_hours, slots), pkg:packages(name, duration_min)";

export const toBooking = (r: any): Booking => ({
  id: Number(r.id),
  operatorId: r.operator_id,
  packageId: r.package_id,
  customerId: r.customer_id,
  customerName: r.customer_name,
  customerKind: r.customer_kind,
  phone: r.phone,
  email: r.email,
  eventType: r.event_type,
  date: r.date,
  time: r.time,
  city: r.city,
  address: r.address,
  distanceKm: r.distance_km,
  kids: r.kids,
  ageRange: r.age_range,
  locationType: r.location_type,
  notes: r.notes,
  extras: r.extras ?? [],
  price: r.price,
  travelFee: r.travel_fee,
  total: r.total,
  status: r.status,
  createdAt: r.created_at,
  paid: r.paid,
  rated: r.rated,
  proposal: r.proposal_date ? { date: r.proposal_date, time: r.proposal_time } : undefined,
  operator: {
    id: r.operator?.id,
    slug: r.operator?.slug,
    name: r.operator?.name ?? "",
    category: r.operator?.category_id,
    cancellation: r.operator?.cancellation ?? "regular",
    extras: r.operator?.extras ?? [],
    responseHours: r.operator?.response_hours ?? 24,
    slots: r.operator?.slots ?? [],
  },
  pkg: { name: r.pkg?.name ?? "", durationMin: r.pkg?.duration_min ?? 60 },
});

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const h = Math.round(mins / 60);
  if (h < 24) return h === 1 ? "לפני שעה" : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  if (d === 1) return "אתמול";
  if (d < 7) return `לפני ${d} ימים`;
  const dt = new Date(iso);
  return `${dt.getDate()}.${dt.getMonth() + 1}`;
};

const toNotice = (r: any): Notice => ({ id: r.id, audience: r.audience, text: r.text, href: r.href, read: r.read, at: ago(r.created_at) });

const toProfile = (r: any): Profile => ({
  id: r.id,
  fullName: r.full_name,
  email: r.email ?? "",
  phone: r.phone ?? "",
  avatarUrl: r.avatar_url,
  isAdmin: r.is_admin,
  prefs: r.prefs,
});

const toSettings = (r: any): Settings =>
  r
    ? { commission: Number(r.commission), deposit: Number(r.deposit), replyHours: r.reply_hours, payHours: r.pay_hours, payoutDay: r.payout_day, proPrice: r.pro_price, blockOverlaps: r.block_overlaps }
    : defaultSettings;

/* ------------------------------------------------------- Public catalog */

const OPERATOR_SELECT = "*, packages(*)";

export async function getCatalog() {
  if (!supabaseConfigured) return { operators: [] as Operator[], activeCategories: [] as CategoryId[] };
  const db = supabasePublic();
  const [{ data: ops }, { data: cats }] = await Promise.all([
    db.from("operators").select(OPERATOR_SELECT).eq("status", "active").order("sponsored", { ascending: false }).order("rating", { ascending: false }),
    db.from("categories").select("id, active").order("sort"),
  ]);
  const activeCats = new Set((cats ?? []).filter((c: any) => c.active).map((c: any) => c.id as string));
  const operators = (ops ?? []).map(toOperator).filter((o) => activeCats.size === 0 || activeCats.has(o.category));
  return { operators, activeCategories: [...activeCats] as CategoryId[] };
}

export async function getOperatorPage(slug: string) {
  if (!supabaseConfigured) return null;
  const db = supabasePublic();
  const { data } = await db.from("operators").select(`${OPERATOR_SELECT}, reviews(*)`).eq("slug", slug).eq("status", "active").maybeSingle();
  return data ? toOperator(data) : null;
}

export async function getActiveSlugs() {
  if (!supabaseConfigured) return [];
  const { data } = await supabasePublic().from("operators").select("slug").eq("status", "active");
  return (data ?? []).map((r: any) => r.slug as string);
}

export async function getSettings() {
  if (!supabaseConfigured) return defaultSettings;
  const { data } = await supabasePublic().from("settings").select("*").eq("id", 1).maybeSingle();
  return toSettings(data);
}

/* ------------------------------------------------------------- Signed in */

/** The verified user for this request, or null. Cached per request. */
export const getUser = cache(async () => {
  await connection(); // per-request: never prerender signed-in pages
  if (!supabaseConfigured) return null;
  const db = await supabaseServer();
  const { data } = await db.auth.getUser();
  return data.user;
});

export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const db = await supabaseServer();
  const { data } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data ? toProfile(data) : null;
});

export async function getMyBookings() {
  const user = await getUser();
  if (!user) return [];
  const db = await supabaseServer();
  const { data } = await db.from("bookings").select(BOOKING_SELECT).eq("customer_id", user.id).order("date");
  return (data ?? []).map(toBooking);
}

export async function getBooking(id: number) {
  const db = await supabaseServer();
  const { data } = await db.from("bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle();
  return data ? toBooking(data) : null;
}

export async function getNotices(audience: Notice["audience"]) {
  const user = await getUser();
  if (!user) return [];
  const db = await supabaseServer();
  const { data } = await db.from("notifications").select("*").eq("user_id", user.id).eq("audience", audience).order("created_at", { ascending: false }).limit(20);
  return (data ?? []).map(toNotice);
}

export async function getSavedOperators() {
  const user = await getUser();
  if (!user) return [];
  const db = await supabaseServer();
  const { data } = await db.from("saved_operators").select("operator:operators(*, packages(*))").eq("user_id", user.id).order("created_at");
  return (data ?? []).map((r: any) => r.operator).filter(Boolean).map(toOperator);
}

/* -------------------------------------------------------------- Operators */

export const getMyOperator = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const db = await supabaseServer();
  const { data } = await db.from("operators").select(`${OPERATOR_SELECT}, reviews(*)`).eq("owner_id", user.id).maybeSingle();
  return data ? toOperator(data) : null;
});

/** Business and bank details: readable only by the owner and admins (RLS). */
export async function getOperatorPrivate(operatorId: string) {
  const db = await supabaseServer();
  const { data } = await db.from("operator_private").select("business, bank").eq("operator_id", operatorId).maybeSingle();
  return { business: (data?.business ?? {}) as Record<string, string>, bank: (data?.bank ?? {}) as Record<string, string> };
}

/** The signed-in user's operator, or a redirect to the join wizard. */
export async function requireOperator() {
  const op = await getMyOperator();
  if (!op) redirect("/operator/join");
  return op;
}

export async function getOperatorBookings(operatorId: string) {
  const db = await supabaseServer();
  const { data } = await db.from("bookings").select(BOOKING_SELECT).eq("operator_id", operatorId).order("id", { ascending: false });
  return (data ?? []).map(toBooking);
}

/* ------------------------------------------------------------------ Admin */

export const getAdminData = cache(async () => {
  const db = await supabaseServer();
  const [bookings, operators, privates, categories, settings, leads] = await Promise.all([
    db.from("bookings").select(BOOKING_SELECT).order("id", { ascending: false }),
    db.from("operators").select(OPERATOR_SELECT).order("created_at"),
    db.from("operator_private").select("operator_id, business, documents"),
    db.from("categories").select("*").order("sort"),
    db.from("settings").select("*").eq("id", 1).maybeSingle(),
    db.from("institution_leads").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  const priv = new Map((privates.data ?? []).map((p: any) => [p.operator_id as string, p]));
  return {
    bookings: (bookings.data ?? []).map(toBooking),
    operators: (operators.data ?? []).map((r: any) => ({
      ...toOperator(r),
      business: (priv.get(r.id)?.business ?? {}) as Record<string, string>,
      documents: (priv.get(r.id)?.documents ?? []) as { id: string; name: string; state: "ok" | "missing" | "expired"; note: string }[],
      createdAt: r.created_at as string,
    })),
    categories: (categories.data ?? []).map((c: any) => ({ id: c.id as CategoryId, name: c.name as string, active: c.active as boolean })),
    settings: toSettings(settings.data),
    leads: leads.data ?? [],
  };
});
export type AdminData = Awaited<ReturnType<typeof getAdminData>>;
export type AdminOperator = AdminData["operators"][number];
