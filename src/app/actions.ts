"use server";

import { revalidatePath } from "next/cache";
import type { CancellationPolicy, LocationType, Package, Settings } from "@/lib/data";
import { getUser } from "@/lib/db";
import { MAX_PHOTOS, photoPath } from "@/lib/photos";
import { supabaseServer } from "@/lib/supabase/server";

export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/** Turns database exceptions into sentences people can act on. */
function explain(message: string): string {
  if (message.startsWith("clash")) {
    const id = message.split(":")[1];
    return id ? `כבר אישרתם את #${id} באותו מועד. אפשר להציע ללקוח מועד אחר.` : "המועד הזה כבר תפוס. בחרו מועד אחר.";
  }
  const map: Record<string, string> = {
    not_authenticated: "צריך להתחבר כדי להמשיך.",
    forbidden: "אין לכם הרשאה לפעולה הזו.",
    invalid_status: "הסטטוס של ההזמנה השתנה בינתיים. רעננו את העמוד.",
    operator_unavailable: "המפעיל לא זמין כרגע להזמנות.",
    package_unavailable: "החבילה הזו כבר לא זמינה. בחרו חבילה אחרת.",
    date_in_past: "התאריך כבר עבר. בחרו תאריך עתידי.",
    date_blocked: "המפעיל לא עובד בתאריך הזה. בחרו תאריך אחר.",
    slot_unavailable: "השעה הזו לא זמינה. בחרו שעה אחרת.",
    invalid_kids: "מספר הילדים לא תקין.",
    invalid_scores: "חסר דירוג באחת השורות.",
    already_replied: "כבר הגבתם לביקורת הזו.",
    already_operator: "כבר יש לכם פרופיל מפעיל.",
    invalid_proposal: "המועד שהוצע לא תקין.",
  };
  for (const [k, v] of Object.entries(map)) if (message.includes(k)) return v;
  console.error("[actions]", message);
  return "משהו השתבש. נסו שוב בעוד רגע.";
}

async function rpc<T = unknown>(fn: string, args: Record<string, unknown>, paths: string[]): Promise<Result<T>> {
  const db = await supabaseServer();
  const { data, error } = await db.rpc(fn, args);
  if (error) return { ok: false, error: explain(error.message) };
  paths.forEach((p) => revalidatePath(p));
  return { ok: true, data: data as T };
}

const CUSTOMER = ["/bookings"];
const OPERATOR = ["/operator", "/operator/requests", "/operator/calendar"];

/* -------------------------------------------------------------- Customers */

export type BookingRequest = {
  operatorId: string;
  packageId: string;
  date: string;
  time: string;
  kids: number;
  extras: string[];
  eventType: string;
  address: string;
  city: string;
  ageRange: string;
  location: LocationType;
  notes: string;
  kind: "parent" | "institution";
  name: string;
  phone: string;
  email: string;
};

export async function requestBooking(r: BookingRequest) {
  return rpc<number>(
    "request_booking",
    {
      p_operator: r.operatorId, p_package: r.packageId, p_date: r.date, p_time: r.time, p_kids: r.kids, p_extras: r.extras,
      p_event_type: r.eventType, p_address: r.address, p_city: r.city, p_age_range: r.ageRange, p_location: r.location,
      p_notes: r.notes, p_kind: r.kind, p_name: r.name, p_phone: r.phone, p_email: r.email,
    },
    [...CUSTOMER, ...OPERATOR],
  );
}

export const cancelBooking = async (id: number) => rpc("cancel_booking", { p_id: id }, [...CUSTOMER, ...OPERATOR]);
export const acceptProposal = async (id: number) => rpc("accept_proposal", { p_id: id }, [...CUSTOMER, ...OPERATOR]);
export const payBooking = async (id: number, full: boolean) => rpc<number>("pay_booking", { p_id: id, p_full: full }, [...CUSTOMER, ...OPERATOR, `/pay/${id}`]);
export const rateBooking = async (id: number, scores: Record<string, number>, text: string, recommend: boolean | null) =>
  rpc("rate_booking", { p_id: id, p_scores: scores, p_text: text, p_recommend: recommend }, [...CUSTOMER, "/operator/reviews"]);

export async function toggleSaved(operatorId: string): Promise<Result<boolean>> {
  const user = await getUser();
  if (!user) return { ok: false, error: "צריך להתחבר כדי לשמור מפעילים." };
  const db = await supabaseServer();
  const { data: existing } = await db.from("saved_operators").select("operator_id").eq("user_id", user.id).eq("operator_id", operatorId).maybeSingle();
  const { error } = existing
    ? await db.from("saved_operators").delete().eq("user_id", user.id).eq("operator_id", operatorId)
    : await db.from("saved_operators").insert({ user_id: user.id, operator_id: operatorId });
  if (error) return { ok: false, error: explain(error.message) };
  revalidatePath("/bookings");
  return { ok: true, data: !existing };
}

export async function markAllRead(audience: "customer" | "operator") {
  const user = await getUser();
  if (!user) return { ok: false, error: "צריך להתחבר." } as Result;
  const db = await supabaseServer();
  await db.from("notifications").update({ read: true }).eq("user_id", user.id).eq("audience", audience).eq("read", false);
  revalidatePath(audience === "customer" ? "/bookings" : "/operator");
  return { ok: true } as Result;
}

export async function updateProfile(p: { fullName?: string; phone?: string; prefs?: Record<string, boolean> }): Promise<Result> {
  const user = await getUser();
  if (!user) return { ok: false, error: "צריך להתחבר." };
  const db = await supabaseServer();
  const patch: Record<string, unknown> = {};
  if (p.fullName !== undefined) patch.full_name = p.fullName.trim();
  if (p.phone !== undefined) patch.phone = p.phone.trim();
  if (p.prefs) patch.prefs = p.prefs;
  const { error } = await db.from("profiles").update(patch).eq("id", user.id);
  if (error) return { ok: false, error: explain(error.message) };
  revalidatePath("/bookings");
  return { ok: true };
}

export async function updateUsername(username: string): Promise<Result> {
  const user = await getUser();
  if (!user) return { ok: false, error: "צריך להתחבר." };
  const u = username.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(u)) return { ok: false, error: "שם משתמש: 3–30 תווים באנגלית, ספרות, נקודה, מקף או קו תחתון." };
  const db = await supabaseServer();
  const { error } = await db.from("profiles").update({ username: u }).eq("id", user.id);
  if (error) return { ok: false, error: error.code === "23505" ? "שם המשתמש הזה תפוס. בחרו שם אחר." : explain(error.message) };
  revalidatePath("/admin/account");
  return { ok: true };
}

export async function submitLead(f: {
  orgType: string; org: string; contact: string; phone: string; email: string; date: string; kids: string; cats: string[]; budget: string; notes: string;
}): Promise<Result> {
  const user = await getUser();
  const db = await supabaseServer();
  const { error } = await db.from("institution_leads").insert({
    user_id: user?.id ?? null, org_type: f.orgType, org: f.org, contact: f.contact, phone: f.phone, email: f.email,
    event_date: f.date || null, participants: f.kids ? Number(f.kids) : null, categories: f.cats, budget: f.budget || null, notes: f.notes || null,
  });
  return error ? { ok: false, error: explain(error.message) } : { ok: true };
}

/* -------------------------------------------------------------- Operators */

export const approveBooking = async (id: number) => rpc("approve_booking", { p_id: id }, OPERATOR);
export const declineBooking = async (id: number) => rpc("decline_booking", { p_id: id }, OPERATOR);
export const proposeBooking = async (id: number, date: string, time: string) => rpc("propose_booking", { p_id: id, p_date: date, p_time: time }, OPERATOR);
export const completeBooking = async (id: number) => rpc("complete_booking", { p_id: id }, OPERATOR);
export const replyReview = async (id: string, text: string) => rpc("reply_review", { p_review: id, p_text: text }, ["/operator", "/operator/reviews"]);

export async function createOperator(payload: Record<string, unknown>) {
  return rpc<string>("create_operator", { p: payload }, ["/operator"]);
}

export async function saveOperatorProfile(input: {
  operatorId: string;
  slug: string;
  name: string;
  tagline: string;
  about: string;
  categories: string[];
  regions: string[];
  cancellation: CancellationPolicy;
  packages: Package[];
}): Promise<Result> {
  const db = await supabaseServer();
  const { error } = await db
    .from("operators")
    .update({
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      about: input.about.trim(),
      categories: input.categories,
      regions: input.regions,
      region_label: input.regions.join(", "),
      cancellation: input.cancellation,
    })
    .eq("id", input.operatorId);
  if (error) return { ok: false, error: explain(error.message) };

  const isUuid = (s: string) => /^[0-9a-f-]{36}$/.test(s);
  for (const [i, p] of input.packages.entries()) {
    const row = {
      operator_id: input.operatorId, name: p.name, duration_min: p.durationMin, max_kids: p.maxKids, age_min: p.ageMin, age_max: p.ageMax,
      price: p.price, includes: p.includes, popular: !!p.popular, active: p.active, extra_kid_price: p.extraKidPrice ?? null, sort: i,
    };
    const { error: e } = isUuid(p.id) ? await db.from("packages").update(row).eq("id", p.id) : await db.from("packages").insert(row);
    if (e) return { ok: false, error: explain(e.message) };
  }
  revalidatePath("/operator/profile");
  revalidatePath(`/operators/${input.slug}`);
  return { ok: true };
}

/** Logo and gallery, saved as soon as they change in the profile panel. */
export async function saveOperatorPhotos(operatorId: string, slug: string, logo: string | null, photos: string[]): Promise<Result> {
  const user = await getUser();
  if (!user) return { ok: false, error: "צריך להתחבר." };
  // Only files from the owner's own folder in our bucket.
  const own = (url: string) => {
    const path = photoPath(url);
    return path.startsWith(`${user.id}/`) ? path : null;
  };
  const db = await supabaseServer();
  const { error } = await db
    .from("operators")
    .update({ logo_url: logo ? own(logo) : null, photos: photos.map(own).filter(Boolean).slice(0, MAX_PHOTOS) })
    .eq("id", operatorId);
  if (error) return { ok: false, error: explain(error.message) };
  revalidatePath("/operator/profile");
  revalidatePath(`/operators/${slug}`);
  return { ok: true };
}

export async function setBlockedDates(operatorId: string, slug: string, dates: string[]): Promise<Result> {
  const db = await supabaseServer();
  const { error } = await db.from("operators").update({ blocked_dates: [...new Set(dates)].sort() }).eq("id", operatorId);
  if (error) return { ok: false, error: explain(error.message) };
  revalidatePath("/operator/calendar");
  revalidatePath(`/operators/${slug}`);
  return { ok: true };
}

/* ------------------------------------------------------------------ Admin */

export const setOperatorStatus = async (id: string, status: "active" | "pending" | "suspended" | "rejected", note: string | null) =>
  rpc("admin_set_operator_status", { p_operator: id, p_status: status, p_note: note }, ["/admin", "/admin/approvals", "/admin/people", "/search", "/"]);

export async function setCategoryActive(id: string, active: boolean): Promise<Result> {
  const db = await supabaseServer();
  const { error } = await db.from("categories").update({ active }).eq("id", id);
  if (error) return { ok: false, error: explain(error.message) };
  revalidatePath("/admin/settings");
  revalidatePath("/search");
  revalidatePath("/");
  return { ok: true };
}

export async function saveSettings(s: Settings): Promise<Result> {
  const db = await supabaseServer();
  const { error } = await db
    .from("settings")
    .update({
      commission: s.commission, deposit: s.deposit, reply_hours: s.replyHours, pay_hours: s.payHours,
      payout_day: s.payoutDay, pro_price: s.proPrice, block_overlaps: s.blockOverlaps,
    })
    .eq("id", 1);
  if (error) return { ok: false, error: explain(error.message) };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
