import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminData, getProfile } from "@/lib/db";
import { AdminNav } from "@/components/admin-chrome";

export const metadata: Metadata = { title: { default: "ניהול", template: "%s · ניהול הפעילו" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile?.isAdmin) notFound();
  const data = await getAdminData();
  const approvals = data.operators.filter((o) => o.status === "pending").length;

  return (
    <div className="min-h-dvh lg:flex">
      <AdminNav badges={{ approvals, complaints: 2 }} />
      <main id="main" className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-10">
        {children}
      </main>
    </div>
  );
}
