import type { Metadata } from "next";
import { getAdminData } from "@/lib/db";
import { AdminBookings, AdminCommissions } from "@/components/admin-bookings";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "הזמנות ותשלומים" };

export default async function AdminBookingsPage() {
  const { bookings, settings } = await getAdminData();
  return (
    <>
      <PageTitle title="הזמנות ותשלומים" sub="כל ההזמנות בפלטפורמה, התשלומים והעמלות" />
      <div className="mt-6 flex flex-col gap-4">
        <AdminBookings bookings={bookings} commission={settings.commission} />
        <AdminCommissions bookings={bookings} settings={settings} />
      </div>
    </>
  );
}
