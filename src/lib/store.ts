"use client";

import { create } from "zustand";

/* UI-only state. Everything durable lives in the database. */

export type Toast = { id: number; text: string; tone?: "success" | "neutral" | "danger" };

export type Session = {
  status: "loading" | "signedOut" | "signedIn";
  userId?: string;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  operator?: { id: string; slug: string; status: string } | null;
  saved: string[]; // operator ids
  unread: number;
};

type State = {
  session: Session;
  compare: string[];
  toasts: Toast[];
  setSession: (s: Partial<Session>) => void;
  setSaved: (operatorId: string, saved: boolean) => void;
  toggleCompare: (slug: string) => void;
  clearCompare: () => void;
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
};

let toastSeq = 1;

export const useStore = create<State>()((set, get) => ({
  session: { status: "loading", saved: [], unread: 0 },
  compare: [],
  toasts: [],

  setSession: (s) => set((st) => ({ session: { ...st.session, ...s } })),
  setSaved: (operatorId, saved) =>
    set((st) => ({
      session: { ...st.session, saved: saved ? [...new Set([...st.session.saved, operatorId])] : st.session.saved.filter((x) => x !== operatorId) },
    })),

  toggleCompare: (slug) =>
    set((s) => {
      if (s.compare.includes(slug)) return { compare: s.compare.filter((x) => x !== slug) };
      if (s.compare.length >= 3) return { compare: [...s.compare.slice(1), slug] };
      return { compare: [...s.compare, slug] };
    }),
  clearCompare: () => set({ compare: [] }),

  toast: (text, tone = "success") => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
    setTimeout(() => get().dismissToast(id), 3600);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
