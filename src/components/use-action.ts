"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Result } from "@/app/actions";
import { useStore } from "@/lib/store";

/**
 * Runs a server action, shows its error as a toast, refreshes server data on
 * success. Returns [run, pending] so buttons can show a busy state.
 */
export function useAction() {
  const router = useRouter();
  const toast = useStore((s) => s.toast);
  const [pending, start] = useTransition();

  function run<T>(action: () => Promise<Result<T>>, opts: { success?: string; tone?: "success" | "neutral"; onDone?: (data: T | undefined) => void } = {}) {
    start(async () => {
      const res = await action();
      if (!res.ok) {
        toast(res.error, "danger");
        return;
      }
      if (opts.success) toast(opts.success, opts.tone ?? "success");
      opts.onDone?.(res.data);
      router.refresh();
    });
  }

  return [run, pending] as const;
}
