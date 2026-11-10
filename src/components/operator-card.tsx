"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { type Operator, categoryById, money, priceFrom } from "@/lib/data";
import { useSaved } from "./save-button";
import { OperatorMedia } from "./brand";
import { Rating, cx } from "./ui";

export function OperatorCard({ op }: { op: Operator }) {
  const { saved, toggle } = useSaved(op.id);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-shadow hover:shadow-card">
      <OperatorMedia category={op.category} src={op.photos[0]} className="aspect-[16/10]" iconClassName="size-12">
        <span className="absolute top-3 start-3 rounded-full bg-card/95 px-2.5 py-0.5 text-[13px] font-semibold text-ink">{categoryById[op.category].name}</span>
      </OperatorMedia>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={saved ? `הסרת ${op.name} מהשמורים` : `שמירת ${op.name}`}
        className="absolute top-2 end-2 z-10 grid size-11 place-items-center rounded-full text-ink"
      >
        <span className="grid size-9 place-items-center rounded-full bg-card/95 shadow-sm">
          <Heart aria-hidden className={cx("size-[18px]", saved ? "fill-danger text-danger" : "")} />
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[17px] font-bold leading-snug">
            <Link href={`/operators/${op.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {op.name}
            </Link>
          </h3>
          <Rating value={op.rating} />
        </div>
        <p className="text-sm text-muted">
          גילאי {op.ageMin}–{op.ageMax} · {op.regionLabel}
        </p>
        <p className="mt-auto pt-2 text-sm text-muted">
          החל מ־<span className="text-base font-bold text-ink tabular">{money(priceFrom(op))}</span>
        </p>
      </div>
    </article>
  );
}
