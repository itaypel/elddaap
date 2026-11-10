"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { useStore } from "@/lib/store";

/**
 * Loads who is signed in for the chrome (header, tab bar, save hearts) without
 * making public pages dynamic. Reloads on sign-in, sign-out and navigation.
 */
export function SessionLoader() {
  const setSession = useStore((s) => s.setSession);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!supabaseConfigured) {
      setSession({ status: "signedOut" });
      return;
    }
    const db = supabaseBrowser();
    let cancelled = false;

    async function load() {
      const { data } = await db.auth.getUser();
      const user = data.user;
      if (!user) {
        // A token for an account that no longer exists: clear it so the server stops treating it as signed in.
        const { data: local } = await db.auth.getSession();
        if (local.session) await db.auth.signOut({ scope: "local" });
        if (!cancelled) setSession({ status: "signedOut", userId: undefined, operator: null, saved: [], unread: 0, isAdmin: false });
        return;
      }
      const [profile, operator, saved, unread] = await Promise.all([
        db.from("profiles").select("full_name, avatar_url, is_admin, username").eq("id", user.id).maybeSingle(),
        db.from("operators").select("id, slug, status").eq("owner_id", user.id).maybeSingle(),
        db.from("saved_operators").select("operator_id").eq("user_id", user.id),
        db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("audience", "customer").eq("read", false),
      ]);
      if (cancelled) return;
      setSession({
        status: "signedIn",
        userId: user.id,
        email: profile.data?.username ?? (user.email?.endsWith("@users.elddaap.app") ? undefined : user.email),
        name: profile.data?.full_name || user.user_metadata?.full_name || user.email,
        avatarUrl: profile.data?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
        isAdmin: !!profile.data?.is_admin,
        operator: operator.data ?? null,
        saved: (saved.data ?? []).map((r: { operator_id: string }) => r.operator_id),
        unread: unread.count ?? 0,
      });
    }

    load();
    const { data: sub } = db.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        load();
        router.refresh();
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [pathname, router, setSession]);

  return null;
}

export async function signOut() {
  await supabaseBrowser().auth.signOut();
}
