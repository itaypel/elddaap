import type { Metadata } from "next";
import { getAdminData } from "@/lib/db";
import { AdminBookings } from "@/components/admin-bookings";

export const metadata: Metadata = { title: "הזמנות ותשלומים" };

export default async function AdminBookingsPage() {
  const { bookings, settings } = await getAdminData();
  return (
    <>
      <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">הזמנות ותשלומים</h1>
      <p className="mt-1.5 text-[15px] text-muted">כל ההזמנות בפלטפורמה, עם סטטוס תשלום ועמלה</p>
      <div className="mt-6">
        <AdminBookings bookings={bookings} commission={settings.commission} />
      </div>
    </>
  );
}
