import type { Metadata } from "next";
import { JoinView } from "./join-view";

export const metadata: Metadata = {
  title: "הצטרפות כמפעיל",
  description: "הצטרפות חינם. יומן זמינות, ניהול הזמנות ותשלומים במקום אחד. משלמים עמלה רק על הזמנה שהושלמה.",
};

export default function JoinPage() {
  return <JoinView />;
}
