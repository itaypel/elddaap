import type { Metadata } from "next";
import { requireOperator } from "@/lib/db";
import { ReviewsView } from "./reviews-view";

export const metadata: Metadata = { title: "דירוגים" };

export default async function ReviewsPage() {
  const op = await requireOperator();
  return <ReviewsView op={op} />;
}
