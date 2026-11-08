import type { Metadata } from "next";
import { OperatorSidebar, OperatorTabBar, OperatorTopBar } from "@/components/operator-chrome";

export const metadata: Metadata = { title: { default: "אזור המפעילים", template: "%s · הפעילו למפעילים" } };

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <OperatorSidebar />
      <div className="min-w-0 flex-1">
        <OperatorTopBar />
        <main id="main" className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-10 lg:pb-12">
          {children}
        </main>
      </div>
      <OperatorTabBar />
    </div>
  );
}
