import { Suspense } from "react";
import type { Metadata } from "next";
import { ApprovalsView } from "./approvals-view";

export const metadata: Metadata = { title: "אישורים ובקרת תוכן" };

export default function ApprovalsPage() {
  return (
    <Suspense>
      <ApprovalsView />
    </Suspense>
  );
}
