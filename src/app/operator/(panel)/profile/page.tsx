import type { Metadata } from "next";
import { requireOperator } from "@/lib/db";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "פרופיל וחבילות" };

export default async function ProfilePage() {
  const op = await requireOperator();
  // Key by the saved data so the form resets to what's stored after each save.
  return <ProfileView key={op.packages.map((p) => p.id).join(",")} op={op} />;
}
