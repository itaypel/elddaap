import { Suspense } from "react";
import type { Metadata } from "next";
import { requireOperator, getOperatorBookings, getSettings } from "@/lib/db";
import { RequestsView } from "./requests-view";

export const metadata: Metadata = { title: "בקשות להזמנה" };

export default async function RequestsPage() {
  const op = await requireOperator();
  const [bookings, settings] = await Promise.all([getOperatorBookings(op.id), getSettings()]);
  return (
    <Suspense>
      <RequestsView op={op} bookings={bookings} settings={settings} />
    </Suspense>
  );
}
