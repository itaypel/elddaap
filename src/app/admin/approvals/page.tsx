import type { Metadata } from "next";
import { getAdminData } from "@/lib/db";
import { ApprovalsView } from "./approvals-view";

export const metadata: Metadata = { title: "אישורים ובקרה" };

export default async function ApprovalsPage() {
  const { operators } = await getAdminData();
  return <ApprovalsView operators={operators} />;
}
