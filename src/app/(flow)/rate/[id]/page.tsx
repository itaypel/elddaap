import type { Metadata } from "next";
import { RateView } from "./rate-view";

export const metadata: Metadata = { title: "דירוג ההפעלה" };

export default async function RatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RateView id={Number(id)} />;
}
