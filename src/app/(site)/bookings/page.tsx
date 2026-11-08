import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingsView } from "./bookings-view";

export const metadata: Metadata = { title: "ההזמנות שלי" };

export default function BookingsPage() {
  return (
    <Suspense>
      <BookingsView />
    </Suspense>
  );
}
