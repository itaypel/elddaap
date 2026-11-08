import { Suspense } from "react";
import type { Metadata } from "next";
import { getMyBookings, getNotices, getProfile, getSavedOperators, getSettings } from "@/lib/db";
import { BookingsView } from "./bookings-view";

export const metadata: Metadata = { title: "ההזמנות שלי", robots: { index: false } };

export default async function BookingsPage() {
  const [bookings, notices, saved, profile, settings] = await Promise.all([getMyBookings(), getNotices("customer"), getSavedOperators(), getProfile(), getSettings()]);
  return (
    <Suspense>
      <BookingsView bookings={bookings} notices={notices} saved={saved} profile={profile} deposit={settings.deposit} />
    </Suspense>
  );
}
