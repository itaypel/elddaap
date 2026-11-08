import type { Metadata } from "next";
import { PayView } from "./pay-view";

export const metadata: Metadata = { title: "תשלום ושמירת התאריך" };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PayView id={Number(id)} />;
}
