import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

/**
 * Sections that need a signed-in user. /operators (public profiles) is deliberately not here,
 * and neither is /operator/join: its wizard creates the operator's account as its first step.
 */
const needsAuth = (path: string) =>
  path !== "/operator/join" &&
  (["/bookings", "/operator", "/admin"].some((p) => path === p || path.startsWith(`${p}/`)) ||
    ["/book/", "/pay/", "/rate/"].some((p) => path.startsWith(p)));

/** Only same-site paths are allowed as a post-login destination. */
const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/bookings");

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseConfigured) return response;

  // Refresh the session cookie on every navigation so server components see a valid token.
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();

  const path = request.nextUrl.pathname;

  // Already signed in: the login page has nothing to offer, go straight to where they were heading.
  if (data?.claims && path === "/login") {
    const url = request.nextUrl.clone();
    const [pathname, search = ""] = safeNext(request.nextUrl.searchParams.get("next")).split("?");
    url.pathname = pathname;
    url.search = search ? `?${search}` : "";
    return NextResponse.redirect(url);
  }

  if (!data?.claims && needsAuth(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};
