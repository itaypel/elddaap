import { Suspense } from "react";
import type { Metadata } from "next";
import { RequestsView } from "./requests-view";

export const metadata: Metadata = { title: "בקשות להזמנה" };

export default function RequestsPage() {
  return (
    <Suspense>
      <RequestsView />
    </Suspense>
  );
}
