import { getAdminData } from "@/lib/db";
import { OverviewView } from "./overview-view";

export default async function AdminOverview() {
  const data = await getAdminData();
  return <OverviewView bookings={data.bookings} operators={data.operators} settings={data.settings} leadsCount={data.leads.length} />;
}
