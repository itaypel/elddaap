"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleSaved } from "@/app/actions";
import { useStore } from "@/lib/store";

/** Saved state + toggle for an operator. Signed-out visitors are sent to sign in. */
export function useSaved(operatorId: string) {
  const session = useStore((s) => s.session);
  const setSaved = useStore((s) => s.setSaved);
  const toast = useStore((s) => s.toast);
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const saved = session.saved.includes(operatorId);

  const toggle = () => {
    if (session.status !== "signedIn") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setSaved(operatorId, !saved); // optimistic
    start(async () => {
      const res = await toggleSaved(operatorId);
      if (!res.ok) {
        setSaved(operatorId, saved);
        toast(res.error, "danger");
      }
    });
  };
  return { saved, toggle, pending };
}
