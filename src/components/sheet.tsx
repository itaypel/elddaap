"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./ui";

/**
 * Modal sheet built on <dialog>: focus is trapped, Esc closes, the page
 * behind is inert. Bottom sheet on compact widths, centered panel otherwise.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={cx(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-3xl bg-card p-0 text-ink shadow-float backdrop:bg-black/40 backdrop:backdrop-blur-[2px]",
        "sm:m-auto sm:max-h-[86dvh] sm:rounded-3xl",
        wide ? "sm:max-w-3xl" : "sm:max-w-lg",
      )}
    >
      <div className="flex max-h-[inherit] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <span aria-hidden className="absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-line-strong sm:hidden" />
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="-me-2 grid size-11 place-items-center rounded-full hover:bg-sunken" aria-label="סגירה">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="pb-safe border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </dialog>
  );
}
