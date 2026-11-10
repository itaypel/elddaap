import { Suspense } from "react";
import type { Metadata } from "next";
import { getAdminData } from "@/lib/db";
import { PeopleView } from "./people-view";

export const metadata: Metadata = { title: "לקוחות ומפעילים" };

export default async function PeoplePage() {
  const { operators, bookings, leads } = await getAdminData();
  return (
    <Suspense>
      <PeopleView operators={operators} bookings={bookings} leads={leads} />
    </Suspense>
  );
}
