import type { Metadata } from "next";
import { getAdminData } from "@/lib/db";
import { SettingsView } from "./settings-view";

export const metadata: Metadata = { title: "עמלות והגדרות" };

export default async function AdminSettingsPage() {
  const { operators, categories, settings } = await getAdminData();
  return <SettingsView operators={operators} categories={categories} settings={settings} />;
}
