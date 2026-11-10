import type { Metadata } from "next";
import { getAdminData } from "@/lib/db";
import { CatalogView } from "./catalog-view";

export const metadata: Metadata = { title: "לקוחות, מפעילים וקטלוג" };

export default async function CatalogPage() {
  const data = await getAdminData();
  return <CatalogView {...data} />;
}
