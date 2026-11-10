import { Suspense } from "react";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/db";
import { SearchView } from "./search-view";

export const metadata: Metadata = { title: "חיפוש הפעלות" };

export const revalidate = 60;

export default async function SearchPage() {
  const { operators, activeCategories } = await getCatalog();
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 text-muted sm:px-6">טוען תוצאות…</div>}>
      <SearchView operators={operators} activeCategories={activeCategories} />
    </Suspense>
  );
}
