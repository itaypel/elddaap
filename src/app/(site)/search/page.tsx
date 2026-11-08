import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchView } from "./search-view";

export const metadata: Metadata = { title: "חיפוש הפעלות" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 text-muted sm:px-6">טוען תוצאות…</div>}>
      <SearchView />
    </Suspense>
  );
}
