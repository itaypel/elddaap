import type { Metadata } from "next";
import { requireOperator, getOperatorBookings } from "@/lib/db";
import { CalendarView } from "./calendar-view";

export const metadata: Metadata = { title: "יומן זמינות" };

export default async function CalendarPage() {
  const op = await requireOperator();
  const bookings = await getOperatorBookings(op.id);
  return <CalendarView op={op} bookings={bookings} />;
}
