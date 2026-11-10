import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hourglass, TriangleAlert } from "lucide-react";
import { getMyOperator, getOperatorBookings } from "@/lib/db";
import { OperatorSidebar, OperatorTabBar, OperatorTopBar } from "@/components/operator-chrome";

export const metadata: Metadata = { title: { default: "אזור המפעילים", template: "%s · הפעילו למפעילים" }, robots: { index: false } };

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const op = await getMyOperator();
  if (!op) redirect("/operator/join");
  const bookings = await getOperatorBookings(op.id);
  const pending = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="flex min-h-dvh">
      <OperatorSidebar name={op.name} category={op.category} plan={op.plan} status={op.status} verified={op.verified} pending={pending} />
      <div className="min-w-0 flex-1">
        <OperatorTopBar />
        <main id="main" className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-10 lg:pb-12">
          {op.status === "pending" && (
            <p role="status" className="mb-6 flex gap-3 rounded-2xl bg-accent-soft p-4 text-[15px] leading-relaxed text-accent-ink">
              <Hourglass aria-hidden className="mt-0.5 size-5 shrink-0" />
              <span>
                <strong>הפרופיל בבדיקה.</strong> הצוות שלנו בודק את המסמכים, בדרך כלל תוך 2 ימי עסקים. בינתיים אפשר להשלים חבילות, תמונות ויומן.
              </span>
            </p>
          )}
          {(op.status === "rejected" || op.status === "suspended") && (
            <p role="alert" className="mb-6 flex gap-3 rounded-2xl bg-warning-soft p-4 text-[15px] leading-relaxed text-warning">
              <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
              <span>
                <strong>{op.status === "rejected" ? "הפרופיל לא אושר." : "הפרופיל מושהה ולא מופיע בחיפוש."}</strong> {op.reviewNote ?? "פנו אלינו לפרטים."}
              </span>
            </p>
          )}
          {children}
        </main>
      </div>
      <OperatorTabBar pending={pending} />
    </div>
  );
}
