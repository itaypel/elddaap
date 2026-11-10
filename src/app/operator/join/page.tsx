import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyOperator } from "@/lib/db";
import { JoinView } from "./join-view";

export const metadata: Metadata = {
  title: "הצטרפות כמפעיל",
  description: "הצטרפות חינם. יומן זמינות, ניהול הזמנות ותשלומים במקום אחד. משלמים עמלה רק על הזמנה שהושלמה.",
};

export default async function JoinPage() {
  if (await getMyOperator()) redirect("/operator");
  return <JoinView />;
}
