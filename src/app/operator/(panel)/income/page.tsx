import type { Metadata } from "next";
import { requireOperator, getOperatorBookings, getOperatorPrivate, getSettings } from "@/lib/db";
import { IncomeView } from "./income-view";

export const metadata: Metadata = { title: "הכנסות" };

export default async function IncomePage() {
  const op = await requireOperator();
  const [bookings, settings, priv] = await Promise.all([getOperatorBookings(op.id), getSettings(), getOperatorPrivate(op.id)]);
  return <IncomeView bookings={bookings} settings={settings} bank={priv.bank} />;
}
