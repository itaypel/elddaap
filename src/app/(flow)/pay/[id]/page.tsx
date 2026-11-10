import type { Metadata } from "next";
import { getBooking, getProfile, getSettings } from "@/lib/db";
import { PayView } from "./pay-view";

export const metadata: Metadata = { title: "תשלום ושמירת התאריך", robots: { index: false } };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  const [booking, profile, settings] = await Promise.all([Number.isFinite(n) ? getBooking(n) : null, getProfile(), getSettings()]);
  // RLS returns only the signed-in customer's own booking.
  return <PayView booking={booking && booking.customerId === profile?.id ? booking : null} profile={profile} deposit={settings.deposit} />;
}
