import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-chrome";

export const metadata: Metadata = { title: { default: "ניהול", template: "%s · ניהול הפעילו" }, robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      <AdminNav />
      <main id="main" className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-10">
        {children}
      </main>
    </div>
  );
}
