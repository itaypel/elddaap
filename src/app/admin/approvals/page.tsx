import { Suspense } from "react";
import type { Metadata } from "next";
import { getAdminData } from "@/lib/db";
import { ApprovalsView } from "./approvals-view";

export const metadata: Metadata = { title: "אישורים ובקרת תוכן" };

export default async function ApprovalsPage() {
  const { operators } = await getAdminData();
  return (
    <Suspense>
      <ApprovalsView operators={operators} />
    </Suspense>
  );
}
