import type { Metadata } from "next";
import { getProfile } from "@/lib/db";
import { AccountView } from "./account-view";

export const metadata: Metadata = { title: "החשבון שלי" };

export default async function AccountPage() {
  const profile = (await getProfile())!;
  return <AccountView key={profile.username ?? ""} profile={profile} />;
}
