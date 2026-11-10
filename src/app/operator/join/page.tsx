import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyOperator, getProfile, getUser } from "@/lib/db";
import { JoinView } from "./join-view";

export const metadata: Metadata = {
  title: "הצטרפות כמפעיל",
  description: "הצטרפות חינם. יומן זמינות, ניהול הזמנות ותשלומים במקום אחד. משלמים עמלה רק על הזמנה שהושלמה.",
};

export default async function JoinPage() {
  if (await getMyOperator()) redirect("/operator");
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  // Signed-in visitors skip the account step; their details prefill the business form.
  const account = user ? { id: user.id, fullName: profile?.fullName ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "" } : null;
  return <JoinView account={account} />;
}
