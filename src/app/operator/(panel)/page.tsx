import { requireOperator, getOperatorBookings, getSettings } from "@/lib/db";
import { DashboardView } from "./dashboard-view";

export default async function OperatorDashboard() {
  const op = await requireOperator();
  const [bookings, settings] = await Promise.all([getOperatorBookings(op.id), getSettings()]);
  return <DashboardView op={op} bookings={bookings} settings={settings} />;
}
