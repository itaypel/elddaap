"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

let client: ReturnType<typeof createBrowserClient> | undefined;

/** One browser client per tab; the session lives in cookies shared with the server. */
export function supabaseBrowser() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
