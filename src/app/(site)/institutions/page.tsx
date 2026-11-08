import type { Metadata } from "next";
import { InstitutionsView } from "./institutions-view";

export const metadata: Metadata = {
  title: "למוסדות",
  description: "בקשה אחת, הצעות מחיר מכמה מפעילים. לבתי ספר, קייטנות, מתנ״סים, רשויות וועדי עובדים.",
};

export default function InstitutionsPage() {
  return <InstitutionsView />;
}
