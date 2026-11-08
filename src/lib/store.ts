"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type Booking,
  type BookingStatus,
  type Package,
  type Review,
  CURRENT_CUSTOMER,
  COMMISSION,
  bookingTotal,
  depositOf,
  operatorBySlug,
  overlaps,
  pre,
  seedBookings,
  shortDate,
} from "./data";

export type Notice = {
  id: string;
  audience: "customer" | "operator";
  text: string;
  at: string;
  read: boolean;
  href?: string;
};

export type Toast = { id: number; text: string; tone?: "success" | "neutral" | "danger" };

export type OperatorEdits = {
  name?: string;
  tagline?: string;
  about?: string;
  packages?: Package[];
  regions?: string[];
  categories?: string[];
  cancellation?: "flexible" | "regular" | "strict";
  blockedDates?: string[];
};

export type AdminState = {
  approvals: Record<string, "approved" | "rejected" | "info_requested">;
  complaints: Record<string, "open" | "in_progress" | "closed">;
  flagged: Record<string, "kept" | "hidden">;
  categoryActive: Record<string, boolean>;
  commission: number;
};

type State = {
  bookings: Booking[];
  saved: string[];
  compare: string[];
  notices: Notice[];
  prefs: { whatsapp: boolean; sms: boolean; email: boolean; reminder: boolean };
  profile: { name: string; phone: string; email: string };
  extraReviews: Record<string, Review[]>;
  operatorEdits: OperatorEdits;
  admin: AdminState;
  toasts: Toast[];

  createBooking: (b: Omit<Booking, "id" | "status" | "createdAt" | "paid" | "rated">) => number;
  approve: (id: number) => { ok: boolean; reason?: string };
  decline: (id: number) => void;
  propose: (id: number, date: string, time: string) => void;
  acceptProposal: (id: number) => void;
  cancel: (id: number) => void;
  pay: (id: number, amount: number) => void;
  complete: (id: number) => void;
  rate: (id: number, review: Omit<Review, "id" | "verified">) => void;
  toggleSaved: (slug: string) => void;
  toggleCompare: (slug: string) => void;
  clearCompare: () => void;
  markAllRead: (audience: Notice["audience"]) => void;
  setPrefs: (p: Partial<State["prefs"]>) => void;
  setProfile: (p: Partial<State["profile"]>) => void;
  editOperator: (e: Partial<OperatorEdits>) => void;
  setAdmin: (fn: (a: AdminState) => AdminState) => void;
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  reset: () => void;
};

const seedNotices: Notice[] = [
  { id: "n1", audience: "customer", text: "הקוסם נועם אישר את הבקשה ל־18.12", at: "לפני שעה", read: false, href: "/pay/10455" },
  { id: "n2", audience: "customer", text: "תזכורת: מקדמה להקוסם נועם עד 13.12", at: "לפני שעה", read: false, href: "/pay/10455" },
  { id: "n3", audience: "customer", text: "Water Battle קיבלו את הבקשה שלך", at: "אתמול", read: true },
  { id: "n4", audience: "customer", text: "החשבונית ממדע בקופסה מחכה במייל", at: "31.10", read: true },
  { id: "o1", audience: "operator", text: "בקשה חדשה ממשפחת אברהם ל־24.12", at: "לפני 2 שעות", read: false, href: "/operator/requests" },
];

const initial = () => ({
  bookings: seedBookings,
  saved: ["extreme-junior", "studio-tzeva"],
  compare: [] as string[],
  notices: seedNotices,
  prefs: { whatsapp: true, sms: false, email: true, reminder: true },
  profile: { name: "דנה לוי", phone: "050-0000000", email: "dana@example.com" },
  extraReviews: {} as Record<string, Review[]>,
  operatorEdits: {} as OperatorEdits,
  admin: {
    approvals: {},
    complaints: { "C-207": "open", "C-211": "in_progress" },
    flagged: {},
    categoryActive: {
      water: true, sport: true, magic: true, science: true, art: true,
      inflatables: true, animals: true, mobile: true, characters: false, equipment: false,
    },
    commission: COMMISSION,
  } as AdminState,
  toasts: [] as Toast[],
});

let toastSeq = 1;

const notice = (audience: Notice["audience"], text: string, href?: string): Notice => ({
  id: `${audience}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  audience,
  text,
  at: "עכשיו",
  read: false,
  href,
});

const setStatus = (bookings: Booking[], id: number, status: BookingStatus, patch: Partial<Booking> = {}) =>
  bookings.map((b) => (b.id === id ? { ...b, ...patch, status } : b));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),

      createBooking: (input) => {
        const id = Math.max(...get().bookings.map((b) => b.id)) + 1;
        const booking: Booking = { ...input, id, status: "pending", createdAt: new Date().toISOString(), paid: 0, rated: false };
        const op = operatorBySlug(input.operatorSlug);
        set((s) => ({
          bookings: [booking, ...s.bookings],
          notices: [
            notice("operator", `בקשה חדשה ${pre("מ", input.customerName)} ל־${shortDate(input.date)}`, "/operator/requests"),
            notice("customer", `הבקשה נשלחה ${pre("ל", op?.name ?? "מפעיל")}. תשובה תוך 24 שעות.`, "/bookings"),
            ...s.notices,
          ],
        }));
        return id;
      },

      approve: (id) => {
        const { bookings } = get();
        const target = bookings.find((b) => b.id === id);
        if (!target) return { ok: false };
        const clash = bookings.find((b) => (b.status === "awaiting_payment" || b.status === "confirmed") && overlaps(b, target));
        if (clash) return { ok: false, reason: `כבר אישרתם את #${clash.id} באותו מועד` };
        const op = operatorBySlug(target.operatorSlug);
        set((s) => ({
          bookings: setStatus(s.bookings, id, "awaiting_payment"),
          notices: [notice("customer", `${op?.name} אישר את הבקשה ל־${shortDate(target.date)}`, `/pay/${id}`), ...s.notices],
        }));
        return { ok: true };
      },

      decline: (id) =>
        set((s) => {
          const b = s.bookings.find((x) => x.id === id);
          const op = b && operatorBySlug(b.operatorSlug);
          return {
            bookings: setStatus(s.bookings, id, "declined"),
            notices: [notice("customer", `${op?.name ?? "המפעיל"} לא זמין במועד. נעזור לכם למצוא מפעיל אחר.`, "/search"), ...s.notices],
          };
        }),

      propose: (id, date, time) =>
        set((s) => {
          const b = s.bookings.find((x) => x.id === id);
          const op = b && operatorBySlug(b.operatorSlug);
          return {
            bookings: s.bookings.map((x) => (x.id === id ? { ...x, proposal: { date, time } } : x)),
            notices: [notice("customer", `${op?.name ?? "המפעיל"} הציע מועד חלופי: ${shortDate(date)} ב־${time}`, "/bookings"), ...s.notices],
          };
        }),

      acceptProposal: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id && b.proposal ? { ...b, date: b.proposal.date, time: b.proposal.time, proposal: undefined, status: "awaiting_payment" } : b,
          ),
        })),

      cancel: (id) => set((s) => ({ bookings: setStatus(s.bookings, id, "cancelled") })),

      pay: (id, amount) =>
        set((s) => {
          const b = s.bookings.find((x) => x.id === id)!;
          const op = operatorBySlug(b.operatorSlug);
          return {
            bookings: setStatus(s.bookings, id, "confirmed", { paid: b.paid + amount }),
            notices: [
              notice("operator", `${b.customerName} שילמ/ה מקדמה להזמנה #${id}`, "/operator"),
              notice("customer", `התשלום התקבל. ${op?.name} שמור לכם ל־${shortDate(b.date)}`, "/bookings"),
              ...s.notices,
            ],
          };
        }),

      complete: (id) =>
        set((s) => {
          const b = s.bookings.find((x) => x.id === id)!;
          return { bookings: setStatus(s.bookings, id, "completed", { paid: bookingTotal(b) }) };
        }),

      rate: (id, review) =>
        set((s) => {
          const b = s.bookings.find((x) => x.id === id)!;
          const list = s.extraReviews[b.operatorSlug] ?? [];
          return {
            bookings: s.bookings.map((x) => (x.id === id ? { ...x, rated: true } : x)),
            extraReviews: { ...s.extraReviews, [b.operatorSlug]: [{ ...review, id: `u${id}`, verified: true }, ...list] },
          };
        }),

      toggleSaved: (slug) => set((s) => ({ saved: s.saved.includes(slug) ? s.saved.filter((x) => x !== slug) : [...s.saved, slug] })),

      toggleCompare: (slug) =>
        set((s) => {
          if (s.compare.includes(slug)) return { compare: s.compare.filter((x) => x !== slug) };
          if (s.compare.length >= 3) return { compare: [...s.compare.slice(1), slug] };
          return { compare: [...s.compare, slug] };
        }),
      clearCompare: () => set({ compare: [] }),

      markAllRead: (audience) => set((s) => ({ notices: s.notices.map((n) => (n.audience === audience ? { ...n, read: true } : n)) })),
      setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      editOperator: (e) => set((s) => ({ operatorEdits: { ...s.operatorEdits, ...e } })),
      setAdmin: (fn) => set((s) => ({ admin: fn(s.admin) })),

      toast: (text, tone = "success") => {
        const id = toastSeq++;
        set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
        setTimeout(() => get().dismissToast(id), 3600);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      reset: () => set(initial()),
    }),
    {
      name: "hafilu-demo-v1",
      storage: createJSONStorage(() => window.localStorage),
      skipHydration: true,
      partialize: (s) => Object.fromEntries(Object.entries(s).filter(([k]) => k !== "toasts")) as Partial<State>,
    },
  ),
);

/* Selectors */
export const useMyBookings = () => useStore((s) => s.bookings).filter((b) => b.customerId === CURRENT_CUSTOMER);
export { depositOf };

/** The operator as customers see it, including edits made in the operator panel and new reviews. */
export function useOperator(slug: string) {
  const edits = useStore((s) => s.operatorEdits);
  const extra = useStore((s) => s.extraReviews[slug]);
  const base = operatorBySlug(slug);
  if (!base) return undefined;
  const merged = slug === CURRENT_OPERATOR_SLUG
    ? {
        ...base,
        name: edits.name ?? base.name,
        tagline: edits.tagline ?? base.tagline,
        about: edits.about ?? base.about,
        packages: edits.packages ?? base.packages,
        cancellation: edits.cancellation ?? base.cancellation,
      }
    : base;
  if (!extra?.length) return merged;
  return { ...merged, reviews: [...extra, ...merged.reviews], reviewsCount: merged.reviewsCount + extra.length };
}
const CURRENT_OPERATOR_SLUG = "water-battle";

/** False until the persisted demo state has been read from this browser. */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
