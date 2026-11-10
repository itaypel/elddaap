import type { Metadata } from "next";
import { getBooking, getUser } from "@/lib/db";
import { RateView } from "./rate-view";

export const metadata: Metadata = { title: "דירוג ההפעלה", robots: { index: false } };

export default async function RatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  const [booking, user] = await Promise.all([Number.isFinite(n) ? getBooking(n) : null, getUser()]);
  return <RateView booking={booking && booking.customerId === user?.id ? booking : null} />;
}
